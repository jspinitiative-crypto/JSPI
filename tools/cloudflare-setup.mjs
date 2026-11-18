// One-shot, idempotent Cloudflare setup for jspi.site (Pages + DNS + custom domains).
// Needs CLOUDFLARE_API_TOKEN in the environment. Safe to re-run at any time.
//   node tools/cloudflare-setup.mjs            full setup + deploy
//   node tools/cloudflare-setup.mjs --check    status report only (changes nothing)
import { spawnSync } from 'node:child_process';

const DOMAIN = 'jspi.site';
const PROJECT = 'jspi';
const CHECK_ONLY = process.argv.includes('--check');
const TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim().replace(/^["']|["']$/g, '');
const API = 'https://api.cloudflare.com/client/v4';

if (!TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN is not set. See DEPLOY.md, step 3.');
  process.exit(1);
}

async function cf(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch { /* non-JSON error body */ }
  return { ok: res.ok && json.success !== false, status: res.status, json, result: json.result, errors: json.errors || [] };
}
const errText = (r) => r.errors.map((e) => `${e.code}: ${e.message}`).join('; ') || `HTTP ${r.status}`;
const step = (m) => console.log(`\n== ${m}`);
const ok = (m) => console.log(`   ok  ${m}`);
const warn = (m) => console.log(`   !!  ${m}`);
function die(m) { console.error(`\nSTOP: ${m}`); process.exit(1); }

// 1. Token + account
step('Verifying API token');
console.log(`   token length: ${TOKEN.length} characters (expected about 40)`);
if (/^[0-9a-f]{32}$/.test(TOKEN)) {
  die('That looks like a Token ID or Global API Key (32 hex characters), not the token value. Roll the token in Cloudflare and copy the long value shown once.');
}
// Works for both user-owned and account-owned tokens: listing accounts only needs "Account Settings: Read".
const accounts = await cf('GET', '/accounts');
if (!accounts.ok) {
  die(`Token rejected (${errText(accounts)}). Check that the whole value was pasted and that it has "Account Settings: Read".`);
}
ok('token accepted');
let account = accounts.result.find((a) => a.id === process.env.CLOUDFLARE_ACCOUNT_ID) || accounts.result[0];
if (!account) die('Token sees no accounts.');
if (accounts.result.length > 1 && !process.env.CLOUDFLARE_ACCOUNT_ID) {
  warn(`Multiple accounts; using "${account.name}". Set CLOUDFLARE_ACCOUNT_ID to choose another.`);
}
const ACCOUNT = account.id;
ok(`account: ${account.name}`);

// 2. Zone
step(`Zone ${DOMAIN}`);
let zr = await cf('GET', `/zones?name=${DOMAIN}&account.id=${ACCOUNT}`);
if (!zr.ok) die(`Cannot read zones (${errText(zr)}).`);
let zone = zr.result[0];
if (!zone) {
  if (CHECK_ONLY) die('Zone does not exist yet. Run without --check.');
  const created = await cf('POST', '/zones', { name: DOMAIN, account: { id: ACCOUNT }, type: 'full' });
  if (!created.ok) die(`Could not create zone (${errText(created)}). Add the site manually in the dashboard (DEPLOY.md, step 4 fallback) and re-run.`);
  zone = created.result;
  ok('zone created');
} else {
  ok(`zone exists (status: ${zone.status})`);
}
const ZONE = zone.id;
console.log(`   Nameservers to set at Squarespace: ${(zone.name_servers || []).join(', ')}`);

// 3. Pages project
step(`Pages project "${PROJECT}"`);
let pr = await cf('GET', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}`);
if (!pr.ok && pr.status === 404) {
  if (CHECK_ONLY) die('Pages project does not exist yet. Run without --check.');
  pr = await cf('POST', `/accounts/${ACCOUNT}/pages/projects`, { name: PROJECT, production_branch: 'main' });
  if (!pr.ok) die(`Could not create Pages project (${errText(pr)}).`);
  ok('project created');
} else if (!pr.ok) {
  die(`Cannot read Pages project (${errText(pr)}). Token needs "Cloudflare Pages: Edit".`);
} else {
  ok('project exists');
}
const PAGES_HOST = pr.result.subdomain || `${PROJECT}.pages.dev`;
ok(`pages.dev host: ${PAGES_HOST}`);

// 4. Build + deploy (wrangler reads the same token from the environment)
if (!CHECK_ONLY) {
  step('Checking, building, and deploying the site');
  const env = { ...process.env, CLOUDFLARE_ACCOUNT_ID: ACCOUNT };
  const run = (cmd) => {
    const r = spawnSync(cmd, { stdio: 'inherit', shell: true, env });
    if (r.status !== 0) die(`Command failed: ${cmd}`);
  };
  run('python tools/check_site.py');
  run('python tools/build_dist.py');
  run(`npx wrangler pages deploy dist --project-name ${PROJECT} --branch main --commit-dirty=true`);
}

// 5. Custom domains on the Pages project
step('Custom domains');
for (const name of [DOMAIN, `www.${DOMAIN}`]) {
  const cur = await cf('GET', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains/${name}`);
  if (cur.ok) { ok(`${name}: ${cur.result.status}`); continue; }
  if (CHECK_ONLY) { warn(`${name}: not attached`); continue; }
  const add = await cf('POST', `/accounts/${ACCOUNT}/pages/projects/${PROJECT}/domains`, { name });
  if (add.ok) ok(`${name}: attached (${add.result.status})`);
  else warn(`${name}: ${errText(add)}`);
}

// 6. DNS records (proxied CNAMEs to Pages, plus the no-mail SPF/DMARC the domain already had)
step('DNS records');
async function ensure(type, name, content, extra = {}) {
  const fqdn = name === '@' ? DOMAIN : `${name}.${DOMAIN}`;
  const list = await cf('GET', `/zones/${ZONE}/dns_records?type=${type}&name=${fqdn}`);
  if (!list.ok) { warn(`${type} ${fqdn}: cannot read (${errText(list)})`); return; }
  const want = { type, name: fqdn, content, ttl: 1, ...extra };
  const existing = list.result.find((r) => (type === 'TXT' ? r.content.replace(/"/g, '') === content : true));
  if (existing && existing.content.replace(/"/g, '') === content && (extra.proxied === undefined || existing.proxied === extra.proxied)) {
    ok(`${type} ${fqdn}: already correct`); return;
  }
  if (CHECK_ONLY) { warn(`${type} ${fqdn}: missing or different`); return; }
  const res = existing && type === 'CNAME'
    ? await cf('PUT', `/zones/${ZONE}/dns_records/${existing.id}`, want)
    : await cf('POST', `/zones/${ZONE}/dns_records`, want);
  if (res.ok) ok(`${type} ${fqdn}: set`); else warn(`${type} ${fqdn}: ${errText(res)}`);
}
await ensure('CNAME', '@', PAGES_HOST, { proxied: true });
await ensure('CNAME', 'www', PAGES_HOST, { proxied: true });
await ensure('TXT', '@', 'v=spf1 -all');
await ensure('TXT', '_dmarc', 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s');

// 7. HTTPS hardening (best effort)
if (!CHECK_ONLY) {
  step('HTTPS settings');
  for (const [key, value] of [['always_use_https', 'on'], ['automatic_https_rewrites', 'on'], ['min_tls_version', '1.2'], ['ssl', 'full']]) {
    const r = await cf('PATCH', `/zones/${ZONE}/settings/${key}`, { value });
    if (r.ok) ok(`${key} = ${value}`); else warn(`${key}: ${errText(r)} (set in dashboard if you care)`);
  }
}

// 8. Status
step('Status');
zr = await cf('GET', `/zones/${ZONE}`);
const status = zr.result?.status;
console.log(`   Zone status: ${status}`);
if (status === 'active') {
  console.log(`   LIVE. Open https://${DOMAIN}/`);
} else {
  console.log(`   Zone is "${status}": nameservers at Squarespace still need to point to:`);
  (zr.result?.name_servers || []).forEach((n) => console.log(`     ${n}`));
  console.log('   After changing them, re-run:  npm run status');
}

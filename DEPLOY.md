# Deploying JSPI to Cloudflare (jspi.site)

Cloudflare Pages, direct upload via Wrangler. GitHub is only a backup copy; Cloudflare is not connected to it.

## One-time setup

1. Create/sign in to the Cloudflare account (the owner email), free plan.
2. Create an API token (Profile > API Tokens > Create Token > Custom token), permissions:
   - Account > Cloudflare Pages > Edit
   - Account > Account Settings > Read
   - Zone > Zone > Edit
   - Zone > DNS > Edit
   - Zone > Zone Settings > Edit
   Resources: this account, all zones. Keep the token out of the repo.
3. In PowerShell: `$env:CLOUDFLARE_API_TOKEN = "<token>"`
4. `npm install`, then `npm run setup` (creates the zone and Pages project, deploys, attaches `jspi.site` and `www.jspi.site`, creates DNS records).
5. At the registrar (Squarespace), set custom nameservers to the two Cloudflare names that step 4 prints. Turn DNSSEC off there first if it is on.
6. `npm run status` until it reports the zone is active, then open https://jspi.site/.

## Every later update

```
$env:CLOUDFLARE_API_TOKEN = "<token>"
npm run deploy
git add -A; git commit -m "Update site"; git push   # backup only
```

`npm run deploy` runs the static checker, builds `dist/` (public files only), and uploads it.

## Files

- `wrangler.jsonc`: Pages project name and output folder.
- `_headers`: security headers and caching. The www to apex redirect is a Cloudflare Redirect Rule (Pages `_redirects` cannot match hostnames).
- `tools/build_dist.py`: assembles `dist/` (excludes PDFs, print materials, source fonts, notes).
- `tools/cloudflare-setup.mjs`: idempotent API setup; `--check` reports status only.

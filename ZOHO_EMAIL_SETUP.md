# Official email: contact@jspi.site with Zoho Mail

This takes about 30 minutes. You do the sign-up and choose the password. DNS changes are made in Cloudflare, which already hosts jspi.site.

**Current DNS (checked 18 Nov 2026).** jspi.site has **no MX records**. It does have two "this domain sends no email" records:

| Type | Name | Current value | What to do |
|---|---|---|---|
| TXT | `jspi.site` | `v=spf1 -all` | **Edit** it (step 5). Do not add a second SPF record. |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | **Edit** it (step 7). |

If you leave them as they are, every message sent from contact@jspi.site will be rejected.

---

## 1. Create the Zoho account

1. Go to **zoho.com/mail** and choose **Pricing**. Scroll to the **Forever Free** plan: up to 5 users, 5 GB each, one domain. Then choose **Sign up**.
   - The free plan works through the web and the Zoho Mail mobile app only. If you later want Outlook, Apple Mail or the Gmail app (IMAP/POP), upgrade to **Mail Lite**.
2. Choose **Sign up with a domain I already own** and enter `jspi.site`.
3. Enter the administrator's details and **choose a strong password yourself**. Turn on two-factor authentication when asked.
4. Note which Zoho address you are using (`zoho.com`, `zoho.eu`, `zoho.sa`, …). It sets the exact record values in steps 4 to 6. **Always copy the values Zoho shows you.** The values below are for `zoho.com` accounts.

## 2. Verify you own jspi.site

1. In the Zoho setup screen, choose **TXT method** and copy the value. It looks like `zoho-verification=zbXXXXXXXX.zmverify.zoho.com`.
2. Open **Cloudflare dashboard → jspi.site → DNS → Records → Add record**:
   - Type `TXT`, Name `@`, Content: the value you copied, TTL Auto. Save.
3. Back in Zoho, click **Verify**. Cloudflare usually updates within a few minutes.

## 3. Create the mailbox contact@jspi.site

1. When Zoho asks you to create the first user, enter the username **`contact`**. This gives the mailbox `contact@jspi.site`.
2. Optional: add free aliases to the same mailbox, such as `info@`, `partners@` and `faculty@`. Go to **Admin Console → Users → contact → Mail Accounts → Add alias**.
3. Optional: add personal mailboxes for team members later, up to 5 users on the free plan.

## 4. MX records (receive mail)

If **Cloudflare Email Routing** is turned on (Cloudflare → jspi.site → Email → Email Routing), turn it off first. Then confirm no other MX records remain.

In **Cloudflare → DNS → Records**, add three records:

| Type | Name | Mail server | Priority |
|---|---|---|---|
| MX | `@` | `mx.zoho.com` | 10 |
| MX | `@` | `mx2.zoho.com` | 20 |
| MX | `@` | `mx3.zoho.com` | 50 |

For a `zoho.eu` account, use `mx.zoho.eu`, `mx2.zoho.eu` and `mx3.zoho.eu`. Other regions follow the same pattern.

## 5. SPF (allow Zoho to send for jspi.site)

**Edit** the existing TXT record on `jspi.site` that reads `v=spf1 -all`, and replace its content with:

```
v=spf1 include:zohomail.com ~all
```

Use the include value Zoho shows for your region; for EU accounts it is `zohomail.eu`. A domain must have **exactly one** SPF record.

## 6. DKIM (sign outgoing mail)

1. In Zoho, go to **Admin Console → Domains → jspi.site → Email Configuration → DKIM → Add**.
2. Enter the selector `zmail` and click **Generate**, then copy the long TXT value.
3. In Cloudflare, add a record: Type `TXT`, Name `zmail._domainkey`, Content: the copied value.
4. Back in Zoho, click **Verify**, then make sure DKIM is set to **Enabled**.

## 7. DMARC (policy)

**Edit** the existing TXT record named `_dmarc` and replace its content with:

```
v=DMARC1; p=none; rua=mailto:contact@jspi.site
```

Start with `p=none` while you check that everything passes. After 2 to 4 weeks of clean reports, tighten it to `p=quarantine`.

## 8. Test

1. Back in Zoho, open **Domains → jspi.site → Email Configuration**. All checks (MX, SPF, DKIM) should be green.
2. From a personal email address, send a message to **contact@jspi.site** and confirm it arrives in Zoho Mail.
3. Reply from contact@jspi.site. In Gmail, open the reply and choose **⋮ → Show original**. SPF, DKIM and DMARC should all show **PASS**.
4. Install the **Zoho Mail** app on your phone and sign in as contact@jspi.site.

## 9. Then publish the website

The website, Proposal.pdf and the financial proposal already use contact@jspi.site. **Deploy only after step 8 works**, so no message bounces:

```sh
npx wrangler login
npm run deploy
```

`npm run deploy` checks the site, builds `dist/` and uploads it to Cloudflare Pages. See DEPLOY.md for details.

## 10. Profile photo and signature (JSPI logo)

Files: `email-assets/JSPI_email_photo.png` (1024×1024, safe for circle crops) and `email-assets/JSPI_signature_logo.png`.

1. **Zoho profile photo:** at mail.zoho.com, click your avatar (top right) → **My Account** → hover over the photo → **Upload** → choose `JSPI_email_photo.png` → set **Photo visibility** to **Everyone**. Zoho users and the Zoho app now show the logo.
2. **Gmail recipients:** Gmail shows a sender photo only from that address's Google account. Go to accounts.google.com/signup → *Use my current email address instead* → enter `contact@jspi.site` → confirm with the code Zoho receives → set the profile photo to `JSPI_email_photo.png`. No Gmail inbox is created; this account only carries the photo.
3. **Outlook, Apple Mail and others:** create a free Gravatar at gravatar.com with `contact@jspi.site` and upload the same photo.
4. **Signature:** mail.zoho.com → ⚙ **Settings** → **Signature** → **Add new**. Insert `JSPI_signature_logo.png` with the image button, set its width to about 140 px, and add your name, role, `jspi.site` and `contact@jspi.site` under it. Set it as the default for `contact@jspi.site`.
5. **Later, verified logo (BIMI):** brand logos in Gmail and Apple Mail without a Google account need DMARC at `p=quarantine` or `p=reject` plus a paid VMC/CMC certificate. Revisit this after the brand is registered.

## Troubleshooting

- **Zoho says MX is not found:** wait 15 minutes. Check that the MX records are on `@` and that Email Routing is off.
- **Replies land in spam:** confirm that DKIM is *Enabled*, not only added, and that only one SPF record exists.
- **Free plan not offered at sign-up:** it can depend on region. Choose Mail Lite, the lowest paid tier.

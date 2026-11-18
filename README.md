# JSPI — Joint Surgical Pathway Initiative

The English-language JSPI website, built around **Your way to surgery.** Seven pages present JSPI as the complete pathway to surgery, not a single event: visitors find their stage, see the activities for it, and see the faculty, partners and impact behind it. Each concept lives on exactly one page.

## Run locally

No build, package installation, or server-side application is needed. From this folder, run:

~~~sh
python -m http.server 4173 --bind 127.0.0.1
~~~

Open http://127.0.0.1:4173/ in a browser. Stop the server with Ctrl+C. A simple static server is recommended over opening files directly, because browsers handle external SVG icon references differently on file URLs.

## Structure

~~~text
index.html                 Home: the loop, stage rail, stage finder, activities, Passport tiers, impact teaser
pathway.html               Find your stage: four stage plans, seven domains, Surgical Passport and tiers
activities.html            All activities with stage filter; Surgical Day format; FAQs
faculty.html               Faculty roles, what faculty receive, how to join
partners.html              Partner types (give / get), partnership steps, standards
impact.html                Live Year-1 impact tracker (starts at zero), what is measured
contact.html               Join JSPI: four audience cards and an email-draft composer
_redirects                 301s from retired pages (about, surgical-day, opportunities)
css/styles.css             Shared tokens, components, responsive styles, motion
js/main.js                 Accessible progressive enhancements
assets/logo/               Outlined SVG logos, PNG exports, and favicons
assets/icons/sprite.svg    Custom SVG icon set
assets/fonts/              Self-hosted fonts and their licenses
assets/images/             Social sharing graphic
tools/check_site.py        Standard-library static verification
tools/configure_deployment.py   Configure public metadata when a URL is known
IMPLEMENTATION.md          Delivery notes, actual verification, launch items
.nojekyll                  Serve as a build-free static site
robots.txt                 Crawler instructions
sitemap.xml                Seven-page sitemap for the GitHub Pages URL
~~~

The owner-provided initiative PDF and concept sheet are retained unchanged locally and excluded from version control and deployment. The finished website uses the standalone logo assets under assets/logo/.

## Updating the site

- Edit the relevant HTML page directly. Main content is present in HTML and does not depend on JavaScript rendering.
- Header and footer markup is deliberately repeated across the seven pages so navigation works without JavaScript or a build system. When changing either, update every page. Keep exactly one current-page link per header. The static checker verifies consistency while allowing the current-page attribute to differ.
- Activities have stable IDs on activities.html (surgical-day, skills-lab, journal-club, research, mentorship, observership, residency-prep, teach) and stages on pathway.html (explorer, builder, candidate, applicant). The home stage finder links to both. A card's data-stages attribute drives the stage filter.
- Impact counters on index.html and impact.html are updated by hand after each event: change the number and set the bar width on the meter's inner element (for example style="width:25%").
- Shared colors and typefaces are defined at the start of css/styles.css. The exact brand palette is burgundy #6D1A36, ivory #F6F1E7, muted gold #C9A227, and slate #2E3A4B.
- Fonts are Libre Caslon Display and Manrope, self-hosted in WOFF2 format. Original TTFs and SIL Open Font License files are included. There are no runtime font CDN requests, analytics, third-party scripts, or required remote assets.
- Use the outlined SVG wordmarks for sharp rendering. PNG exports are included for non-web use. See assets/logo/README.md for asset provenance.
- To change the contact address, replace contact@jspi.site across HTML files and js/main.js. Also update this documentation and rerun verification.
- Add real event information to the announcement sections only when supplied. Keep illustrative program topics and the sample structure distinct from an edition's published schedule.
- First-year evaluation figures are benchmarks, never achieved participation or outcome claims. Update them as the program develops.

## Current functionality

The mobile menu supports keyboard use, Escape dismissal, focus containment, and restoration. Domain tabs support arrow keys, Home/End, and direct links. FAQs use native HTML details. Motion includes the opening pathway line, scroll reveals, restrained hover effects, and a compacting header. Reduced-motion preferences are respected, and content stays available without animation or JavaScript.

Contact links open an email application. The contact form validates fields and composes a draft; it does not send, upload, or store anything. After preparing a draft, visitors can reopen it or copy the message. A configured mail application is needed for mailto links; copying the address or message supports webmail users.

There is no account system, registration backend, member database, Passport dashboard, evidence upload, payment flow, or automatic mailing list. The published educational framework is complete; those services can be connected later. Current enquiries and expressions of interest go to email.

## Verify

~~~sh
python tools/check_site.py
~~~

This checks the seven pages, local file references, page fragments, SVG symbols, CSS resources, unique metadata, heading counts, and header/footer consistency. Browser checks performed during delivery are recorded in IMPLEMENTATION.md; the static check alone does not certify accessibility or browser behavior.

## Production hosting

Production is Cloudflare Pages at https://jspi.site/ (see [DEPLOY.md](DEPLOY.md)). GitHub is a backup only; the GitHub Pages notes below are historical and Pages should stay disabled on the repository so there is a single canonical site.

## Deploy to GitHub Pages (not used)

Source repository: https://github.com/jspinitiative-crypto/JSPI, branch **main**.

Canonical metadata, social image URLs, robots.txt, and sitemap.xml are configured for the expected project-site URL: https://jspinitiative-crypto.github.io/JSPI/ . Pushing source code does not by itself confirm that Pages hosting is enabled.

To publish:

1. In repository **Settings → Pages**, choose **Deploy from a branch**.
2. Select **main** and **/(root)**, then save. No custom build workflow is required.
3. Once GitHub reports a successful deployment, check the public pages and navigation.

These steps follow [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

All internal links, fonts, scripts, styles, and images use relative paths and support repository subpaths. If a custom domain is added later, update the deployment URLs and rerun verification:

~~~sh
python tools/configure_deployment.py https://YOUR-CUSTOM-DOMAIN/
python tools/check_site.py
~~~

The URL helper is idempotent. It updates the canonical and Open Graph URLs, sitemap, and robots.txt without introducing a runtime or build dependency.

## Details to supply later

- Any custom domain that will replace the configured GitHub Pages URL.
- Edition-specific dates, venues, speakers, registration arrangements, and any associated fees or certificates.
- Social profile URLs if and when official accounts are supplied. No empty social links are shown.
- Service endpoints and privacy arrangements before collecting registration or Passport data on the site.

No country is part of the main identity. No founders, advisers, affiliations, sponsors, endorsements, or partner logos are displayed. No events, attendance figures, or achieved outcomes have been invented.

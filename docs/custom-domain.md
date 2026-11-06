# Hosting and the custom domain

The site is hosted on **Cloudflare Pages** (project `miri-hw`, free plan) at `https://miri-hw.pages.dev/`.
A GitHub Action (`.github/workflows/deploy.yml`) uploads the committed files on every push to `main`. There is no build on deploy, so run `node scripts/build.mjs` and commit its output as before.
`_headers` sets security headers and a long cache for the hashed audio clips. `404.html` and `robots.txt` are written by the build.

Planned domain: `miri-hw.co.il`. **Don't buy or connect it until the site owner says go.**

When it's time:
1. Buy the domain and add it in Cloudflare: Workers & Pages → `miri-hw` → Custom domains.
2. In `site.config.json`, set `"baseUrl": "https://miri-hw.co.il"` and run `node scripts/build.mjs`. That updates canonical, og:url, og:image, JSON-LD, sitemap.xml, robots.txt, 404.html and llms.txt. Internal links are relative, so nothing else changes.
3. Add a 301 from `miri-hw.pages.dev` to the domain (a Cloudflare Bulk Redirect, since `_redirects` can't match on the host name).
4. In Search Console and Bing Webmaster Tools, add the new property, submit `sitemap.xml`, and use "Change of address" from the `pages.dev` property. Keep both until the 301s settle.

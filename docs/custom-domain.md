# Moving to a custom domain (not done yet)

Planned domain: `miri-hw.co.il`. **Don't buy or connect it until the site owner says go.**

When it's time:
1. Buy the domain and point DNS at GitHub Pages:
   - `A` records for the apex: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - a `CNAME` for `www` → `shohamtal.github.io`
2. In the repo settings, under Pages → Custom domain, enter `miri-hw.co.il`. This commits a `CNAME` file. Then turn on "Enforce HTTPS".
3. In `site.config.json`, set `"baseUrl": "https://miri-hw.co.il"` and run `node scripts/build.mjs`. That updates canonical, og:url, og:image, JSON-LD, sitemap.xml and llms.txt. Internal links are relative, so nothing else changes.
4. Copy `docs/robots.txt.future` to `/robots.txt`. A robots.txt only works at a domain root, so it is useless on `github.io/homework-site/`.
5. In Search Console and Bing Webmaster Tools, add the new property, submit `sitemap.xml`, and use "Change of address" from the old property.
6. The old `shohamtal.github.io/homework-site/` URLs redirect automatically once the custom domain is set.

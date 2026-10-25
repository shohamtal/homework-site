# אתר שיעורי הבית

Interactive Hebrew study pages built from real homework topics: a simple explanation, a slider lab, step-by-step worked examples and practice that gives hints instead of answers.

Live site: https://shohamtal.github.io/homework-site/

## Structure

```
index.html                  home: subjects + full table of contents (with search)
<subject>/index.html        subject page: chapters and topics
<subject>/<slug>/index.html one topic page
assets/topics.js            the single list of subjects › chapters › topics (drives every index and prev/next link)
assets/site.css             shared look (tokens, light + dark)
assets/graph.js             window.G: coordinate-grid drawing + math/fraction helpers
assets/nav.js               site bar, breadcrumbs, prev/next on topic pages
assets/toc.js, index.css    table of contents rendering
```

Plain static files, no build. Preview locally with `python3 -m http.server` and open http://localhost:8000.

## Adding a topic

1. Add an entry to the right chapter in `assets/topics.js` (create the subject/chapter if new).
2. Copy an existing topic page to `<subject>/<slug>/index.html` and set `data-topic` on `<body>`.
3. Keep the page pattern: idea → slider lab → method → worked example → practice with hints.

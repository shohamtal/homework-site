# Homework site — notes for Claude

- Audience: Israeli middle-school kids (started with grade 8 math). Hebrew, RTL, plural address (נסו, בחרו), short simple sentences, no em-dashes, no student names.
- Every topic page follows the same pattern and look: sitebar → header.page → numbered section.card blocks: idea (mini cards) → **slider lab** (the parent's favorite: sliders + live graph + live explanation box + "נסו את אלה" presets) → method / pitfalls callout → worked-example stepper → practice with diagnostic feedback, progressive hints, solution only after 2 wrong tries → topicNav + footer.
- Reuse `assets/graph.js` (window.G) and `assets/site.css` classes; colors only via tokens.
- Register every new topic in `assets/topics.js`; indexes and prev/next are generated from it.
- Don't copy worksheet content verbatim (worksheets are usually copyrighted, e.g. karnafim.co.il): teach the topic with original examples and exercises.
- Site is public on GitHub Pages (main branch, root).
- Coming-soon subjects: `soon:true` in topics.js (shown as a disabled tile with a בקרוב chip, hidden from the TOC).
- Topic requests: Google Form (personal account shoamtal@gmail.com) + board sheet, no server. Closed topic list per subject+grade in `assets/curriculum.js` (site topics merged in from topics.js and marked "כבר באתר"); "אחר" opens free text that goes to a separate form field and never reaches the public board. Board sheet = QUERY over IMPORTRANGE of the responses sheet, read as gviz CSV. Config `assets/requests-config.js`, logic `assets/requests.js`, page `requests/`.

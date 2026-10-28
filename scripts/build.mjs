// Prerenders the parts of each page that come from assets/topics.js, so crawlers and link previews see real HTML:
// head tags (title, description, canonical, Open Graph, JSON-LD), site bar, breadcrumbs, prev/next, TOC, subject and
// grade tiles, and footer. Creates the grade pages (<subject>/<grade-id>/) and writes sitemap.xml, llms.txt and
// site.webmanifest. Run after changing topics.js or site.config.json:
//   node scripts/build.mjs               all pages
//   node scripts/build.mjs --only <slug> just that topic page (safe while other pages are being written)
// Topics whose page file doesn't exist yet are left out everywhere, so nothing links to a missing page.
// Output is committed; GitHub Pages serves the files as they are (no build on deploy).
// Generated regions sit between <!-- build:NAME --> and <!-- /build:NAME --> and are replaced on every run.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const BASE = cfg.baseUrl.replace(/\/$/, '') + '/';

const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['assets/topics.js', 'assets/nav.js', 'assets/toc.js']) vm.runInContext(read(f), ctx, {filename: f});
const {SITE, NAV, TOC} = ctx;
const ONLY = (i => i >= 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--only'));

/* drop topics that have no page yet, then chapters left empty */
for (const s of SITE.subjects) {
  for (const c of s.chapters) c.topics = c.topics.filter(t => {
    const ok = fs.existsSync(path.join(ROOT, s.id, t.slug, 'index.html'));
    if (!ok && !ONLY) console.warn(`skip ${s.id}/${t.slug}/ (no page yet)`);
    return ok;
  });
  s.chapters = s.chapters.filter(c => c.topics.length);
}
const gradesWithTopics = s => (s.grades || []).filter(g => s.chapters.some(c => c.grade === g.name));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT_INDEX = 'family=Secular+One&family=Rubik:wght@400;500;700;800&display=swap';
const FONT_LESSON = 'family=Secular+One&family=Rubik:wght@400;500;700;800&family=STIX+Two+Text:ital,wght@0,400;1,400;1,600&display=swap';

/* every page: path relative to the site root ('' = home) */
const pages = [{p: '', kind: 'home'}];
for (const s of SITE.subjects.filter(s => !s.soon)) {
  pages.push({p: `${s.id}/`, kind: 'subject', subj: s});
  for (const g of gradesWithTopics(s)) pages.push({p: `${s.id}/${g.id}/`, kind: 'grade', subj: s, grade: g});
  for (const c of s.chapters) for (const t of c.topics)
    pages.push({p: `${s.id}/${t.slug}/`, kind: 'topic', subj: s, chapter: c, topic: t, grade: s.grades.find(g => g.name === c.grade)});
}
pages.push({p: 'requests/', kind: 'requests'});

function meta(pg) {
  const m = cfg.pages[pg.p] || {};
  const title = m.title
    || (pg.kind === 'topic' ? `${pg.topic.title} · ${pg.chapter.name} ${pg.chapter.grade} · ${cfg.name}`
    : pg.kind === 'grade' ? `${pg.subj.name} ${pg.grade.name}: כל הנושאים · ${cfg.name}` : cfg.name);
  const description = m.description || (pg.topic ? pg.topic.desc
    : pg.kind === 'grade' ? `כל הנושאים ב${pg.subj.name} ל${pg.grade.name}: ${pg.subj.chapters.filter(c => c.grade === pg.grade.name).map(c => c.name).join(', ')}. לכל נושא הסבר, מעבדה ותרגול עם רמזים.`
    : `${cfg.name} ${cfg.slogan}`);
  return {title, description};
}

function jsonLd(pg, m) {
  const url = BASE + pg.p, out = [];
  if (pg.kind === 'home') {
    out.push({'@context': 'https://schema.org', '@type': 'WebSite', name: cfg.name, alternateName: `${cfg.name} ${cfg.slogan}`, url: BASE, inLanguage: 'he', description: m.description});
  } else {
    /* same items, names and order as the visible breadcrumb (NAV.bar) */
    const items = [{name: 'כל המקצועות', url: BASE}];
    if (pg.subj) items.push({name: pg.subj.name, url: BASE + pg.subj.id + '/'});
    if (pg.grade) items.push({name: pg.grade.name, url: BASE + pg.subj.id + '/' + pg.grade.id + '/'});
    if (pg.topic) items.push({name: pg.chapter.name, url: BASE + pg.subj.id + '/' + pg.grade.id + '/#' + pg.chapter.id}, {name: pg.topic.title, url});
    if (pg.kind === 'requests') items.push({name: 'בקשות נושאים', url});
    out.push({'@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({'@type': 'ListItem', position: i + 1, name: it.name, item: it.url}))});
  }
  if (pg.kind === 'grade') {
    const topics = pg.subj.chapters.filter(c => c.grade === pg.grade.name).flatMap(c => c.topics);
    out.push({'@context': 'https://schema.org', '@type': 'CollectionPage', name: m.title.split(' · ').slice(0, 2).join(' · '), description: m.description, url, inLanguage: 'he',
      isPartOf: {'@type': 'WebSite', name: cfg.name, url: BASE},
      mainEntity: {'@type': 'ItemList', numberOfItems: topics.length,
        itemListElement: topics.map((t, i) => ({'@type': 'ListItem', position: i + 1, name: t.title, url: `${BASE}${pg.subj.id}/${t.slug}/`}))}});
  }
  if (pg.faq && pg.faq.length) out.push({'@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: pg.faq.map(q => ({'@type': 'Question', name: q.q, acceptedAnswer: {'@type': 'Answer', text: q.a}}))});
  if (pg.kind === 'topic') {
    out.push({'@context': 'https://schema.org', '@type': 'LearningResource', name: pg.topic.title, description: m.description, url,
      inLanguage: pg.subj.id === 'english' ? ['he', 'en'] : 'he', isAccessibleForFree: true,
      learningResourceType: pg.subj.id === 'english' ? ['interactive activity', 'שיר', 'תרגול'] : ['הסבר', 'מעבדה אינטראקטיבית', 'דוגמה פתורה', 'תרגול'],
      educationalLevel: pg.chapter.grade, about: pg.chapter.name, teaches: pg.topic.title, keywords: pg.topic.tags.join(', '),
      audience: {'@type': 'EducationalAudience', educationalRole: 'student'},
      isPartOf: {'@type': 'WebSite', name: cfg.name, url: BASE}});
  }
  return out.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}

/* self-hosted GoatCounter script (copy of genjutsu-studio/docs/goatcounter.js), cache-busted by content hash */
const GC_V = createHash('sha1').update(read('assets/goatcounter.js')).digest('hex').slice(0, 8);
function head(pg, root) {
  const m = meta(pg), url = BASE + pg.p, img = BASE + 'assets/og.jpg';
  const fonts = `https://fonts.googleapis.com/css2?${pg.kind === 'topic' ? FONT_LESSON : FONT_INDEX}`;
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" href="${root}assets/miri/favicon-32.png" sizes="32x32" type="image/png">`,
    `<link rel="icon" href="${root}assets/miri/icon-192.png" sizes="192x192" type="image/png">`,
    `<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">`,
    `<link rel="manifest" href="${root}site.webmanifest">`,
    `<meta name="theme-color" content="${cfg.themeColor}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(cfg.name)}">`,
    `<meta property="og:locale" content="he_IL">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(cfg.name + ' ' + cfg.slogan)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    // fonts load without blocking the first paint (display=swap shows the fallback font until they arrive)
    `<link rel="preload" as="style" href="${fonts}">`,
    `<link rel="stylesheet" href="${fonts}" media="print" onload="this.media='all'">`,
    `<noscript><link rel="stylesheet" href="${fonts}"></noscript>`,
    `<script data-goatcounter="${cfg.goatcounter}" async src="${root}assets/goatcounter.js?v=${GC_V}"></script>`,
    jsonLd(pg, m)
  ].join('\n');
}

const footer = (pg, root) => `<footer class="site">${cfg.name} · ${cfg.slogan}${pg.kind === 'requests' ? '' : ` · <a href="${root}requests/">חסר לכם נושא? בקשו אותו</a>`}</footer>`;

/* the visible "שאלות שכולם שואלים" section: <h3> question + <p> answer pairs, as plain text */
const text = h => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function faqOf(html) {
  const sec = html.match(/<section class="card" id="faq">([\s\S]*?)<\/section>/);
  if (!sec) return [];
  return [...sec[1].matchAll(/<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(m => ({q: text(m[1]), a: text(m[2])}));
}

/* "כדאי לחזור גם על": related topics, then prev/next */
function related(pg, root) {
  const all = pg.subj.chapters.flatMap(c => c.topics), rel = (pg.topic.related || []).map(r => all.find(t => t.slug === r)).filter(Boolean);
  if (!rel.length) return '';
  return `<p class="related text"><strong>כדאי לחזור גם על:</strong> ${rel.map(t => `<a href="${root}${pg.subj.id}/${t.slug}/">${t.title}</a>`).join(' · ')}</p>\n`;
}

function region(html, name, content, file) {
  const re = new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(html)) throw new Error(`${file}: missing <!-- build:${name} --> region`);
  return html.replace(re, `<!-- build:${name} -->\n${content}\n<!-- /build:${name} -->`);
}

const lastmod = f => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', f], {cwd: ROOT}).toString().trim() || today(); } catch { return today(); } };
const today = () => new Date().toISOString().slice(0, 10);

/* grade pages are generated: created from this skeleton the first time, then only their regions are refreshed */
const gradeSkeleton = pg => `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- build:head -->
<!-- /build:head -->
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="../../assets/index.css">
</head>
<body data-root="../../" data-subject="${pg.subj.id}" data-grade="${pg.grade.id}">
<div class="wrap">
<!-- build:sitebar -->
<!-- /build:sitebar -->
<!-- build:gradehead -->
<!-- /build:gradehead -->
<section class="card">
  <!-- build:toc -->
  <!-- /build:toc -->
  <p class="empty-msg" id="none" hidden>לא מצאנו נושא כזה. נסו מילה אחרת.</p>
</section>
<!-- build:footer -->
<!-- /build:footer -->
</div>
<script src="../../assets/topics.js"></script>
<script src="../../assets/nav.js"></script>
<script src="../../assets/toc.js"></script>
<script>
TOC.render(document.getElementById('toc'), [], '../../', document.getElementById('q'), document.getElementById('none'));
</script>
</body>
</html>
`;

for (const pg of pages) {
  if (ONLY && !(pg.kind === 'topic' && pg.topic.slug === ONLY)) continue;
  const file = pg.p + 'index.html', root = '../'.repeat(pg.p.split('/').filter(Boolean).length) || './';
  if (pg.kind === 'grade' && !fs.existsSync(path.join(ROOT, file))) { fs.mkdirSync(path.join(ROOT, pg.p), {recursive: true}); fs.writeFileSync(path.join(ROOT, file), gradeSkeleton(pg)); }
  let html = read(file);
  pg.faq = faqOf(html);
  html = region(html, 'head', head(pg, root), file);
  html = region(html, 'footer', footer(pg, root), file);
  if (pg.kind !== 'home') html = region(html, 'sitebar', `<div id="sitebar" class="sitebar">${NAV.bar(root, pg.kind === 'requests' ? 'requests' : pg.subj?.id, pg.topic?.slug, pg.grade?.id)}</div>`, file);
  if (pg.kind === 'topic') html = region(html, 'topicnav', related(pg, root) + `<nav id="topicNav" class="topic-nav" aria-label="נושא קודם ונושא הבא">${NAV.topicNav(root, pg.subj.id, pg.topic.slug)}</nav>`, file);
  if (pg.kind === 'home') {
    html = region(html, 'subjects', `<div class="subjects" id="subjects">${TOC.subjects(SITE.subjects, root)}</div>`, file);
    html = region(html, 'toc', `<div id="toc">${TOC.html(SITE.subjects, root)}</div>`, file);
  }
  if (pg.kind === 'subject') html = region(html, 'grades', `<div class="subjects grades" id="grades">${TOC.grades(pg.subj, root)}</div>`, file);
  if (pg.kind === 'grade') {
    html = region(html, 'gradehead', `<header class="page">
  <div class="eyebrow">${pg.subj.name}</div>
  <h1>${pg.subj.name} ${pg.grade.name}</h1>
  <p class="lead">${pg.subj.id === 'english'
    ? 'בחרו נושא. בכל נושא שומעים, שרים ומשחקים, ובתרגול מירי נותנת רמז במקום תשובה. לוחצים פעם אחת על "הקשיבו" כדי להפעיל את הצלילים.'
    : 'בחרו נושא. בכל נושא יש הסבר, מעבדה שאפשר להזיז ותרגול שבו מירי נותנת רמז במקום תשובה. כדאי ללמוד לפי הסדר, כי כל נושא נשען על הקודם.'}</p>
  <label class="search" for="q"><span class="sr">חיפוש נושא</span>
    <input id="q" type="search" placeholder="חפשו נושא ב${pg.grade.name}" autocomplete="off">
  </label>
</header>`, file);
    html = region(html, 'toc', `<div id="toc">${TOC.html([pg.subj], root, {hideSubject: true, hideGrade: true, grade: pg.grade.name, chapterTag: 'h2'})}</div>`, file);
  }
  fs.writeFileSync(path.join(ROOT, file), html);
}

if (ONLY) { console.log(`built ${ONLY}`); process.exit(0); }

fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({
  name: `${cfg.name} · ${cfg.slogan}`, short_name: cfg.name, lang: 'he', dir: 'rtl', start_url: './', scope: './', display: 'browser',
  background_color: '#FAFAFC', theme_color: cfg.themeColor,
  icons: [{src: 'assets/miri/icon-192.png', sizes: '192x192', type: 'image/png'}, {src: 'assets/miri/icon-512.png', sizes: '512x512', type: 'image/png'}]
}, null, 2) + '\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(pg => `  <url><loc>${BASE + pg.p}</loc><lastmod>${lastmod(pg.p + 'index.html')}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`);

const llms = [`# ${cfg.name}`, '', `> ${cfg.name} ${cfg.slogan}. ${meta(pages[0]).description}`, '',
  'אתר לימוד חינמי בעברית לתלמידים בישראל. כל נושא הוא עמוד אחד עם הסבר קצר, מעבדה עם מחוונים שמראה איך המספרים משנים את הגרף, דוגמה פתורה צעד אחרי צעד, ותרגול שבודק את התשובה ונותן רמזים לפני שמראה פתרון.', ''];
for (const s of SITE.subjects.filter(s => !s.soon)) for (const c of s.chapters) {
  llms.push(`## ${s.name} ${c.grade} · ${c.name}`, '');
  for (const t of c.topics) llms.push(`- [${t.title}](${BASE}${s.id}/${t.slug}/): ${meta({p: `${s.id}/${t.slug}/`, kind: 'topic', topic: t, chapter: c}).description}`);
  llms.push('');
}
llms.push('## עמודים נוספים', '');
for (const pg of pages.filter(pg => pg.kind === 'subject' || pg.kind === 'grade'))
  llms.push(`- [${meta(pg).title.split(' · ')[0]}](${BASE}${pg.p}): ${meta(pg).description}`);
llms.push(
  `- [בקשות נושאים והצבעות](${BASE}requests/): ${meta({p: 'requests/'}).description}`, '');
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms.join('\n'));

console.log(`built ${pages.length} pages, sitemap.xml, llms.txt (base ${BASE})`);

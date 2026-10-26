// Prerenders the parts of each page that come from assets/topics.js, so crawlers and link previews see real HTML:
// head tags (title, description, canonical, Open Graph, JSON-LD), site bar, breadcrumbs, prev/next, TOC, subject tiles
// and footer. Also writes sitemap.xml and llms.txt. Run after changing topics.js or site.config.json:
//   node scripts/build.mjs
// Output is committed; GitHub Pages serves the files as they are (no build on deploy).
// Generated regions sit between <!-- build:NAME --> and <!-- /build:NAME --> and are replaced on every run.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const cfg = JSON.parse(read('site.config.json'));
const BASE = cfg.baseUrl.replace(/\/$/, '') + '/';

const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['assets/topics.js', 'assets/nav.js', 'assets/toc.js']) vm.runInContext(read(f), ctx, {filename: f});
const {SITE, NAV, TOC} = ctx;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT_INDEX = 'family=Secular+One&family=Rubik:wght@400;500;700;800&display=swap';
const FONT_LESSON = 'family=Secular+One&family=Rubik:wght@400;500;700;800&family=STIX+Two+Text:ital,wght@0,400;1,400;1,600&display=swap';

/* every page: path relative to the site root ('' = home) */
const pages = [{p: '', kind: 'home'}];
for (const s of SITE.subjects.filter(s => !s.soon)) {
  pages.push({p: `${s.id}/`, kind: 'subject', subj: s});
  for (const c of s.chapters) for (const t of c.topics) pages.push({p: `${s.id}/${t.slug}/`, kind: 'topic', subj: s, chapter: c, topic: t});
}
pages.push({p: 'requests/', kind: 'requests'});

function meta(pg) {
  const m = cfg.pages[pg.p] || {};
  const title = m.title || (pg.kind === 'topic' ? `${pg.topic.title} · ${pg.chapter.name} ${pg.chapter.grade} · ${cfg.name}` : cfg.name);
  const description = m.description || (pg.topic ? pg.topic.desc : `${cfg.name} ${cfg.slogan}`);
  return {title, description};
}

function jsonLd(pg, m) {
  const url = BASE + pg.p, out = [];
  if (pg.kind === 'home') {
    out.push({'@context': 'https://schema.org', '@type': 'WebSite', name: cfg.name, alternateName: `${cfg.name} ${cfg.slogan}`, url: BASE, inLanguage: 'he', description: m.description});
  } else {
    const items = [{name: cfg.name, url: BASE}];
    if (pg.subj) items.push({name: pg.subj.name, url: BASE + pg.subj.id + '/'});
    if (pg.topic) items.push({name: pg.topic.title, url});
    if (pg.kind === 'requests') items.push({name: 'בקשות נושאים', url});
    out.push({'@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({'@type': 'ListItem', position: i + 1, name: it.name, item: it.url}))});
  }
  if (pg.kind === 'topic') {
    out.push({'@context': 'https://schema.org', '@type': 'LearningResource', name: pg.topic.title, description: m.description, url,
      inLanguage: 'he', isAccessibleForFree: true, learningResourceType: ['הסבר', 'מעבדה אינטראקטיבית', 'דוגמה פתורה', 'תרגול'],
      educationalLevel: pg.chapter.grade, about: pg.chapter.name, teaches: pg.topic.tags, keywords: pg.topic.tags.join(', '),
      audience: {'@type': 'EducationalAudience', educationalRole: 'student'},
      isPartOf: {'@type': 'WebSite', name: cfg.name, url: BASE}});
  }
  return out.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}

function head(pg, root) {
  const m = meta(pg), url = BASE + pg.p, img = BASE + 'assets/og.png';
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">`,
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
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${pg.kind === 'topic' ? FONT_LESSON : FONT_INDEX}">`,
    jsonLd(pg, m)
  ].join('\n');
}

const footer = (pg, root) => `<footer class="site">${cfg.name} · ${cfg.slogan}${pg.kind === 'requests' ? '' : ` · <a href="${root}requests/">חסר לכם נושא? בקשו אותו</a>`}</footer>`;

function region(html, name, content, file) {
  const re = new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(html)) throw new Error(`${file}: missing <!-- build:${name} --> region`);
  return html.replace(re, `<!-- build:${name} -->\n${content}\n<!-- /build:${name} -->`);
}

const lastmod = f => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', f], {cwd: ROOT}).toString().trim() || today(); } catch { return today(); } };
const today = () => new Date().toISOString().slice(0, 10);

for (const pg of pages) {
  const file = pg.p + 'index.html', root = '../'.repeat(pg.p.split('/').filter(Boolean).length) || './';
  let html = read(file);
  html = region(html, 'head', head(pg, root), file);
  html = region(html, 'footer', footer(pg, root), file);
  if (pg.kind !== 'home') html = region(html, 'sitebar', `<div id="sitebar" class="sitebar">${NAV.bar(root, pg.subj?.id, pg.topic?.slug)}</div>`, file);
  if (pg.kind === 'topic') html = region(html, 'topicnav', `<nav id="topicNav" class="topic-nav" aria-label="נושא קודם ונושא הבא">${NAV.topicNav(root, pg.subj.id, pg.topic.slug)}</nav>`, file);
  if (pg.kind === 'home') {
    html = region(html, 'subjects', `<div class="subjects" id="subjects">${TOC.subjects(SITE.subjects, root)}</div>`, file);
    html = region(html, 'toc', `<div id="toc">${TOC.html(SITE.subjects, root)}</div>`, file);
  }
  if (pg.kind === 'subject') html = region(html, 'toc', `<div id="toc">${TOC.html([pg.subj], root, {hideSubject: true})}</div>`, file);
  fs.writeFileSync(path.join(ROOT, file), html);
}

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map(pg => `  <url><loc>${BASE + pg.p}</loc><lastmod>${lastmod(pg.p + 'index.html')}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`);

const llms = [`# ${cfg.name}`, '', `> ${cfg.name} ${cfg.slogan}. ${meta(pages[0]).description}`, '',
  'אתר לימוד חינמי בעברית לתלמידים בישראל. כל נושא הוא עמוד אחד עם הסבר קצר, מעבדה עם מחוונים שמראה איך המספרים משנים את הגרף, דוגמה פתורה צעד אחרי צעד, ותרגול שבודק את התשובה ונותן רמזים לפני שמראה פתרון.', ''];
for (const s of SITE.subjects.filter(s => !s.soon)) for (const c of s.chapters) {
  llms.push(`## ${s.name} · ${c.name} (${c.grade})`, '');
  for (const t of c.topics) llms.push(`- [${t.title}](${BASE}${s.id}/${t.slug}/): ${meta({p: `${s.id}/${t.slug}/`, kind: 'topic', topic: t, chapter: c}).description}`);
  llms.push('');
}
llms.push('## עמודים נוספים', '', `- [${SITE.subjects.find(s => !s.soon).name}: כל הנושאים](${BASE}math/): ${meta({p: 'math/'}).description}`,
  `- [בקשות נושאים והצבעות](${BASE}requests/): ${meta({p: 'requests/'}).description}`, '');
fs.writeFileSync(path.join(ROOT, 'llms.txt'), llms.join('\n'));

console.log(`built ${pages.length} pages, sitemap.xml, llms.txt (base ${BASE})`);

/* Fills the site bar, breadcrumbs and prev/next links on a topic page.
   The page's <body> carries data-root (path back to the site root), data-subject and data-topic.
   Placeholders: <div id="sitebar"></div> at the top, <nav id="topicNav"></nav> at the bottom. */
(function(){
const body=document.body, root=body.dataset.root||'./';
const subj=SITE.subjects.find(s=>s.id===body.dataset.subject);
const flat=[]; if(subj) subj.chapters.forEach(c=>c.topics.forEach(t=>flat.push({...t,chapter:c})));
const i=flat.findIndex(t=>t.slug===body.dataset.topic), cur=flat[i];
const url=t=>`${root}${subj.id}/${t.slug}/`;

const bar=document.getElementById('sitebar');
if(bar){
  let c=`<a href="${root}">כל המקצועות</a>`;
  if(subj) c+=` <span aria-hidden="true">‹</span> <a href="${root}${subj.id}/">${subj.name}</a>`;
  if(cur) c+=` <span aria-hidden="true">‹</span> <span>${cur.chapter.name}</span>`;
  bar.className='sitebar';
  bar.innerHTML=`<a class="brand" href="${root}">${SITE.name}</a><nav class="crumbs" aria-label="מיקום באתר">${c}</nav>`;
}
const nav=document.getElementById('topicNav');
if(nav && cur){
  const prev=flat[i-1], next=flat[i+1];
  nav.className='topic-nav'; nav.setAttribute('aria-label','נושא קודם ונושא הבא');
  nav.innerHTML=(prev?`<a href="${url(prev)}"><small>→ הנושא הקודם</small>${prev.title}</a>`:'<span class="empty"></span>')
    +(next?`<a class="next" href="${url(next)}"><small>הנושא הבא ←</small>${next.title}</a>`:`<a class="next" href="${root}${subj.id}/"><small>סיימתם את הפרק ←</small>לכל הנושאים ב${subj.name}</a>`);
}
})();

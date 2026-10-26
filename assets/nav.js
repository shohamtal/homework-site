/* Site bar, breadcrumbs and prev/next links on a page.
   The same functions run in the browser and in scripts/build.mjs, which writes their output into the HTML
   so crawlers see real links. In the browser they only fill placeholders that are still empty.
   The page's <body> carries data-root (path back to the site root), data-subject and data-topic. */
window.NAV={
  ctx(subjectId,slug){
    const subj=SITE.subjects.find(s=>s.id===subjectId), flat=[];
    if(subj) subj.chapters.forEach(c=>c.topics.forEach(t=>flat.push({...t,chapter:c})));
    const i=flat.findIndex(t=>t.slug===slug);
    return {subj,flat,i,cur:flat[i]};
  },
  bar(root,subjectId,slug){
    const {subj,cur}=NAV.ctx(subjectId,slug);
    let c=`<a href="${root}">כל המקצועות</a>`;
    if(subj) c+=` <span aria-hidden="true">‹</span> <a href="${root}${subj.id}/">${subj.name}</a>`;
    if(cur) c+=` <span aria-hidden="true">‹</span> <span>${cur.chapter.name}</span>`;
    return `<a class="brand" href="${root}">${SITE.name}</a><nav class="crumbs" aria-label="מיקום באתר">${c}</nav>`;
  },
  topicNav(root,subjectId,slug){
    const {subj,flat,i,cur}=NAV.ctx(subjectId,slug); if(!cur) return '';
    const url=t=>`${root}${subj.id}/${t.slug}/`, prev=flat[i-1], next=flat[i+1];
    return (prev?`<a href="${url(prev)}"><small>→ הנושא הקודם</small>${prev.title}</a>`:'<span class="empty"></span>')
      +(next?`<a class="next" href="${url(next)}"><small>הנושא הבא ←</small>${next.title}</a>`:`<a class="next" href="${root}${subj.id}/"><small>סיימתם את הפרק ←</small>לכל הנושאים ב${subj.name}</a>`);
  }
};
if(typeof document!=='undefined') (function(){
  const b=document.body, root=b.dataset.root||'./';
  const bar=document.getElementById('sitebar');
  if(bar && !bar.children.length){ bar.className='sitebar'; bar.innerHTML=NAV.bar(root,b.dataset.subject,b.dataset.topic); }
  const nav=document.getElementById('topicNav');
  if(nav && !nav.children.length){ const h=NAV.topicNav(root,b.dataset.subject,b.dataset.topic); if(h){ nav.className='topic-nav'; nav.setAttribute('aria-label','נושא קודם ונושא הבא'); nav.innerHTML=h; } }
})();

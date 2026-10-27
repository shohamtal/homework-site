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
  gradeOf(subj,chapter){ return (subj.grades||[]).find(g=>g.name===chapter.grade); },
  /* breadcrumbs: כל המקצועות ‹ subject ‹ grade ‹ chapter ‹ topic (the last one is the current page) */
  bar(root,subjectId,slug,gradeId){
    const {subj,cur}=NAV.ctx(subjectId,slug), sep=' <span class="sep" dir="ltr" aria-hidden="true">‹</span> ';
    const grade=subj&&(cur?NAV.gradeOf(subj,cur.chapter):(subj.grades||[]).find(g=>g.id===gradeId));
    const crumbs=[`<a href="${root}">כל המקצועות</a>`];
    if(subjectId==='requests') crumbs.push('<span aria-current="page">בקשות נושאים</span>');
    if(subj) crumbs.push(grade?`<a href="${root}${subj.id}/">${subj.name}</a>`:`<span aria-current="page">${subj.name}</span>`);
    if(grade) crumbs.push(cur?`<a href="${root}${subj.id}/${grade.id}/">${grade.name}</a>`:`<span aria-current="page">${grade.name}</span>`);
    if(cur){
      crumbs.push(grade?`<a href="${root}${subj.id}/${grade.id}/#${cur.chapter.id}">${cur.chapter.name}</a>`:`<span>${cur.chapter.name}</span>`);
      crumbs.push(`<span aria-current="page">${cur.title}</span>`);
    }
    return `<a class="brand" href="${root}"><img class="avatar" src="${root}assets/miri/avatar-64.webp" width="32" height="32" alt="">${SITE.name}</a><nav class="crumbs" aria-label="מיקום באתר">${crumbs.join(sep)}</nav>`;
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
  if(bar && !bar.children.length){ bar.className='sitebar'; bar.innerHTML=NAV.bar(root,b.dataset.subject,b.dataset.topic,b.dataset.grade); }
  const nav=document.getElementById('topicNav');
  /* "רמז ממירי": label the hint box that a hint button just filled (only boxes the click changed) */
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn || !(/Hint$/.test(btn.id) || btn.classList.contains('hnt'))) return;
    const scope=btn.closest('.hwc, section')||document, before=new Map();
    scope.querySelectorAll('.fb.hint').forEach(box=>before.set(box,box.innerHTML));
    setTimeout(()=>scope.querySelectorAll('.fb.hint').forEach(box=>{
      if(box.querySelector('.miri-tip') || before.get(box)===box.innerHTML) return;
      box.insertAdjacentHTML('afterbegin',`<span class="miri-tip"><img src="${root}assets/miri/hint-96.webp" width="40" height="40" loading="lazy" alt="">רמז ממירי</span>`);
    }));
  },true);
  /* a long equation split into neighbouring .eq spans (so it can wrap) must still read left to right:
     wrap each run of adjacent .eq spans in one LTR isolate, also inside lab output rendered later */
  const group=el=>el.querySelectorAll('.eq').forEach(e=>{
    if(e.parentElement.closest('.eq-run, .eq')) return;
    const run=[e]; let n=e.nextSibling;
    while(n){ if(n.nodeType===3 && !n.textContent.trim()){ n=n.nextSibling; continue; }
      if(n.nodeType===1 && n.classList.contains('eq')){ run.push(n); n=n.nextSibling; continue; } break; }
    if(run.length<2) return;
    const w=document.createElement('span'); w.className='eq-run'; w.dir='ltr'; e.before(w);
    for(let x=e, last=run[run.length-1];;){ const nx=x.nextSibling; w.appendChild(x); if(x===last) break; x=nx; }
  });
  group(b);
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.length && m.target.nodeType===1 && group(m.target))).observe(b,{childList:true,subtree:true});
  if(nav && !nav.children.length){ const h=NAV.topicNav(root,b.dataset.subject,b.dataset.topic); if(h){ nav.className='topic-nav'; nav.setAttribute('aria-label','נושא קודם ונושא הבא'); nav.innerHTML=h; } }
})();

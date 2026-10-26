/* Table of contents (subject › chapter › numbered topics) and subject tiles, built from SITE.
   scripts/build.mjs writes the same HTML into the pages; in the browser render() only fills an empty
   container and then wires the live search filter. */
window.TOC={
  norm:s=>s.toLowerCase().replace(/[֑-ׇ]/g,''),
  /* opt.grade: only chapters of that grade; opt.hideSubject / opt.hideGrade drop those headings */
  html(subjects, root, opt={}){
    const chapter=(s,c)=>`
        <div class="toc-chapter" id="${c.id}">
          <div class="toc-chead"><${opt.chapterTag||'h4'} class="toc-cname">${c.name}</${opt.chapterTag||'h4'}></div>
          <ol class="toc-list">${c.topics.map(t=>`
            <li data-q="${TOC.norm([t.title,t.desc,c.name,c.grade,s.name].concat(t.tags).join(' '))}">
              <a href="${root}${s.id}/${t.slug}/"><span class="toc-title">${t.title}</span><span class="toc-desc">${t.desc}</span>
              <span class="toc-tags">${t.tags.map(x=>`<span>${x}</span>`).join('')}</span></a>
            </li>`).join('')}
          </ol>
        </div>`;
    return subjects.filter(s=>s.chapters.length).map(s=>{
      const grades=(s.grades||[]).filter(g=>(!opt.grade||g.name===opt.grade) && s.chapters.some(c=>c.grade===g.name));
      return `
      <div class="toc-subject">${opt.hideSubject?'':`<h3 class="toc-sname"><a href="${root}${s.id}/">${s.name}</a></h3>`}
      ${grades.map(g=>`<div class="toc-grade-block">${opt.hideGrade?'':`<h3 class="toc-gname"><a href="${root}${s.id}/${g.id}/">${g.name}</a></h3>`}
      ${s.chapters.filter(c=>c.grade===g.name).map(c=>chapter(s,c)).join('')}</div>`).join('')}
      </div>`;
    }).join('');
  },
  /* grade tiles on a subject page; grades without topics yet show "בקרוב" */
  grades(subj, root){
    return (subj.grades||[]).map(g=>{
      const ch=subj.chapters.filter(c=>c.grade===g.name), n=ch.reduce((a,c)=>a+c.topics.length,0);
      if(!n) return `<div class="subject soon" aria-disabled="true"><span class="subject-name">${g.name}</span><span class="soon-chip">בקרוב</span></div>`;
      return `<a class="subject" href="${root}${subj.id}/${g.id}/"><span class="subject-name">${g.name}</span><span>${ch.map(c=>c.name).join(' · ')}</span><small>${n} נושאים</small></a>`;
    }).join('');
  },
  subjects(subjects, root){
    return subjects.map(s=>{
      if(s.soon) return `<div class="subject soon" aria-disabled="true"><span class="subject-name">${s.name}</span><span class="soon-chip">בקרוב</span></div>`;
      const n=s.chapters.reduce((a,c)=>a+c.topics.length,0);
      return `<a class="subject" href="${root}${s.id}/"><span class="subject-name">${s.name}</span><span>${s.desc}</span><small>${n} נושאים</small></a>`;
    }).join('');
  },
  render(el, subjects, root, input, none, opt={}){
    if(!el.querySelector('li[data-q]')) el.innerHTML=TOC.html(subjects, root, opt);
    if(!input) return;
    input.addEventListener('input',()=>{
      const q=TOC.norm(input.value.trim()); let shown=0;
      el.querySelectorAll('li[data-q]').forEach(li=>{ const ok=!q||li.dataset.q.includes(q); li.hidden=!ok; if(ok) shown++; });
      el.querySelectorAll('.toc-chapter').forEach(ch=>{ ch.hidden=!ch.querySelector('li:not([hidden])'); });
      if(none) none.hidden=shown>0;
    });
  }
};

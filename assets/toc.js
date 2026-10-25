/* Renders the table of contents (subject › chapter › numbered topics) from SITE, with a live search filter. */
window.TOC={
  render(el, subjects, root, input, none, opt={}){
    const norm=s=>s.toLowerCase().replace(/[֑-ׇ]/g,'');
    el.innerHTML=subjects.filter(s=>s.chapters.length).map(s=>`
      <div class="toc-subject">${opt.hideSubject?'':`<h3 class="toc-sname"><a href="${root}${s.id}/">${s.name}</a></h3>`}
      ${s.chapters.map(c=>`
        <div class="toc-chapter">
          <div class="toc-chead"><span class="toc-cname">${c.name}</span><span class="toc-grade">${c.grade}</span></div>
          <ol class="toc-list">${c.topics.map(t=>`
            <li data-q="${norm([t.title,t.desc,c.name,s.name].concat(t.tags).join(' '))}">
              <a href="${root}${s.id}/${t.slug}/"><span class="toc-title">${t.title}</span><span class="toc-desc">${t.desc}</span>
              <span class="toc-tags">${t.tags.map(x=>`<span>${x}</span>`).join('')}</span></a>
            </li>`).join('')}
          </ol>
        </div>`).join('')}
      </div>`).join('');
    if(!input) return;
    input.addEventListener('input',()=>{
      const q=norm(input.value.trim()); let shown=0;
      el.querySelectorAll('li[data-q]').forEach(li=>{ const ok=!q||li.dataset.q.includes(q); li.hidden=!ok; if(ok) shown++; });
      el.querySelectorAll('.toc-chapter').forEach(ch=>{ ch.hidden=!ch.querySelector('li:not([hidden])'); });
      if(none) none.hidden=shown>0;
    });
  }
};

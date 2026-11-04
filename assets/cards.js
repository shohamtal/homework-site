/* Card / step view for topic pages on phones (issue #10), plus progress kept in this browser.
   The page itself stays one long static page: this script only adds body.cards-on (narrow screens, JS on)
   and shows one section.card at a time with a progress bar and Prev / Next. Without JS, or on wide screens,
   nothing changes. Progress lives in this browser only (localStorage, nothing is sent anywhere) under
   miri-progress-v1: {"<subject>/<slug>": {seen:[i...], last:i, done:bool, practiced:bool, right:n, t:ms}}.
   Cards count as seen in the card view, and on wide screens when they scroll into view. A page is done when
   every card was seen and, if it has practice, one answer was right. right counts right practice answers.
   On grade, subject and home pages the same file marks topics (✓ done, ◐ started), shows how many are done,
   lists the last topics visited, and offers a reset and a backup file to move progress to another device. */
(function(){
  const KEY='miri-progress-v1', b=document.body;
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } };
  const save=p=>{ try{ localStorage.setItem(KEY,JSON.stringify(p)); }catch(e){} };

  /* grade, subject and home pages: progress marks, counts, "continue", reset and backup */
  if(!b.dataset.topic){
    const run=()=>hubs(load());
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
    return;
  }
  function hubs(p){
    const ids=Object.keys(p).filter(k=>p[k]&&typeof p[k]==='object'); if(!ids.length) return;
    const root=b.dataset.root||'./', S=window.SITE, topicOf={};
    if(S) S.subjects.forEach(s=>s.chapters.forEach(c=>c.topics.forEach(t=>{ topicOf[s.id+'/'+t.slug]={t,s,g:c.grade}; })));
    const idOf=href=>{ const m=/\/([a-z]+)\/([a-z0-9-]+)\/?$/.exec(new URL(href,location.href).pathname); return m&&m[1]+'/'+m[2]; };
    const state=k=>p[k]&&(p[k].done?'done':(p[k].seen||[]).length?'started':'');
    /* ✓ and ◐ next to topic links in the table of contents */
    const links=[...document.querySelectorAll('#toc a[href]')].filter(a=>topicOf[idOf(a.href)]||p[idOf(a.href)]);
    let done=0, total=0;
    links.forEach(a=>{
      const k=idOf(a.href); if(!k||!topicOf[k]&&!p[k]) return;
      if(!/\/grade-\d+\/?$/.test(new URL(a.href,location.href).pathname)) total++;
      const st=state(k); if(!st||a.querySelector('.done-mark,.prog-mark')) { if(st==='done') done++; return; }
      if(st==='done'){ done++; a.insertAdjacentHTML('beforeend',' <span class="done-mark" aria-label="סיימתם">✓</span>'); }
      else a.insertAdjacentHTML('beforeend',' <span class="prog-mark" aria-label="התחלתם">◐</span>');
    });
    /* grade page: "סיימתם X מתוך Y נושאים" with a bar */
    const toc=document.getElementById('toc');
    if(b.dataset.grade&&toc&&total){
      const d=document.createElement('div'); d.className='prog-sum';
      d.innerHTML='<p><strong>ההתקדמות שלכם בכיתה הזאת:</strong> סיימתם '+done+' מתוך '+total+' נושאים</p><div class="cards-bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+done+'"><span style="width:'+(done/total*100)+'%"></span></div>';
      toc.before(d);
    }
    /* subject and home tiles: "✓ 3" on each grade or subject that has finished topics */
    document.querySelectorAll('#grades a.subject, #subjects a.subject').forEach(a=>{
      const path=new URL(a.href,location.href).pathname, gm=/\/([a-z]+)\/(grade-\d+)\/?$/.exec(path), sm=/\/([a-z]+)\/?$/.exec(path);
      let n=0, st=0;
      ids.forEach(k=>{ const e=topicOf[k]; if(!e) return;
        const ok=gm?(e.s.id===gm[1]&&(e.s.grades.find(g=>g.name===e.g)||{}).id===gm[2]):sm&&e.s.id===sm[1];
        if(ok){ if(p[k].done) n++; else if((p[k].seen||[]).length) st++; } });
      if((n||st)&&!a.querySelector('.tile-prog')) a.insertAdjacentHTML('beforeend','<small class="tile-prog">'+(n?'✓ סיימתם '+n:'')+(n&&st?' · ':'')+(st?'◐ התחלתם '+st:'')+'</small>');
    });
    /* home and subject pages: the last topics visited */
    const anchor=document.querySelector('#subjects, #grades');
    if(anchor&&S){
      const subj=b.dataset.subject;
      const recent=ids.filter(k=>topicOf[k]&&p[k].t&&!p[k].done&&(!subj||topicOf[k].s.id===subj)).sort((x,y)=>p[y].t-p[x].t).slice(0,3);
      if(recent.length&&!document.querySelector('.prog-recent')){
        const sec=document.createElement('section'); sec.className='card prog-recent';
        sec.innerHTML='<h2>ממשיכים מאיפה שעצרתם</h2><ul class="prog-list"></ul>';
        recent.forEach(k=>{ const e=topicOf[k], li=document.createElement('li'), a=document.createElement('a');
          a.href=root+k+'/'; a.textContent=e.t.title; li.append(a);
          const sm=document.createElement('small'); sm.textContent=' · '+(S.subjects.length>1&&!subj?e.s.name+' · ':'')+e.g; li.append(sm);
          sec.querySelector('ul').append(li); });
        anchor.closest('section').before(sec);
      }
    }
    tools(b.dataset.grade?toc:anchor||toc);
  }
  /* reset, and a backup file so progress can move to another device or browser */
  function tools(where){
    if(!where||document.querySelector('.progress-reset')) return;
    const r=document.createElement('p'); r.className='progress-reset small';
    r.innerHTML='ההתקדמות נשמרת רק בדפדפן הזה. <button type="button" class="pr-save">שמירה לקובץ</button> <button type="button" class="pr-load">טעינה מקובץ</button> <button type="button" class="pr-reset">איפוס ההתקדמות</button><input type="file" accept=".json,application/json" hidden>';
    const f=r.querySelector('input');
    r.querySelector('.pr-reset').onclick=()=>{ if(confirm('לאפס את כל ההתקדמות בדפדפן הזה?')){ save({}); location.reload(); } };
    r.querySelector('.pr-save').onclick=()=>{
      const u=URL.createObjectURL(new Blob([JSON.stringify({app:'miri',v:1,progress:load()})],{type:'application/json'}));
      const a=document.createElement('a'); a.href=u; a.download='miri-progress.json'; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),1000);
    };
    r.querySelector('.pr-load').onclick=()=>f.click();
    f.onchange=()=>{ const file=f.files[0]; if(!file) return; file.text().then(t=>{
      let d; try{ d=JSON.parse(t); }catch(e){ d=null; }
      if(!d||d.app!=='miri'||typeof d.progress!=='object'){ alert('זה לא קובץ התקדמות של האתר.'); return; }
      const cur=load();
      Object.entries(d.progress).forEach(([k,v])=>{ if(!/^[a-z]+\/[a-z0-9-]+$/.test(k)||!v||typeof v!=='object') return;
        const o=cur[k]||{seen:[],last:0,done:false};
        cur[k]={seen:[...new Set([...(o.seen||[]),...(Array.isArray(v.seen)?v.seen.filter(Number.isInteger):[])])], last:Number.isInteger(v.last)?v.last:o.last||0,
          done:!!(o.done||v.done), practiced:!!(o.practiced||v.practiced), right:Math.max(o.right||0,+v.right||0), t:Math.max(o.t||0,+v.t||0)}; });
      save(cur); location.reload(); }); };
    where.after(r);
  }

  const id=(b.dataset.subject||'')+'/'+b.dataset.topic;
  const cards=[...document.querySelectorAll('.wrap > section.card')];
  if(cards.length<2) return;
  const wide=matchMedia('(min-width: 900px)');
  const prog=load(), me=prog[id]||(prog[id]={seen:[],last:0,done:false});
  const practice=cards.findIndex(c=>c.id==='practice');
  const title=c=>(c.querySelector('h2')||{}).textContent||'';
  let cur=0;

  /* the bar at the top and the buttons at the bottom; both exist only while cards are on */
  const top=document.createElement('div'); top.className='cards-top';
  top.innerHTML=`<div class="cards-meta"><span class="cards-count"></span><span class="cards-title"></span></div>
    <div class="cards-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${cards.length}"><span></span></div>`;
  const nav=document.createElement('div'); nav.className='cards-nav';
  nav.innerHTML='<button type="button" class="cards-prev">→ הקודם</button><button type="button" class="primary cards-next">הבא ←</button>';
  const first=cards[0];

  function mark(i){
    if(i===undefined) i=cur;
    if(!me.seen.includes(i)) me.seen.push(i);
    me.last=i; me.t=Date.now();
    const allSeen=cards.every((c,i)=>me.seen.includes(i));
    if(allSeen && (practice<0 || me.practiced)) me.done=true;
    save(prog);
  }
  function show(i,scroll){
    cur=Math.max(0,Math.min(cards.length-1,i));
    cards.forEach((c,k)=>c.classList.toggle('card-on',k===cur));
    const doneCount=new Set(me.seen.concat([cur])).size;
    top.querySelector('.cards-count').textContent=`${cur+1} / ${cards.length}`;
    top.querySelector('.cards-title').textContent=title(cards[cur]);
    const bar=top.querySelector('.cards-bar'); bar.setAttribute('aria-valuenow',doneCount);
    bar.querySelector('span').style.width=(doneCount/cards.length*100)+'%';
    nav.querySelector('.cards-prev').disabled=cur===0;
    nav.querySelector('.cards-next').textContent=cur===cards.length-1?'סיימתי ✓':'הבא ←';
    b.classList.toggle('cards-last',cur===cards.length-1);
    mark();
    if(scroll!==false) top.scrollIntoView({block:'start'});
  }
  function on(){
    if(b.classList.contains('cards-on')) return;
    b.classList.add('cards-on'); first.before(top); cards[cards.length-1].after(nav);
    const h=location.hash.slice(1), k=cards.findIndex(c=>c.id===h);
    show(k>=0?k:0,false);
  }
  function off(){
    if(!b.classList.contains('cards-on')) return;
    b.classList.remove('cards-on','cards-last'); document.documentElement.classList.remove('cards-pre'); top.remove(); nav.remove();
    cards.forEach(c=>c.classList.remove('card-on'));
  }
  nav.querySelector('.cards-prev').onclick=()=>show(cur-1);
  nav.querySelector('.cards-next').onclick=()=>{ if(cur<cards.length-1) show(cur+1); else { mark(); done(); } };
  function done(){
    me.done = practice<0 || !!me.practiced || me.done; save(prog);
    nav.querySelector('.cards-next').textContent=me.done?'סיימתם את הנושא ✓':'נסו לפתור תרגיל אחד ואז סיימתם';
    const tn=document.getElementById('topicNav'); if(tn) tn.scrollIntoView({block:'start',behavior:'smooth'});
  }
  /* links to #section (the page's own table of contents, hints that point to #lab) move between cards */
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]'); if(!a || !b.classList.contains('cards-on')) return;
    const k=cards.findIndex(c=>c.id===a.getAttribute('href').slice(1)); if(k<0) return;
    e.preventDefault(); show(k);
  });
  /* the phone keyboard pushes the fixed bar over the input: hide the bar while typing */
  document.addEventListener('focusin',e=>{ if(e.target.matches('input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,select')) b.classList.add('cards-typing'); });
  document.addEventListener('focusout',()=>b.classList.remove('cards-typing'));
  /* a right answer in practice counts toward finishing the page */
  if(practice>=0){
    const counted=new WeakMap(); /* feedback node → the text already counted, so a reused node counts again */
    new MutationObserver(()=>{
      const ok=[...cards[practice].querySelectorAll('.fb.ok')].filter(n=>n.textContent.trim()&&counted.get(n)!==n.textContent);
      if(!ok.length) return;
      ok.forEach(n=>counted.set(n,n.textContent)); me.right=(me.right||0)+1; me.practiced=true; mark(b.classList.contains('cards-on')?cur:practice);
    }).observe(cards[practice],{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  }
  /* wide screens: a card counts as seen once most of it, or all of the screen, was in view */
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(b.classList.contains('cards-on')||!e.isIntersecting) return;
      if(e.intersectionRatio>=.5||e.intersectionRect.height>=innerHeight*.6) mark(cards.indexOf(e.target));
    }),{threshold:[0,.25,.5,.75,1]});
    cards.forEach(c=>io.observe(c));
  }

  /* coming back: offer to continue where they stopped */
  const resumeAt=me.last; /* read now: marking the first card on load overwrites me.last */
  if(resumeAt>0 && !location.hash){
    const r=document.createElement('div'); r.className='fb hint cards-resume';
    r.innerHTML=`ביקרתם כאן קודם${me.right?(me.right===1?' ופתרתם נכון תרגיל אחד':` ופתרתם נכון ${me.right} תרגילים`):''}. <button type="button" class="primary">ממשיכים מאיפה שעצרתם</button> <button type="button">מההתחלה</button>`;
    const [go,again]=r.querySelectorAll('button');
    go.onclick=()=>{ r.remove(); if(b.classList.contains('cards-on')) show(resumeAt); else cards[resumeAt].scrollIntoView({block:'start'}); };
    again.onclick=()=>{ r.remove(); if(b.classList.contains('cards-on')) show(0); };
    (document.querySelector('header.page')||first).appendChild(r);
  }
  const apply=()=>{ if(wide.matches) off(); else on(); };
  (wide.addEventListener?wide.addEventListener('change',apply):wide.addListener(apply)); apply();
})();

/* Card / step view for topic pages on phones (issue #10), plus progress kept in this browser.
   The page itself stays one long static page: this script only adds body.cards-on (narrow screens, JS on)
   and shows one section.card at a time with a progress bar and Prev / Next. Without JS, or on wide screens,
   nothing changes. Progress lives in localStorage under miri-progress-v1: {"<subject>/<slug>": {seen:[i...],
   last:i, done:bool}}. A page is done when every card was seen and, if it has practice, one answer was right.
   On grade pages the same file marks finished topics with ✓ and offers a reset. */
(function(){
  const KEY='miri-progress-v1', b=document.body;
  const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } };
  const save=p=>{ try{ localStorage.setItem(KEY,JSON.stringify(p)); }catch(e){} };

  /* grade and subject pages: ✓ on finished topics, and a reset link */
  if(!b.dataset.topic){
    const p=load(), links=[...document.querySelectorAll('#toc a[href]')];
    let any=false;
    links.forEach(a=>{
      const m=/\/([a-z]+)\/([a-z0-9-]+)\/?$/.exec(new URL(a.href,location.href).pathname); if(!m) return;
      const e=p[m[1]+'/'+m[2]]; if(e&&e.done){ any=true; if(!a.querySelector('.done-mark')) a.insertAdjacentHTML('beforeend',' <span class="done-mark" aria-label="סיימתם">✓</span>'); }
    });
    const toc=document.getElementById('toc');
    if(any && toc && !document.querySelector('.progress-reset')){
      const r=document.createElement('p'); r.className='progress-reset small';
      r.innerHTML='<button type="button">איפוס ההתקדמות</button>';
      r.querySelector('button').onclick=()=>{ if(confirm('לאפס את כל ההתקדמות בדפדפן הזה?')){ save({}); location.reload(); } };
      toc.after(r);
    }
    return;
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

  function mark(){
    if(!me.seen.includes(cur)) me.seen.push(cur);
    me.last=cur;
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
  if(practice>=0) new MutationObserver(()=>{
    if(!me.practiced && cards[practice].querySelector('.fb.ok')){ me.practiced=true; mark(); }
  }).observe(cards[practice],{childList:true,subtree:true});

  /* coming back: offer to continue where they stopped */
  if(me.last>0 && !location.hash){
    const r=document.createElement('div'); r.className='fb hint cards-resume';
    r.innerHTML=`ביקרתם כאן קודם. <button type="button" class="primary">ממשיכים מאיפה שעצרתם</button> <button type="button">מההתחלה</button>`;
    const [go,again]=r.querySelectorAll('button');
    go.onclick=()=>{ r.remove(); if(b.classList.contains('cards-on')) show(me.last); else cards[me.last].scrollIntoView({block:'start'}); };
    again.onclick=()=>{ r.remove(); if(b.classList.contains('cards-on')) show(0); };
    (document.querySelector('header.page')||first).appendChild(r);
  }
  const apply=()=>{ if(wide.matches) off(); else on(); };
  (wide.addEventListener?wide.addEventListener('change',apply):wide.addListener(apply)); apply();
})();

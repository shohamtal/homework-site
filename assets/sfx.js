/* Small sound effects for the young math pages (grades 1 to 3), built on assets/sound.js:
   a chime when a practice answer is right, a soft "try again" when it is wrong, and a mute switch in the header.
   No clips, no autoplay: sounds only follow a tap, and mute is shared with the English pages. */
(function(){
  if(!window.S) return;
  const head=document.querySelector('header.page');
  if(head && !head.querySelector('.sound-mute')){
    const b=document.createElement('button'); b.type='button'; b.className='sound-mute sfx-mute';
    const show=()=>{ b.textContent=S.mute?'🔇 בלי צלילים':'🔊 עם צלילים'; b.setAttribute('aria-pressed',S.mute); };
    b.addEventListener('click',()=>{ S.mute=!S.mute; show(); }); show(); head.appendChild(b);
  }
  /* a feedback box that appears or changes right after a tap gets its sound; boxes changed by code alone stay silent */
  let lastTap=0, last=0;
  document.addEventListener('pointerdown',()=>{ lastTap=Date.now(); },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') lastTap=Date.now(); },true);
  const play=el=>{
    const now=Date.now(); if(now-lastTap>1500 || now-last<250) return; last=now;
    if(el.classList.contains('ok')) S.chime(); else if(el.classList.contains('err')) S.oops();
  };
  new MutationObserver(ms=>{
    for(const m of ms) for(const n of m.addedNodes){
      if(n.nodeType!==1) continue;
      const fb=n.matches('.fb.ok,.fb.err')?n:n.querySelector&&n.querySelector('.fb.ok,.fb.err');
      if(fb && fb.closest('#practice,.practice,[id^="pr"]')){ play(fb); return; }
    }
  }).observe(document.body,{childList:true,subtree:true});
})();

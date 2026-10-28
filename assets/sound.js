/* Sound for the English pages: window.S.
   Clips: each page lists the lines it needs in <script type="application/json" class="say-lines">{"id":"text"}</script>.
   scripts/gen_audio.py turns them into small MP3s in assets/audio/en/ and writes manifest.json (id -> file).
   Nothing plays before the first tap (iOS and Chrome block it): S.unlock() runs on the first pointer or key event.
   Mute is remembered per browser. If a clip is missing, speechSynthesis says the text instead.
     S.say(id, {rate})   play one clip (rate 0.75 = slower)          S.phoneme('b') = S.say('ph_b')
     S.play(notes, {tempo, onStep})  melody from [[note, beats, label?], ...] with a Web Audio synth; returns {stop}
     S.beat(n, {tempo, onBeat})      n soft drum beats; returns {stop}
     S.chime()  S.oops()  S.stop()  S.mute (get/set)  S.ready (Promise for the manifest)  S.duration(id) (seconds) */
(function(){
  const root=document.body.dataset.root||'./', dir=root+'assets/audio/en/';
  let ctx=null, master=null, manifest={}, lines={}, playing=new Set(), muted=false;
  try{ muted=localStorage.getItem('miri-mute')==='1'; }catch(e){}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('script.say-lines').forEach(s=>{ try{ Object.assign(lines, JSON.parse(s.textContent)); }catch(e){} });
  const ready=fetch(dir+'manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{}).then(m=>{ manifest=m; }).catch(()=>{});
  const buffers={};

  function unlock(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
      ctx=new AC(); master=ctx.createGain(); master.gain.value=muted?0:1; master.connect(ctx.destination);
    }
    if(ctx.state==='suspended') ctx.resume();
    if(window.speechSynthesis) speechSynthesis.getVoices();
  }
  ['pointerdown','keydown','touchend'].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));

  function track(node, stopFn){ const h={stop:stopFn||(()=>{ try{ node.stop(); }catch(e){} })}; playing.add(h); return h; }
  function load(id){
    if(buffers[id]) return buffers[id];
    const f=manifest[id]; if(!f) return Promise.reject(new Error('no clip '+id));
    return buffers[id]=fetch(dir+f).then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(b=>new Promise((ok,bad)=>ctx.decodeAudioData(b,ok,bad)));
  }
  function speak(text, rate){
    if(muted || !window.speechSynthesis || !text) return Promise.resolve();
    return new Promise(done=>{
      const u=new SpeechSynthesisUtterance(text.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1'));
      u.lang='en-US'; u.rate=0.85*(rate||1); u.onend=u.onerror=()=>done();
      const v=speechSynthesis.getVoices().find(v=>/^en[-_]US/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^en/i.test(v.lang)); if(v) u.voice=v;
      speechSynthesis.speak(u); track(null,()=>speechSynthesis.cancel());
    });
  }
  /* resolves when the clip has finished */
  async function say(id, opt={}){
    unlock(); await ready;
    if(!ctx) return speak(lines[id]||id, opt.rate);
    let buf; try{ buf=await load(id); }catch(e){ return speak(lines[id]||id, opt.rate); }
    if(muted) return;
    return new Promise(done=>{
      const src=ctx.createBufferSource(); src.buffer=buf; src.playbackRate.value=opt.rate||1;
      src.connect(master); src.onended=()=>{ playing.delete(h); done(); };
      const h=track(src); src.start();
    });
  }
  const NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const freq=n=>{ if(typeof n==='number') return n; const m=/^([A-G])(#|b)?(\d)$/.exec(n); if(!m) return 0;
    const semi=NOTE[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12*(+m[3]+1); return 440*Math.pow(2,(semi-69)/12); };
  function tone(f, t, len, type, vol){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'triangle'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+len);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+len+0.05); return o;
  }
  /* notes: [[note|0 for rest, beats, label], ...]; onStep(i) fires as each note starts */
  function play(notes, opt={}){
    unlock(); if(!ctx) return {stop(){}};
    const spb=60/(opt.tempo||100), t0=ctx.currentTime+0.08, timers=[], oscs=[]; let t=t0;
    notes.forEach((n,i)=>{
      const len=n[1]*spb;
      if(n[0]) oscs.push(tone(freq(n[0]), t, Math.max(0.12,len*0.9), opt.wave, opt.vol));
      if(opt.onStep) timers.push(setTimeout(()=>opt.onStep(i), (t-ctx.currentTime)*1000));
      t+=len;
    });
    if(opt.onEnd) timers.push(setTimeout(opt.onEnd, (t-ctx.currentTime)*1000));
    const h=track(null,()=>{ timers.forEach(clearTimeout); oscs.forEach(o=>{ try{ o.stop(); }catch(e){} }); });
    return h;
  }
  function beat(n, opt={}){
    unlock(); if(!ctx) return {stop(){}};
    const spb=60/(opt.tempo||100), t0=ctx.currentTime+0.08, timers=[], oscs=[];
    for(let i=0;i<n;i++){
      const t=t0+i*spb, o=ctx.createOscillator(), g=ctx.createGain();
      o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(50,t+0.15);
      g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+0.25); oscs.push(o);
      if(opt.onBeat) timers.push(setTimeout(()=>opt.onBeat(i),(t-ctx.currentTime)*1000));
    }
    return track(null,()=>{ timers.forEach(clearTimeout); oscs.forEach(o=>{ try{ o.stop(); }catch(e){} }); });
  }
  function chime(){ unlock(); if(!ctx) return; const t=ctx.currentTime+0.02; ['C5','E5','G5','C6'].forEach((n,i)=>tone(freq(n),t+i*0.09,0.35,'sine',0.2)); }
  function oops(){ unlock(); if(!ctx) return; const t=ctx.currentTime+0.02; tone(freq('E4'),t,0.18,'sine',0.15); tone(freq('C4'),t+0.16,0.3,'sine',0.15); }
  function stop(){ playing.forEach(h=>h.stop()); playing.clear(); if(window.speechSynthesis) speechSynthesis.cancel(); }

  /* the bar at the top of each English page: "הקשיבו" (unlock + greeting) and mute */
  function bar(el){
    if(!el) return;
    el.innerHTML=`<button type="button" class="primary sound-go">▶ הקשיבו</button><button type="button" class="sound-mute" aria-pressed="${muted}">${muted?'🔇 בלי צליל':'🔊 עם צליל'}</button>`;
    el.querySelector('.sound-go').addEventListener('click',()=>{ unlock(); say(el.dataset.hello||'hello'); });
    const m=el.querySelector('.sound-mute');
    m.addEventListener('click',()=>{ S.mute=!S.mute; m.setAttribute('aria-pressed',S.mute); m.textContent=S.mute?'🔇 בלי צליל':'🔊 עם צליל'; });
  }
  /* clip length in seconds (0 if there is no clip), for timing word highlights */
  async function duration(id){ unlock(); await ready; if(!ctx) return 0; try{ return (await load(id)).duration; }catch(e){ return 0; } }
  window.S={unlock, say, phoneme:(p,o)=>say('ph_'+p,o), play, beat, chime, oops, stop, ready, reduced, bar, duration,
    get mute(){ return muted; },
    set mute(v){ muted=!!v; try{ localStorage.setItem('miri-mute',muted?'1':'0'); }catch(e){} if(master) master.gain.value=muted?0:1; if(muted) stop(); }};
  document.querySelectorAll('.sound-bar').forEach(bar);
})();

/* Step-through tracer for the Python pages (computer science grades 7 to 9, issue #13).
   The lesson never needs real Python: the page builds the steps itself (usually from slider values) and this
   draws them. Python code always reads left to right inside the RTL page.
     PT.mount(el, {code, steps, input})
       code   : the program text (string, \n between lines)
       steps  : [{line: 1-based line that just ran (0 = before start), vars: {name: value}, out: 'all output so far', note: 'Hebrew text'}]
       input  : optional list of input() lines, shown above the output
     PT.repr(v) shows a JS value the way Python prints it in the variables table (str in quotes, True/False, lists).
     PT.str(v)  is what print(v) shows.
   Markup made: pre.code.pt-code (one span.pt-line per line), buttons, table.pt-vars, pre.pt-out, .pt-note.
   el.ptGo(i) jumps to step i; el.ptStep is the current step. */
(function(){
  const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  function repr(v){
    if(v===true) return 'True'; if(v===false) return 'False'; if(v===null||v===undefined) return 'None';
    if(typeof v==='string') return v.includes("'")&&!v.includes('"')?'"'+v+'"':"'"+v.replace(/'/g,"\\'")+"'";
    if(Array.isArray(v)) return '['+v.map(repr).join(', ')+']';
    if(typeof v==='number') return Number.isInteger(v)||!isFinite(v)?String(v):String(+v.toPrecision(15));
    if(v&&v.py) return v.py;            /* {py:'3.0'} forces an exact Python spelling */
    return String(v);
  }
  const str=v=>typeof v==='string'?v:repr(v);
  function mount(el,o){
    const lines=o.code.replace(/\n$/,'').split('\n'), steps=o.steps&&o.steps.length?o.steps:[{line:0,vars:{},out:''}];
    el.classList.add('pt');
    el.innerHTML=
      '<pre class="code pt-code" dir="ltr" lang="en">'+lines.map((l,i)=>'<span class="pt-line" data-n="'+(i+1)+'"><span class="pt-n" aria-hidden="true">'+(i+1)+'</span>'+(esc(l)||' ')+'</span>').join('')+'</pre>'+
      '<div class="pad pt-pad"><button type="button" class="pt-back" aria-label="צעד אחורה">◀ אחורה</button>'+
      '<button type="button" class="primary pt-next">שורה הבאה ▶</button>'+
      '<button type="button" class="pt-all">עד הסוף</button><button type="button" class="pt-reset">מההתחלה</button>'+
      '<span class="pt-count" aria-live="off"></span></div>'+
      '<div class="pt-note fb hint" aria-live="polite"></div>'+
      '<div class="pt-grid"><div><p class="pt-h">משתנים</p><table class="pt-vars" dir="ltr"></table></div>'+
      '<div><p class="pt-h">פלט</p>'+(o.input&&o.input.length?'<p class="pt-in">קלט: <span dir="ltr" lang="en">'+o.input.map(esc).join(' ↵ ')+'</span></p>':'')+
      '<pre class="pt-out" dir="ltr" lang="en"></pre></div></div>';
    const $=s=>el.querySelector(s), ls=[...el.querySelectorAll('.pt-line')];
    function go(i){
      i=Math.max(0,Math.min(steps.length-1,i)); el.ptStep=i;
      const s=steps[i], prev=i?steps[i-1].vars:{};
      ls.forEach(l=>l.classList.toggle('on',+l.dataset.n===s.line));
      const names=Object.keys(s.vars);
      $('.pt-vars').innerHTML=names.length?names.map(n=>{
        const v=repr(s.vars[n]), ch=!(n in prev)||repr(prev[n])!==v;
        return '<tr'+(ch&&i?' class="ch"':'')+'><th>'+esc(n)+'</th><td>'+esc(v)+'</td></tr>';
      }).join(''):'<tr><td class="pt-empty">עדיין אין משתנים</td></tr>';
      $('.pt-out').textContent=s.out||'';
      $('.pt-note').textContent=s.note||(i===0?'לחצו "שורה הבאה" כדי להריץ את השורה הראשונה.':i===steps.length-1?'התוכנית הסתיימה.':'');
      $('.pt-count').textContent='צעד '+i+' מתוך '+(steps.length-1);
      $('.pt-back').disabled=i===0; $('.pt-next').disabled=$('.pt-all').disabled=i===steps.length-1;
      const on=el.querySelector('.pt-line.on'), pre=$('.pt-code');
      if(on&&(on.offsetTop<pre.scrollTop||on.offsetTop>pre.scrollTop+pre.clientHeight-20)) pre.scrollTop=on.offsetTop-pre.clientHeight/2;
    }
    $('.pt-next').onclick=()=>go(el.ptStep+1); $('.pt-back').onclick=()=>go(el.ptStep-1);
    $('.pt-all').onclick=()=>go(steps.length-1); $('.pt-reset').onclick=()=>go(0);
    el.ptGo=go; go(o.start||0);
  }
  window.PT={mount,repr,str};
})();

/* "הריצו בעצמכם": an optional Python box for the computer science pages (issue #13).
   Markup (static, the lesson never depends on it):
     <div class="pyrun">
       <textarea class="pyrun-code" dir="ltr" lang="en" spellcheck="false">print("hi")</textarea>
       <textarea class="pyrun-in" dir="ltr" lang="en" placeholder="קלט (שורה לכל input)"></textarea>   (optional)
       <button type="button" class="primary pyrun-go">▶ הריצו בעצמכם</button>
       <pre class="pyrun-out" dir="ltr" lang="en"></pre>
     </div>
   Nothing is fetched until the first tap. Then Pyodide (free, from jsdelivr, about 10 MB, cached by the browser)
   loads inside a Web Worker, so an endless loop can be stopped: a run that takes longer than 5 seconds kills the
   worker and the next run starts a fresh one. input() reads the lines of .pyrun-in, one per call. */
(function(){
  const URL_PY='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  const LIMIT=5000;
  const SRC=`importScripts('${URL_PY}pyodide.js');
let py=null;
self.onmessage=async e=>{
  const {code,input}=e.data, out=[];
  try{
    if(!py){ py=await loadPyodide({indexURL:'${URL_PY}'}); }
    py.setStdout({batched:s=>out.push(s)}); py.setStderr({batched:s=>out.push(s)});
    const lines=(input||'').split('\\n'); let i=0;
    py.setStdin({stdin:()=>i<lines.length?lines[i++]:null});
    await py.runPythonAsync(code);
    self.postMessage({ok:true,out:out.join('\\n')});
  }catch(err){
    const msg=String(err&&err.message||err), last=msg.trim().split('\\n').filter(Boolean).pop()||msg;
    self.postMessage({ok:false,out:out.join('\\n'),err:last});
  }
};`;
  let worker=null, ready=false;
  const fresh=()=>{ if(worker) worker.terminate(); worker=new Worker(URL.createObjectURL(new Blob([SRC],{type:'text/javascript'}))); ready=false; };
  function run(code,input){
    if(!worker) fresh();
    return new Promise(res=>{
      const t=setTimeout(()=>{ fresh(); res({ok:false,out:'',err:'timeout'}); }, ready?LIMIT:LIMIT+40000);
      worker.onmessage=e=>{ clearTimeout(t); ready=true; res(e.data); };
      worker.onerror=()=>{ clearTimeout(t); fresh(); res({ok:false,out:'',err:'load'}); };
      worker.postMessage({code,input});
    });
  }
  document.addEventListener('click',async e=>{
    const go=e.target.closest('.pyrun-go'); if(!go) return;
    const box=go.closest('.pyrun'), out=box.querySelector('.pyrun-out');
    if(!navigator.onLine){ out.textContent='אין חיבור לאינטרנט. אפשר לעקוב אחרי הקוד בטבלה למעלה, היא עובדת גם בלי רשת.'; out.className='pyrun-out err he'; return; }
    go.disabled=true; out.className='pyrun-out wait he';
    out.textContent=ready?'רץ…':'טוענים את פייתון, זה לוקח כמה שניות רק בפעם הראשונה…';
    const r=await run(box.querySelector('.pyrun-code').value,(box.querySelector('.pyrun-in')||{}).value);
    go.disabled=false;
    if(r.ok){ out.className='pyrun-out ok'; out.textContent=r.out||'(התוכנית רצה ולא הדפיסה כלום)'; }
    else{
      const he=r.err==='timeout'||r.err==='load';
      out.className='pyrun-out err'+(he?' he':'');
      out.textContent=r.err==='timeout'?'התוכנית רצה יותר מדי זמן ועצרנו אותה. אולי יש לולאה שלא נגמרת?'
        : r.err==='load'?'לא הצלחנו לטעון את פייתון. נסו שוב מאוחר יותר.'
        : (r.out?r.out+'\n':'')+r.err;
    }
  });
})();

/* Shared math + graph helpers. Every topic page loads this and uses window.G.
   Graph grid is -5..5 on both axes, drawn in a 240x240 SVG (20px per square). */
(function(){
const S=20, O=120, MINUS='−';
const sx=x=>O+S*x, sy=y=>O-S*y;
let uid=0;

function toFrac(v){
  for(let d=1; d<=12; d++){ const n=v*d; if(Math.abs(n-Math.round(n))<1e-9) return [Math.round(n),d]; }
  return [v,1];
}
function numTxt(v){ const r=Math.round(v*1000)/1000; return (r<0?MINUS:'')+Math.abs(r); }
function fracHTML(v){
  const [n,d]=toFrac(Math.abs(v));
  return d===1? String(n) : `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
}
function signedFracHTML(v){ return (v<0?MINUS:'')+fracHTML(v); }
const UNI={'1/4':'¼','1/2':'½','1/3':'⅓','3/4':'¾','2/3':'⅔'};
function fracTxt(v){
  const [n,d]=toFrac(Math.abs(v));
  return (v<0?MINUS:'')+(d===1?String(n):(UNI[n+'/'+d]||n+'/'+d));
}
/* y = mx + b as HTML (m in pink, b highlighted) */
function eqHTML(m,b){
  let s='<span class="eq"><i>y</i> = ';
  if(m===0){ s+=numTxt(b); }
  else{
    const c = m===1?'': m===-1?MINUS : (m<0?MINUS:'')+fracHTML(m);
    s+=`<span class="m">${c}</span><i>x</i>`;
    if(b>0) s+=` + <span class="b">${fracHTML(b)}</span>`;
    if(b<0) s+=` ${MINUS} <span class="b">${fracHTML(b)}</span>`;
  }
  return s+'</span>';
}
/* y = mx + b as plain text (for <option>) */
function eqText(m,b){
  let s='y = ';
  if(m===0) return s+fracTxt(b);
  const [n,d]=toFrac(Math.abs(m));
  const mag = d===1 ? (n===1?'':String(n)) : (UNI[n+'/'+d]||n+'/'+d);
  s+=(m<0?MINUS:'')+mag+'x';
  if(b>0) s+=' + '+fracTxt(b); if(b<0) s+=' '+MINUS+' '+fracTxt(-b);
  return s;
}
/* smallest number of steps right that lands the line on a grid corner */
function runFor(m){ for(let n=1;n<=6;n++){ if(Math.abs(m*n-Math.round(m*n))<1e-9) return n; } return 1; }
/* reads "2", "-1/2", "−3", "0.5" → number, else NaN */
function parseNum(s){
  s=String(s).replace(/[−–]/g,'-').replace(/\s/g,'');
  if(s===''||s==='-') return NaN;
  if(s.includes('/')){ const [a,c]=s.split('/'); if(!/^-?\d*\.?\d+$/.test(a)||!/^-?\d*\.?\d+$/.test(c)) return NaN; const r=parseFloat(a)/parseFloat(c); return isFinite(r)?r:NaN; }
  if(/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}
const eqv=(a,c)=>Math.abs(a-c)<1e-6;
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* draw(svg, m, b, opt)
   m===null → no main line.  opt:
   dot: highlight (0,b) · tri/run/triLabels: slope step triangle from (0,b)
   lines: [{m,b,cls}] extra lines · vx: number → vertical line x=vx
   points: [{x,y,cls,label}] · seg:{x1,y1,x2,y2} dashed run/rise between two points with labels
   extra: raw svg string */
function draw(svg,m,b,opt={}){
  const id='c'+(++uid);
  let h=`<defs><clipPath id="${id}"><rect x="${sx(-5.6)}" y="${sy(5.6)}" width="${S*11.2}" height="${S*11.2}"/></clipPath></defs>`;
  h+=`<rect class="bg" x="0" y="0" width="240" height="240"/>`;
  for(let i=-5;i<=5;i++){
    h+=`<line class="grid" x1="${sx(i)}" y1="${sy(-5.5)}" x2="${sx(i)}" y2="${sy(5.5)}"/>`;
    h+=`<line class="grid" x1="${sx(-5.5)}" y1="${sy(i)}" x2="${sx(5.5)}" y2="${sy(i)}"/>`;
  }
  h+=`<line class="axis" x1="${sx(-5.7)}" y1="${sy(0)}" x2="${sx(5.7)}" y2="${sy(0)}"/>`;
  h+=`<line class="axis" x1="${sx(0)}" y1="${sy(-5.7)}" x2="${sx(0)}" y2="${sy(5.7)}"/>`;
  h+=`<text class="tick" x="${sx(5.75)}" y="${sy(0)+3}">x</text><text class="tick" x="${sx(0)+3}" y="${sy(5.65)}">y</text>`;
  for(let i=-5;i<=5;i++){
    if(i===0){ h+=`<text class="tick" x="${sx(0)-3}" y="${sy(0)+9}" text-anchor="end">0</text>`; continue; }
    h+=`<text class="tick" x="${sx(i)}" y="${sy(0)+9}" text-anchor="middle">${numTxt(i)}</text>`;
    h+=`<text class="tick" x="${sx(0)-3}" y="${sy(i)+2.5}" text-anchor="end">${numTxt(i)}</text>`;
  }
  h+=`<g clip-path="url(#${id})">`;
  (opt.lines||[]).forEach(L=>{ h+=`<line class="${L.cls||'ln2'}" x1="${sx(-6)}" y1="${sy(L.m*-6+L.b)}" x2="${sx(6)}" y2="${sy(L.m*6+L.b)}"/>`; });
  if(typeof opt.vx==='number') h+=`<line class="${opt.vcls||'ln'}" x1="${sx(opt.vx)}" y1="${sy(-6)}" x2="${sx(opt.vx)}" y2="${sy(6)}"/>`;
  if(m!==null && opt.line!==false) h+=`<line class="ln" x1="${sx(-6)}" y1="${sy(m*-6+b)}" x2="${sx(6)}" y2="${sy(m*6+b)}"/>`;
  if(opt.tri && m) h+=triSVG(0,b,opt.run||runFor(m),m*(opt.run||runFor(m)),opt.triLabels);
  if(opt.seg){ const s=opt.seg; h+=triSVG(s.x1,s.y1,s.x2-s.x1,s.y2-s.y1,opt.segLabels!==false); }
  h+=`</g>`;
  if(opt.dot && m!==null) h+=`<circle class="dot" cx="${sx(0)}" cy="${sy(b)}" r="4.5"/>`;
  (opt.points||[]).forEach(p=>{
    h+=`<circle class="${p.cls||'pt'}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r||4.5}"/>`;
    if(p.label) h+=`<text class="ptlbl" x="${sx(p.x)+6}" y="${sy(p.y)-6}">${p.label}</text>`;
  });
  if(opt.extra) h+=opt.extra;
  svg.innerHTML=h;
}
function triSVG(x,y,dx,dy,labels){
  let h=`<path class="tri" d="M${sx(x)} ${sy(y)} H${sx(x+dx)} V${sy(y+dy)}"/>`;
  h+=`<circle cx="${sx(x+dx)}" cy="${sy(y+dy)}" r="2.5" style="fill:var(--blue)"/>`;
  if(labels){
    if(dx) h+=`<text class="trilbl" x="${(sx(x)+sx(x+dx))/2}" y="${sy(y)+(dy>0?11:-4)}" text-anchor="middle">${dx>0?'+':MINUS}${Math.abs(dx)}</text>`;
    if(dy) h+=`<text class="trilbl" x="${sx(x+dx)+(dx>=0?4:-4)}" y="${(sy(y)+sy(y+dy))/2+3}" text-anchor="${dx>=0?'start':'end'}">${dy>0?'+':MINUS}${Math.abs(dy)}</text>`;
  }
  return h;
}
/* click position on a graph → nearest grid point {x,y}, or null if outside -5..5 */
function gridPoint(svg,evt){
  const pt=svg.createSVGPoint(); pt.x=evt.clientX; pt.y=evt.clientY;
  const p=pt.matrixTransform(svg.getScreenCTM().inverse());
  const x=Math.round((p.x-O)/S), y=Math.round((O-p.y)/S);
  return (Math.abs(x)<=5&&Math.abs(y)<=5)?{x,y}:null;
}
/* tiny localStorage wrapper that never throws */
const store={
  get(k,d){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
};

window.G={S,O,MINUS,sx,sy,toFrac,numTxt,fracHTML,signedFracHTML,fracTxt,eqHTML,eqText,runFor,parseNum,eqv,pick,draw,gridPoint,store};
})();

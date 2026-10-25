/* Topic requests and votes, all client side.
   Sending: POST to the Google Form (no-cors, the reply is opaque).
   Reading: the board sheet as CSV: נושא, מקצוע, כיתה, קולות (built automatically from the closed topic list).
   Free-text requests go in a separate field ("אחר") and never reach the board. */
(function(){
const C=window.REQ_CONFIG||{};
const KEY='req:voted';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const votesTxt=n=>n===1?'קול אחד':n+' קולות';
const norm=s=>String(s).trim().replace(/\s+/g,' ');
function getVoted(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
function addVoted(k){ try{ const v=getVoted(); v.push(k); localStorage.setItem(KEY,JSON.stringify(v)); }catch(e){} }

function parseCSV(t){
  const rows=[]; let row=[], f='', q=false;
  for(let i=0;i<t.length;i++){
    const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else if(c==='"') q=true;
    else if(c===','){ row.push(f); f=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&t[i+1]==='\n') i++; row.push(f); rows.push(row); row=[]; f=''; }
    else f+=c;
  }
  if(f!==''||row.length){ row.push(f); rows.push(row); }
  return rows;
}

const REQ={
  configured: !!(C.FORM_ACTION && C.BOARD_CSV && C.ENTRY && C.ENTRY.topic),
  key:(topic,subject)=>norm(topic)+'|'+norm(subject),
  hasVoted(r){ return getVoted().includes(REQ.key(r.topic,r.subject)); },

  async load(){
    if(!REQ.configured) return null;
    const res=await fetch(C.BOARD_CSV+(C.BOARD_CSV.includes('?')?'&':'?')+'t='+Date.now());
    if(!res.ok) throw new Error('board '+res.status);
    const rows=parseCSV(await res.text()).slice(1);
    return rows.map(r=>({topic:norm(r[0]||''), subject:norm(r[1]||''), grade:norm(r[2]||''),
        votes:parseInt(r[3],10)||0, status:norm(r[4]||''), link:norm(r[5]||'')}))
      .filter(r=>r.topic)
      .sort((a,b)=>b.votes-a.votes);
  },

  async send({topic,subject,grade,other}){
    if(!REQ.configured) throw new Error('not configured');
    const fd=new FormData();
    fd.append(C.ENTRY.topic,norm(topic));
    if(C.ENTRY.subject) fd.append(C.ENTRY.subject,norm(subject||''));
    if(C.ENTRY.grade) fd.append(C.ENTRY.grade,norm(grade||''));
    if(C.ENTRY.other && other) fd.append(C.ENTRY.other,norm(other));
    await fetch(C.FORM_ACTION,{method:'POST',mode:'no-cors',body:fd});
  },

  async vote(r){
    if(REQ.hasVoted(r)) return false;
    await REQ.send(r); addVoted(REQ.key(r.topic,r.subject)); return true;
  },

  siteLink(r){ return (window.CURRICULUM&&CURRICULUM.siteLink(r.subject,r.topic))||''; },
  statusChip(r,root){
    const l=REQ.siteLink(r);
    return l?`<a class="status done" href="${esc(root+l)}">עלה לאתר ←</a>`:'';
  },

  /* top 5 list for the home page */
  async mini(el,link){
    if(!REQ.configured){ el.outerHTML=`<p class="muted">בקרוב תוכלו לבקש כאן נושאים ולהצביע לנושאים שאחרים ביקשו. <a href="${link}">איך זה יעבוד</a></p>`; return; }
    try{
      const rows=(await REQ.load()).filter(r=>!REQ.siteLink(r)).slice(0,5);
      el.innerHTML=rows.length? rows.map(r=>`<li>${esc(r.topic)} <span class="muted">· ${esc(r.subject)}${r.grade?' · '+esc(r.grade):''}</span> <span class="votes">(${votesTxt(r.votes)})</span></li>`).join('')
        : `<li class="muted">עוד אין בקשות. <a href="${link}">היו הראשונים לבקש נושא</a></li>`;
    }catch(e){ el.innerHTML='<li class="muted">לא הצלחנו לטעון את הטבלה כרגע. נסו לרענן בעוד רגע.</li>'; }
  },
  esc
};
window.REQ=REQ;
})();

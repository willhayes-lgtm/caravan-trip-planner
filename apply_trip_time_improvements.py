#!/usr/bin/env python3
"""Improve trip time display and recover from intermittent trip save errors."""
from pathlib import Path
p=Path('public/app.js')
a=p.read_text()
changes=[]
def rep(old,new,label):
 global a
 if a.count(old)!=1:raise SystemExit(f'Anchor mismatch ({label}): {a.count(old)}. Stop and inspect before rerunning.')
 a=a.replace(old,new,1);changes.append(label)
rep("const summaryBits=[`${date(t.start_date)}${t.checkin_time?' '+safe(t.checkin_time):''} – ${date(t.end_date)}${t.checkout_time?' '+safe(t.checkout_time):''}`,", "const summaryBits=[`${date(t.start_date)} – ${date(t.end_date)}`,",'summary')
rep('    <div class="glance-finance" aria-label="Trip costs">', """    ${t.checkin_time||t.checkout_time?`<div class="trip-time-schedule" aria-label="Campsite arrival and departure times">${t.checkin_time?`<div class="trip-time-slot"><span class="trip-time-icon" aria-hidden="true">↘</span><div><small>Check-in · ${date(t.start_date)}</small><strong>${safe(t.checkin_time)}</strong></div></div>`:''}${t.checkout_time?`<div class="trip-time-slot"><span class="trip-time-icon" aria-hidden="true">↗</span><div><small>Check-out · ${date(t.end_date)}</small><strong>${safe(t.checkout_time)}</strong></div></div>`:''}</div>`:''}
    <div class="glance-finance" aria-label="Trip costs">""",'time cards')
rep("${s.checkin_time||s.checkout_time?`<div class=\"meta\">Check-in ${safe(s.checkin_time||'—')} · Check-out ${safe(s.checkout_time||'—')}</div>`:''}", "${s.checkin_time||s.checkout_time?`<div class=\"trip-stop-times\">${s.checkin_time?`<span class=\"trip-stop-time\">↘ <b>Check-in</b> ${safe(s.checkin_time)}</span>`:''}${s.checkout_time?`<span class=\"trip-stop-time\">↗ <b>Check-out</b> ${safe(s.checkout_time)}</span>`:''}</div>`:''}",'stop times')
rep("""async function api(method='GET',body){
 const r=await fetch('/api/trips',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Request failed');return j;
}""", """async function api(method='GET',body){
 const call=async()=>{
  let r;
  try{r=await fetch('/api/trips',{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'})}
  catch(e){const err=new Error('Connection interrupted. Your changes are still in the form; please try saving again.');err.transient=true;throw err}
  const raw=await r.text();let j;
  try{j=JSON.parse(raw)}catch{j=null}
  if(!r.ok){const err=new Error(j?.error||`Unable to save trip (HTTP ${r.status}). Please try again.`);err.transient=r.status>=500||r.status===429;throw err}
  if(j===null)throw Error('Unexpected response from the server. Please refresh and check your trip before saving again.');
  return j;
 };
 try{return await call()}catch(err){if(method==='PUT'&&err.transient)return call();throw err}
}""",'api errors')
rep("""$('#tripForm').onsubmit=async e=>{
 e.preventDefault();const f=e.target,obj=Object.fromEntries(new FormData(f));obj.stops=JSON.stringify(readStops());
 try{await api(obj.id?'PUT':'POST',obj);$('#editor').close();await reload()}catch(err){alert(err.message)}
};""", """$('#tripForm').onsubmit=async e=>{
 e.preventDefault();const f=e.target,obj=Object.fromEntries(new FormData(f));obj.stops=JSON.stringify(readStops());
 const submit=f.querySelector('button[type="submit"]')||f.querySelector('button:not([type])');
 if(submit?.disabled)return;
 if(submit)submit.disabled=true;
 try{await api(obj.id?'PUT':'POST',obj);$('#editor').close();await reload()}
 catch(err){alert(err.message+'\\n\\nYour edits have been kept in the form.');}
 finally{if(submit)submit.disabled=false}
};""",'save form')
idx=Path('public/index.html');i=idx.read_text()
needle='<link rel="stylesheet" href="/unified-notifications.css?v=1">'
old='<script src="/app.js?v=20261118-11" defer></script>'
if i.count(needle)!=1 or i.count(old)!=1:raise SystemExit('HTML anchors missing; no files written.')
p.write_text(a)
Path('public/trip-time-improvements.css').write_text('''/* Clear arrival and departure times on trip cards and itinerary stops. */
.trip-time-schedule{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}
.trip-time-slot{display:flex;align-items:center;gap:11px;background:#eef7f7;border:1px solid #d5e8e8;border-radius:12px;padding:10px 12px;min-width:0}
.trip-time-icon{display:grid;place-items:center;flex:0 0 32px;height:32px;border-radius:9px;background:#d3eeee;color:#125d67;font-weight:800;font-size:19px}
.trip-time-slot>div{display:grid;gap:2px;min-width:0}.trip-time-slot small{font-size:11px;color:#52737a;font-weight:650}.trip-time-slot strong{font-size:18px;color:#123f52;letter-spacing:.2px;font-variant-numeric:tabular-nums}
.trip-stop-times{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}.trip-stop-time{display:inline-flex;align-items:center;gap:5px;border:1px solid #d5e8e8;background:#edf7f7;color:#164f5b;padding:6px 9px;border-radius:8px;font-size:12px}.trip-stop-time b{font-weight:750}
@media(max-width:480px){.trip-time-schedule{grid-template-columns:1fr}.trip-time-slot strong{font-size:17px}}
''')
i=i.replace(needle,needle+'<link rel="stylesheet" href="/trip-time-improvements.css?v=1">',1).replace(old,'<script src="/app.js?v=20261120-2" defer></script>',1)
idx.write_text(i)
print('Trip time UI and save handling updated: '+', '.join(changes))

#!/usr/bin/env python3 
"""Caravan Planner UX refinement. Safe to run from repository root on current main."""
from pathlib import Path
import re
p=Path('public')
def load(name):
 f=p/name
 if not f.exists(): raise SystemExit('Missing '+str(f))
 return f.read_text(encoding='utf-8')
def save(name,s): (p/name).write_text(s,encoding='utf-8');print('Updated',p/name)
def replace_once(s,a,b,what):
 if s.count(a)!=1: raise SystemExit('Unexpected '+what+' marker count '+str(s.count(a)))
 return s.replace(a,b,1)
# Fix nested payload panel, while preserving phase2.js legacy tab functionality.
s=load('navigation-controller.js')
marker=" const cp=document.getElementById('checklistsPage');if(cp){"
if 'const payloadInner=document.getElementById' not in s:
 s=replace_once(s,marker," const payloadInner=document.getElementById('payloadTab');if(payloadInner)payloadInner.hidden=key!=='payload';\n const serviceInner=document.getElementById('serviceTab');if(serviceInner)serviceInner.hidden=key!=='service';\n"+marker,'navigation payload')
 save('navigation-controller.js',s)
# Dashboard: small status strip, robust date-only comparison, priority badges.
s=load('ux-dashboard-v2.js')
start=s.index('async function maintenanceCard(){');end=s.index('\nfunction dashboard(){',start)
new=r'''async function maintenanceCard(){
 const root=document.getElementById('uxMaintenanceCard');if(!root)return;
 root.className='ux-maint-status ux-maint-loading';root.textContent='Checking maintenance schedule…';
 try{
  const response=await fetch('/api/maintenance');if(!response.ok)throw Error('Maintenance unavailable');
  const result=await response.json();
  const today=new Date();today.setHours(0,0,0,0);
  const tasks=(result.tasks||[]).filter(t=>t.next_due).map(t=>{
   const parts=String(t.next_due).slice(0,10).split('-').map(Number);
   const due=new Date(parts[0],parts[1]-1,parts[2]);
   return {...t,days:Math.round((due-today)/86400000)};
  }).filter(t=>Number.isFinite(t.days));
  const overdue=tasks.filter(t=>t.days<0).sort((a,b)=>a.days-b.days);
  const todayDue=tasks.filter(t=>t.days===0);
  const soon=tasks.filter(t=>t.days>0&&t.days<=Number(t.warning_days??14)).sort((a,b)=>a.days-b.days);
  const attention=[...overdue,...todayDue,...soon];
  const state=overdue.length?'overdue':todayDue.length?'today':soon.length?'soon':'clear';
  root.className='ux-maint-status ux-maint-'+state;
  root.replaceChildren();
  const icon=el('span','ux-maint-symbol',state==='overdue'?'!':state==='clear'?'✓':'!');icon.setAttribute('aria-hidden','true');
  const content=el('div','ux-maint-status-copy');
  const title=el('strong','',overdue.length?`${overdue.length} overdue maintenance ${overdue.length===1?'task':'tasks'}`:todayDue.length?`${todayDue.length} maintenance ${todayDue.length===1?'task':'tasks'} due today`:soon.length?`${soon.length} maintenance ${soon.length===1?'task':'tasks'} due soon`:'Maintenance up to date');
  const detail=el('span','',attention.length?attention.slice(0,2).map(t=>`${t.title} · ${t.days<0?`${-t.days}d overdue`:t.days===0?'Due today':`In ${t.days}d`}`).join('  •  ')+(attention.length>2?`  •  +${attention.length-2} more`:''):'Nothing due within your configured warning periods.');
  content.append(title,detail);
  const link=el('a','ux-maint-status-link','View maintenance →');link.href='/#maintenance';
  root.append(icon,content,link);
 }catch{
  root.className='ux-maint-status ux-maint-loading';root.replaceChildren(el('span','','Maintenance status unavailable. '));
  const a=el('a','','Open maintenance →');a.href='/#maintenance';root.append(a);
 }
}'''
s=s[:start]+new+s[end:]
# Ensure status element no longer uses card grid sizing.
s=s.replace("widget=el('article','ux-summary-card ux-maintenance-card')","widget=el('section','ux-maint-status')")
save('ux-dashboard-v2.js',s)
# Towing edit/delete icons, keep dataset attributes for existing handlers.
s=load('app.js')
old='<button class="secondary" data-tow-edit="${safe(t.id)}">Edit</button><button class="secondary" data-tow-delete="${safe(t.id)}">Delete</button>'
new='''<button type="button" class="secondary tow-icon-btn" data-tow-edit="${safe(t.id)}" aria-label="Edit towing journey" title="Edit journey"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z"/></svg></button><button type="button" class="secondary tow-icon-btn tow-delete-btn" data-tow-delete="${safe(t.id)}" aria-label="Delete towing journey" title="Delete journey"><svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg></button>'''
if old in s:s=s.replace(old,new,1);save('app.js',s)
elif 'tow-icon-btn' not in s:raise SystemExit('Could not find towing action buttons')
# Profile category cards: use existing field definitions, API and form save.
s=load('checklists.js')
start=s.index('function renderProfile(){');end=s.index('\nfunction setup(){',start)
new=r'''function renderProfile(){
 const root=$('#phaseProfileForm');
 const descriptions={
  'Identity':['🚐','Your caravan','The key details identifying your caravan.'],
  'Dimensions & weights':['⚖️','Dimensions & weights','Important for towing, campsite access and payload calculations.'],
  'Running gear':['🛞','Wheels & running gear','Tyres, axles and torque information for safety checks.'],
  'Onboard equipment':['🔌','Onboard equipment','Keep a reference of the systems fitted to your caravan.'],
  'Ownership':['📄','Ownership & warranty','Purchase details and warranty information.']
 };
 root.innerHTML=fieldDefs.map(([section,fields],i)=>{
  const [icon,title,description]=descriptions[section]||['📋',section,'Caravan details'];
  return `<section class="ux-profile-group" aria-labelledby="ux-profile-heading-${i}"><div class="ux-profile-group-head"><span class="ux-profile-icon" aria-hidden="true">${icon}</span><div><h3 id="ux-profile-heading-${i}">${esc(title)}</h3><p>${esc(description)}</p></div></div><div class="ux-profile-fields">${fields.map(([key,label,type])=>`<label class="${key==='warranty_notes'?'wide':''}"><span>${esc(label)}</span>${key==='warranty_notes'?`<textarea name="${key}" rows="3">${esc(profile[key]??'')}</textarea>`:`<input name="${key}" type="${type||'text'}" ${type==='number'?'min="0" step="any"':''} value="${esc(profile[key]??'')}">`}</label>`).join('')}</div></section>`;
 }).join('');
}'''
s=s[:start]+new+s[end:]
# Add a high-level profile header without touching saved values.
s=s.replace('<h3>My caravan specifications</h3><p class="phase-muted">Optional fields can be left blank. Use verified figures from the caravan handbook or weight plate.</p>','<div class="ux-profile-intro"><span class="ux-profile-eyebrow">MY CARAVAN</span><h3>Caravan specifications</h3><p>Keep your caravan details in one place. Fields are optional; confirm technical figures against the handbook or weight plate.</p></div>')
save('checklists.js',s)
# Scoped stylesheet, included after all previous styles.
css=r'''/* UX refinement: maintenance alert, towing actions, checklist spacing, profile groups */
#uxMaintenanceCard.ux-maint-status{display:flex;align-items:center;gap:13px;padding:12px 16px;margin:0 0 18px;border:1px solid #c8dedb;border-left:5px solid #258c81;border-radius:12px;background:#eef8f5;color:#145a52;min-height:54px;box-sizing:border-box}
#uxMaintenanceCard.ux-maint-overdue{background:#fff0ef;border-color:#f0c5c2;border-left-color:#c33b35;color:#8e2724}
#uxMaintenanceCard.ux-maint-today,#uxMaintenanceCard.ux-maint-soon{background:#fff7e7;border-color:#efd9a7;border-left-color:#bd7a18;color:#80500d}
#uxMaintenanceCard.ux-maint-clear{background:#eef8f5;border-color:#c8e2d7;border-left-color:#2b8b69;color:#1d6950}
#uxMaintenanceCard .ux-maint-symbol{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border-radius:50%;background:currentColor;font-weight:900;font-size:0}
#uxMaintenanceCard .ux-maint-symbol::after{content:'!';font-size:17px;color:white}
#uxMaintenanceCard.ux-maint-clear .ux-maint-symbol::after{content:'✓'}
#uxMaintenanceCard .ux-maint-status-copy{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}
#uxMaintenanceCard .ux-maint-status-copy strong{font-size:14px;line-height:1.3}
#uxMaintenanceCard .ux-maint-status-copy>span{font-size:12px;line-height:1.4;overflow-wrap:anywhere}
#uxMaintenanceCard .ux-maint-status-link{font-size:12px;font-weight:750;white-space:nowrap;color:inherit;text-decoration:underline;text-underline-offset:3px}
@media(max-width:650px){#uxMaintenanceCard.ux-maint-status{align-items:flex-start;flex-wrap:wrap;padding:12px}#uxMaintenanceCard .ux-maint-status-link{margin-left:41px}}
/* Towing: predictable columns and fixed icon actions. */
#towingPage #towingItems.tow-list-view .list-card{grid-template-columns:minmax(0,1fr) 88px!important;gap:14px!important}
#towingPage #towingItems.tow-list-view .list-card .top{width:100%;display:grid!important;grid-template-columns:minmax(0,1fr) 90px;align-items:center;gap:14px}
#towingPage #towingItems.tow-list-view .list-card .tow-miles{text-align:right}
#towingPage #towingItems.tow-list-view .list-card>.meta{grid-column:1/-1;grid-row:2;margin:0}
#towingPage #towingItems.tow-list-view .list-card .actions{display:flex!important;justify-content:flex-end!important;align-items:center;gap:7px;margin:0!important}
#towingPage #towingItems.tow-list-view .tow-icon-btn{display:inline-grid;place-items:center;width:36px;height:36px;min-width:36px;min-height:36px;padding:0!important;border:1px solid #d7e5e6;border-radius:9px;color:#285c66;background:#fff!important}
#towingPage #towingItems.tow-list-view .tow-icon-btn:hover{background:#eaf6f5!important;border-color:#89bdbf}
#towingPage #towingItems.tow-list-view .tow-delete-btn{color:#a74742}
#towingPage #towingItems.tow-list-view .tow-delete-btn:hover{background:#fff0ef!important;border-color:#e5a7a2}
@media(max-width:650px){#towingPage #towingItems.tow-list-view .list-card{grid-template-columns:minmax(0,1fr) 82px!important;gap:10px!important}#towingPage #towingItems.tow-list-view .list-card .top{grid-template-columns:minmax(0,1fr);gap:5px}#towingPage #towingItems.tow-list-view .list-card .tow-miles{text-align:left}#towingPage #towingItems.tow-list-view .list-card>.meta{grid-column:1/-1}}
/* Profile: strong visual category boundaries, responsive two-column inputs. */
#phaseProfile>.phase-card{background:transparent;border:0;box-shadow:none;padding:0}
#phaseProfile .ux-profile-intro{padding:12px 4px 22px}
#phaseProfile .ux-profile-eyebrow{font-size:11px;font-weight:800;letter-spacing:1.5px;color:#25818a}
#phaseProfile .ux-profile-intro h3{font-size:26px;margin:7px 0 6px;color:#123f52}
#phaseProfile .ux-profile-intro p{margin:0;color:#607980;line-height:1.5}
#phaseProfile .phase-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
#phaseProfile .ux-profile-group{grid-column:1/-1;min-width:0;background:#fff;border:1px solid #d9e8e8;border-radius:16px;overflow:hidden;box-shadow:0 3px 13px #123f5208}
#phaseProfile .ux-profile-group-head{display:flex;align-items:center;gap:14px;padding:19px 22px;background:#f3f8f8;border-bottom:1px solid #e1ecec}
#phaseProfile .ux-profile-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;background:#e3f1ef;border-radius:12px;font-size:21px}
#phaseProfile .ux-profile-group-head h3{margin:0 0 4px;font-size:18px;color:#123f52}
#phaseProfile .ux-profile-group-head p{margin:0;font-size:12px;line-height:1.5;color:#617b82}
#phaseProfile .ux-profile-fields{padding:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 22px}
#phaseProfile .ux-profile-fields label{display:flex;flex-direction:column;gap:7px;min-width:0;font-size:13px;font-weight:700;color:#345b62}
#phaseProfile .ux-profile-fields label.wide{grid-column:1/-1}
#phaseProfile .ux-profile-fields input,#phaseProfile .ux-profile-fields textarea{width:100%;box-sizing:border-box;min-height:43px;padding:10px 12px;border:1px solid #cbdfe0;border-radius:9px;background:white;font-size:14px;color:#173e49}
#phaseProfile .ux-profile-fields input:focus,#phaseProfile .ux-profile-fields textarea:focus{outline:2px solid #238c9a;outline-offset:1px}
#phaseProfileSave>.phase-actions{display:flex;justify-content:flex-end;margin:22px 0 30px}
#phaseProfileSave>.phase-actions button{padding:12px 22px}
@media(max-width:650px){#phaseProfile .ux-profile-fields{grid-template-columns:1fr;padding:16px;gap:15px}#phaseProfile .ux-profile-group-head{padding:16px}#phaseProfile .ux-profile-intro h3{font-size:22px}}
/* Checklist controls: distinct action group, adequate gaps on desktop. */
@media(min-width:701px){#phaseLists .phase-card{padding:28px 30px}#phaseLists .phase-tabs{gap:12px;margin:22px 0 26px}#phaseLists .phase-toolbar{margin:22px 0 26px;padding:18px 20px;border:1px solid #dbe9e9;background:#f7faf9;border-radius:14px}#phaseLists .phase-toolbar .phase-actions{display:flex!important;align-items:center;gap:16px!important;margin:0;flex-wrap:wrap}#phaseLists .phase-toolbar .phase-actions button{margin:0!important;padding:11px 18px!important}#phaseLists .phase-add{margin:0 0 18px;gap:16px}#phaseLists .phase-task{padding:16px 18px}#phaseLists .phase-list{gap:12px}}
'''
save('ux-refinement.css',css)
s=load('index.html')
link='<link rel="stylesheet" href="/ux-refinement.css?v=20261120-2">'
if link not in s:
 s=replace_once(s,'</head>',link+'</head>','stylesheet')
 save('index.html',s)
print('Release patch complete.')

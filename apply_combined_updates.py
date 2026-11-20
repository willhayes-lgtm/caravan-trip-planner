#!/usr/bin/env python3
"""Apply dashboard, sidebar and towing-list updates in one run."""
from pathlib import Path
p=Path('public')
checks={
 'ux-dashboard-v2.js':["const a=el('a','ux-pin-card',names[key]+' →');a.href=hrefs[key];cards.append(a)","const cards=document.getElementById('uxDashboardCards');cards?.prepend(widget)",'document.addEventListener(\'click\',e=>{if(e.target.closest(\'[data-page="dashboard"]\'))maintenanceCard()});' ],
 'app.js':['$(\'#towingItems\').innerHTML=towing.map(t=>`<article class="list-card">'],
 'index.html':['<link rel="stylesheet" href="/navigation-controller.css']
}
for filename,markers in checks.items():
 f=p/filename
 if not f.is_file():raise SystemExit('Missing '+str(f))
 data=f.read_text(encoding='utf-8')
 for marker in markers:
  if data.count(marker)!=1:raise SystemExit('Source mismatch in '+str(f)+'; no changes made')
if 'ux-pin-remove' in (p/'ux-dashboard-v2.js').read_text():raise SystemExit('Dashboard update already applied')
if 'tow-list-view' in (p/'app.js').read_text():raise SystemExit('Towing update already applied')
print('Preflight passed. Applying both updates...')

# --- Dashboard, maintenance and sticky sidebar ---
from pathlib import Path
p=Path('public'); js=p/'ux-dashboard-v2.js'; css=p/'ux-dashboard-v2.css'
if not js.exists() or not css.exists(): raise SystemExit('Run from repository root')
s=js.read_text(); c=css.read_text()
if 'ux-pin-remove' in s: raise SystemExit('Already applied')
changes=[("const a=el('a','ux-pin-card',names[key]+' →');a.href=hrefs[key];cards.append(a)",'''const tile=el('div','ux-pin-tile');const a=el('a','ux-pin-card',names[key]+' →');a.href=hrefs[key];const remove=el('button','ux-pin-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+names[key]+' from dashboard');remove.addEventListener('click',()=>{pins=pins.filter(x=>x!==key);save();renderPins();updatePinButton()});tile.append(a,remove);cards.append(tile)'''),('const cards=document.getElementById(\'uxDashboardCards\');cards?.prepend(widget)','const cards=document.getElementById(\'uxDashboardCards\');cards?.before(widget)'),('document.addEventListener(\'click\',e=>{if(e.target.closest(\'[data-page="dashboard"]\'))maintenanceCard()});','window.addEventListener(\'planner:navigate\',e=>{if(e.detail?.page===\'dashboard\')maintenanceCard()});')]
for old,new in changes:
 if s.count(old)!=1: raise SystemExit('Unexpected source; no changes written: '+old[:65])
 s=s.replace(old,new,1)
c+='''\n/* Keep the left sidebar stationary on desktop, with its own overflow. */
@media(min-width:901px){.ux-shell{align-items:start}.ux-sidebar{position:sticky;top:0;height:100vh;height:100dvh;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;align-self:start}}
/* Remove individual dashboard shortcuts without removing their source pages. */
.ux-pin-tile{position:relative;min-width:0}.ux-pin-tile .ux-pin-card{padding-right:90px;min-height:66px;box-sizing:border-box}.ux-pin-remove{position:absolute;right:10px;top:50%;transform:translateY(-50%);padding:7px 9px!important;font-size:12px!important;border:1px solid #c6dfe0!important;border-radius:8px;background:#fff!important;color:#34555c!important}.ux-pin-remove:hover{background:#fff1f1!important;color:#9c3131!important}.ux-pin-remove:focus-visible{outline:3px solid #238c9a;outline-offset:2px}
#uxMaintenanceCard{margin-bottom:16px}
'''
js.write_text(s);css.write_text(c)
print('UPDATED public/ux-dashboard-v2.js');print('UPDATED public/ux-dashboard-v2.css')

# --- Compact towing list ---
from pathlib import Path
p=Path('public')
f=p/'app.js'
s=f.read_text(encoding='utf-8')
old='''$('#towingItems').innerHTML=towing.map(t=>`<article class="list-card">'''
if s.count(old)!=1: raise SystemExit('Expected towing renderer not found; no changes made')
s=s.replace(old,'''$('#towingItems').classList.add('tow-list-view');
 $('#towingItems').innerHTML=towing.map(t=>`<article class="list-card">''',1)
f.write_text(s,encoding='utf-8')
css=p/'towing-list.css'
css.write_text('''/* Compact, scalable towing history. Keeps existing Edit/Delete buttons. */
#towingPage #towingItems.tow-list-view{display:flex;flex-direction:column;gap:0;background:#fff;border:1px solid #dce9e9;border-radius:15px;overflow:hidden}
#towingPage #towingItems.tow-list-view .list-card{border:0!important;border-radius:0!important;box-shadow:none!important;margin:0!important;padding:13px 18px!important;background:#fff!important;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:20px;align-items:center;border-bottom:1px solid #e4eeee!important}
#towingPage #towingItems.tow-list-view .list-card:last-child{border-bottom:0!important}
#towingPage #towingItems.tow-list-view .list-card:nth-child(even){background:#f7fbfa!important}
#towingPage #towingItems.tow-list-view .list-card .top{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:14px}
#towingPage #towingItems.tow-list-view .list-card h3{font-size:15px;margin:0 0 3px;overflow-wrap:anywhere}
#towingPage #towingItems.tow-list-view .list-card .meta{font-size:12px;margin:3px 0;color:#607980}
#towingPage #towingItems.tow-list-view .list-card .actions{margin:0!important;display:flex;gap:6px;justify-content:flex-end}
#towingPage #towingItems.tow-list-view .list-card .actions button{padding:7px 10px;font-size:12px}
#towingPage #towingItems.tow-list-view .tow-miles{white-space:nowrap;font-size:14px}
@media(max-width:650px){#towingPage #towingItems.tow-list-view .list-card{grid-template-columns:1fr;gap:7px;padding:12px!important}#towingPage #towingItems.tow-list-view .list-card .actions{justify-content:flex-start}}
''',encoding='utf-8')
html=p/'index.html'
h=html.read_text(encoding='utf-8')
anchor='<link rel="stylesheet" href="/navigation-controller.css'
if h.count(anchor)!=1: raise SystemExit('Expected stylesheet insertion point not found')
h=h.replace(anchor,'<link rel="stylesheet" href="/towing-list.css?v=1">'+anchor,1)
html.write_text(h,encoding='utf-8')
print('UPDATED public/app.js and public/index.html')
print('CREATED public/towing-list.css')

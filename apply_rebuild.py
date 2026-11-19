#!/usr/bin/env python3
"""Run from the root of the caravan-trip-planner repository.
Creates actual consolidated replacement source files, preserving business logic.
"""
from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent
public=root/'public'
if not (public/'index.html').exists():
    raise SystemExit('Place this script in the GitHub repository root (beside public/), then rerun.')

def edit(name, transform):
    p=public/name
    old=p.read_text()
    new=transform(old)
    if new==old: print('UNCHANGED:',name)
    else:
        p.write_text(new)
        print('UPDATED:',name)

def app(s):
    start=s.find("document.querySelectorAll('[data-page]').forEach(b=>b.onclick=")
    end=s.find('async function listApi',start)
    if start<0 or end<0: raise RuntimeError('app.js navigation anchor missing')
    return s[:start]+"// Central router owns navigation. This module only loads section data.\nwindow.addEventListener('planner:navigate',e=>{const page=e.detail.page;if(page==='wishlist'||page==='shopping')loadLists();if(page==='towing')loadTowing();});\n"+s[end:]

def maintenance(s):
    start=s.find(" nav.addEventListener('click',e=>{const b=e.target.closest('[data-page]');")
    end=s.find('},true);',start)
    if start<0 or end<0: raise RuntimeError('maintenance.js navigation anchor missing')
    return s[:start]+" window.addEventListener('planner:navigate',e=>{if(e.detail.page==='maintenance')load();});"+s[end+8:]

def checklists(s):
    start=s.find(" nav.addEventListener('click',e=>{const b=e.target.closest('[data-page]');")
    end=s.find('},true);',start)
    if start<0 or end<0: raise RuntimeError('checklists.js navigation anchor missing')
    return s[:start]+" window.addEventListener('planner:navigate',e=>{if(['profile','checklists'].includes(e.detail.page))load();});"+s[end+8:]

def refresh(s):
    start=s.find(" nav.addEventListener('click',e=>{const b=e.target.closest('[data-page]');")
    end=s.find(' loadDashboard();',start)
    if start<0 or end<0: raise RuntimeError('ux-refresh.js navigation anchor missing')
    s=s[:start]+' // Navigation is handled by navigation-controller.js.\n'+s[end:]
    # Disable the old sidebar's profile handler and dashboard shortcuts listener; the router owns both.
    s=re.sub(r"\n profile\.addEventListener\('click',e=>\{.*?\}\);",'',s,count=1)
    return s

def dashboard(s):
    # Retain dashboard cards and personalisation; remove duplicate Profile/Checklist routing.
    old='function init(){pinControl();dashboard();separateProfile();}'
    if old not in s: raise RuntimeError('ux-dashboard-v2.js init anchor missing')
    return s.replace(old,'function init(){pinControl();dashboard();}')

def index(s):
    s=re.sub(r'<script\s+src="/(?:ux-profile-checklists-fix|ux-routing-fix|ux-visibility-fix|navigation-stability|navigation-controller)\.js[^\"]*"\s+defer></script>','',s)
    s=re.sub(r'<link\s+rel="stylesheet"\s+href="/(?:ux-routing-fix|ux-visibility-fix|navigation-stability|navigation-controller)\.css[^\"]*">','',s)
    s=s.replace('</head>','<link rel="stylesheet" href="/navigation-controller.css?v=20261119-3"></head>',1)
    s=s.replace('</body>','<script src="/navigation-controller.js?v=20261119-3" defer></script></body>',1)
    return s

for name,fn in [('app.js',app),('maintenance.js',maintenance),('checklists.js',checklists),('ux-refresh.js',refresh),('ux-dashboard-v2.js',dashboard),('index.html',index)]:edit(name,fn)
print('Done. Commit public/ replacements and the two navigation-controller files.')

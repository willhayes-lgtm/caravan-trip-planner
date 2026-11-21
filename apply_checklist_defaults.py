#!/usr/bin/env python3
from pathlib import Path
import shutil
root=Path(__file__).resolve().parent
public=root/'public'
html=public/'index.html'
if not html.exists() or not (public/'checklists.js').exists():
    raise SystemExit('Run this from the repository root; public/index.html and public/checklists.js are required.')
for name in ('checklist-defaults.js','checklist-defaults.css','trip-editor-tab-fix.css'):
    source=root/name
    if not source.exists(): raise SystemExit(f'Missing {source.name}; upload all four package files to the repository root.')
    shutil.copyfile(source,public/name)
s=html.read_text()
css='<link rel="stylesheet" href="/checklist-defaults.css?v=1">'
tab_css='<link rel="stylesheet" href="/trip-editor-tab-fix.css?v=1">'
js='<script src="/checklist-defaults.js?v=1" defer></script>'
if css not in s:s=s.replace('</head>',css+'</head>')
if tab_css not in s:s=s.replace('</head>',tab_css+'</head>')
if js not in s:s=s.replace('</body>',js+'</body>')
html.write_text(s)
# Convert only the three caravan dimension fields between display metres and stored millimetres.
# This preserves existing records and API/database compatibility.
checklists=public/'checklists.js'
code=checklists.read_text()
marker='/* CARAVAN_DIMENSIONS_METRES_V1 */'
if marker not in code:
    original="const fieldDefs=["
    updated="/* CARAVAN_DIMENSIONS_METRES_V1 */\nconst dimensionKeys=new Set(['length_mm','width_mm','height_mm']);\nconst metresFromMm=value=>value==null||value===''?'':String(Number((Number(value)/1000).toFixed(3)));\nconst mmFromMetres=value=>value==null||value===''?'':String(Math.round(Number(value)*1000));\nconst fieldDefs=["
    if original not in code:raise SystemExit('Cannot locate profile field definitions')
    code=code.replace(original,updated,1)
    for key,caption in [('length_mm','Length'),('width_mm','Width'),('height_mm','Height')]:
        old=f"['{key}','{caption} (mm)','number']"
        new=f"['{key}','{caption} (m)','number']"
        if old not in code:raise SystemExit(f'Missing {old}')
        code=code.replace(old,new,1)
    old='value="${esc(profile[key]??\'\')}"'
    new='value="${esc(dimensionKeys.has(key)?metresFromMm(profile[key]):(profile[key]??\'\'))}"'
    if old not in code:raise SystemExit('Cannot locate profile input value')
    code=code.replace(old,new,1)
    old="Object.fromEntries(new FormData(e.target))"
    # Only change the profile save, not checklist task forms.
    old_profile="profile=await req('caravan-profile','PUT',Object.fromEntries(new FormData(e.target)));"
    new_profile="const values=Object.fromEntries(new FormData(e.target));for(const key of dimensionKeys){if(Object.hasOwn(values,key))values[key]=mmFromMetres(values[key]);}profile=await req('caravan-profile','PUT',values);"
    if old_profile not in code:raise SystemExit('Cannot locate profile save handler')
    code=code.replace(old_profile,new_profile,1)
    checklists.write_text(code)
print('Checklist update installed. Deploy public/ then use Add missing defaults on the Checklists page.')

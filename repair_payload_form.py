#!/usr/bin/env python3
"""Repair payload form runtime field and remove competing legacy click shim."""
from pathlib import Path
import re
js=Path('public/phase2.js');html=Path('public/phase2.html')
if not js.is_file() or not html.is_file():raise SystemExit('Run from repo root; public/phase2.js and phase2.html required.')
s=js.read_text(encoding='utf-8');h=html.read_text(encoding='utf-8')
if 'function openPayload(s)' not in s or 'id="payloadForm"' not in h:raise SystemExit('Expected payload form not found. No changes made.')
helper="""function payloadEquipmentField(f){
 let el=f.querySelector('select[name="equipment_type"]')||document.querySelector('#payloadDialog select[name="equipment_type"]');
 if(!el){
  const label=document.createElement('label');
  label.textContent='Equipment type';
  el=document.createElement('select');el.name='equipment_type';
  for(const [value,text] of [['trip','Trip equipment'],['stored','Stored onboard'],['fitted','Permanently fitted']]){
   const option=document.createElement('option');option.value=value;option.textContent=text;el.append(option);
  }
  label.append(el);
  (f.querySelector('.formgrid')||f).append(label);
 }
 // A detached field or a field associated with another form must belong to payloadForm.
 if(el.form!==f)el.setAttribute('form',f.id);
 return el;
}
"""
if 'function payloadEquipmentField(f)' not in s:
 s=s.replace('function openPayload(s){',helper+'function openPayload(s){',1)
s=s.replace("f.elements.namedItem('equipment_type').value=s?.equipment_type||'trip'","payloadEquipmentField(f).value=s?.equipment_type||'trip'")
s=s.replace("f.elements.equipment_type.value=s?.equipment_type||'trip'","payloadEquipmentField(f).value=s?.equipment_type||'trip'")
s=s.replace("v.equipment_type=f.elements.namedItem('equipment_type').value","v.equipment_type=payloadEquipmentField(f).value")
s=s.replace("v.equipment_type=f.elements.equipment_type.value","v.equipment_type=payloadEquipmentField(f).value")
if "payloadEquipmentField(f).value=s?.equipment_type||'trip'" not in s or "v.equipment_type=payloadEquipmentField(f).value" not in s:raise SystemExit('Expected JavaScript assignments not found; no changes made.')
# Ensure any already deployed repair script cannot intercept events and fail separately.
h=re.sub(r'<script src="/payload-editor-repair\.js[^"]*" defer></script>','',h)
h,n=re.subn(r'(/phase2\.js\?v=)[^"]+',r'\g<1>payload-runtime-repair-20261122-3',h)
if not n:raise SystemExit('phase2.js script reference missing; no changes made.')
js.write_text(s,encoding='utf-8');html.write_text(h,encoding='utf-8')
print('Updated payload form handling, removed competing repair script, refreshed script cache.')

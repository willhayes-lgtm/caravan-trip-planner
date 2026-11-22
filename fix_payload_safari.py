#!/usr/bin/env python3
"""Fix Safari payload form field lookup without replacing the whole application."""
from pathlib import Path
path=Path('public/phase2.js')
if not path.is_file():raise SystemExit("Cannot find public/phase2.js; run from repository root.")
s=path.read_text(encoding='utf-8')
old="f.elements.equipment_type.value"
new="f.elements.namedItem('equipment_type').value"
count=s.count(old)
if count:
 s=s.replace(old,new)
 path.write_text(s,encoding='utf-8')
 print(f"Fixed {count} Safari field lookups in public/phase2.js")
elif new in s:print("Already fixed; no changes needed.")
else:raise SystemExit("Expected field reference not found; no changes made.")
html=Path('public/phase2.html')
if html.is_file():
 t=html.read_text(encoding='utf-8')
 import re
 t,n=re.subn(r'(/phase2\.js\?v=)[^"\']+',r'\g<1>safari-field-fix-20261122-1',t)
 if n:html.write_text(t,encoding='utf-8');print("Updated script version to bypass cached JavaScript.")

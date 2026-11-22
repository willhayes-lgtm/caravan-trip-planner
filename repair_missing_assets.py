#!/usr/bin/env python3
from pathlib import Path
import re
root=Path.cwd(); html=root/'public/index.html'
if not html.is_file(): raise SystemExit('Run from repository root; public/index.html not found.')
s=html.read_text(encoding='utf-8')
css=['premium-payload-ux.css','payload-safety-dashboard-fix.css','ux-release-20261122.css','mobile-trip-sheet.css','mobile-step-navigation.css']
js=['payload-safety-dashboard-fix.js','ux-release-20261122.js','mobile-trip-sheet.js','mobile-step-navigation.js']
missing=[x for x in css+js if not (root/'public'/x).is_file()]
if missing: raise SystemExit('Missing files; no changes made: '+', '.join(missing))
if '</head>' not in s or '</body>' not in s: raise SystemExit('HTML anchors not found; no changes made')
added=[]
for x in css:
 if not re.search(r'<link\b[^>]*href=["\'][^"\']*/'+re.escape(x)+r'(?:\?[^"\']*)?["\']',s,re.I):
  s=s.replace('</head>',f'<link rel="stylesheet" href="/{x}?v=recovery-20261122-1"></head>',1);added.append(x)
for x in js:
 if not re.search(r'<script\b[^>]*src=["\'][^"\']*/'+re.escape(x)+r'(?:\?[^"\']*)?["\']',s,re.I):
  s=s.replace('</body>',f'<script src="/{x}?v=recovery-20261122-1" defer></script></body>',1);added.append(x)
html.write_text(s,encoding='utf-8')
print('Added:',', '.join(added) if added else 'nothing (already installed)')
print('Other HTML and stored data unchanged.')

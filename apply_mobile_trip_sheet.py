#!/usr/bin/env python3
"""Install mobile trip sheet assets from repository root."""
from pathlib import Path
root=Path.cwd()
h=root/'public/index.html'
css=root/'public/mobile-trip-sheet.css'
js=root/'public/mobile-trip-sheet.js'
if not all(x.is_file() for x in (h,css,js)):
 raise SystemExit("Missing files: upload .py to root and CSS/JS to public/.")
s=h.read_text(encoding='utf-8')
link='<link rel="stylesheet" href="/mobile-trip-sheet.css?v=20261122-1">'
script='<script src="/mobile-trip-sheet.js?v=20261122-1" defer></script>'
if '</head>' not in s or '</body>' not in s:raise SystemExit("HTML anchors not found; no changes applied.")
if link not in s:s=s.replace('</head>',link+'</head>',1)
if script not in s:s=s.replace('</body>',script+'</body>',1)
h.write_text(s,encoding='utf-8')
print("Mobile trip bottom-sheet installed; no database migration required.")

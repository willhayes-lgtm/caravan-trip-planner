#!/usr/bin/env python3
"""Install mobile editor step-navigation assets from repository root."""
from pathlib import Path
root=Path.cwd()
html=root/'public/index.html'
files=[root/'public/mobile-step-navigation.css',root/'public/mobile-step-navigation.js']
if not html.is_file() or not all(p.is_file() for p in files):
 raise SystemExit("Upload this installer to repository root and both assets to public/.")
s=html.read_text(encoding='utf-8')
required=['/mobile-trip-sheet.js','/mobile-trip-sheet.css']
if not all(x in s for x in required):
 raise SystemExit("The earlier mobile bottom-sheet release must be installed first. No changes made.")
link='<link rel="stylesheet" href="/mobile-step-navigation.css?v=20261122-1">'
script='<script src="/mobile-step-navigation.js?v=20261122-1" defer></script>'
if '</head>' not in s or '</body>' not in s:
 raise SystemExit("Missing HTML anchors; no changes made.")
if link not in s:s=s.replace('</head>',link+'</head>',1)
if script not in s:s=s.replace('</body>',script+'</body>',1)
html.write_text(s,encoding='utf-8')
print("Installed mobile editor spacing and tappable step navigation.")

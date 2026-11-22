#!/usr/bin/env python3
"""Install Settings modal references without replacing existing app logic."""
from pathlib import Path
root=Path.cwd();html=root/'public/index.html'
assets=[root/'public/settings-modal.css',root/'public/settings-modal.js']
if not html.is_file() or not all(x.is_file() for x in assets):raise SystemExit("Upload .py to repo root, CSS and JS to public/.")
s=html.read_text(encoding='utf-8')
if 'class="data-menu"' not in s:raise SystemExit("Existing Settings markup not found. No changes made.")
if '</head>' not in s or '</body>' not in s:raise SystemExit("HTML anchors missing. No changes made.")
link='<link rel="stylesheet" href="/settings-modal.css?v=20261122-1">'
script='<script src="/settings-modal.js?v=20261122-1" defer></script>'
if link not in s:s=s.replace('</head>',link+'</head>',1)
if script not in s:s=s.replace('</body>',script+'</body>',1)
html.write_text(s,encoding='utf-8')
print("Installed Settings dialog. Existing export/import handlers preserved.")

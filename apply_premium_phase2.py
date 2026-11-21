#!/usr/bin/env python3
from pathlib import Path
p=Path('public/index.html')
if not p.exists():raise SystemExit('Run from repository root.')
s=p.read_text()
if '/premium-phase2.js' in s:raise SystemExit('Phase 2 already installed; no changes made.')
if s.count('</head>')!=1 or s.count('</body>')!=1:raise SystemExit('Unexpected index.html structure; no changes made.')
if 'id="tripForm"' not in s or 'id="tripsPage"' not in s:raise SystemExit('Expected trip editor missing; no changes made.')
p.write_text(s.replace('</head>','<link rel="stylesheet" href="/premium-phase2.css?v=1"></head>').replace('</body>','<script src="/premium-phase2.js?v=1" defer></script></body>'))
print('Installed Phase 2 typography, compact trip actions and tabbed trip editor.')
print('No SQL migration or API changes.')

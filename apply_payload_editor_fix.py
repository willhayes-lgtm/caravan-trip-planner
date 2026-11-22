#!/usr/bin/env python3
from pathlib import Path
p=Path('public/phase2.html')
if not p.exists() or not Path('public/payload-editor-repair.js').exists():
 raise SystemExit('Upload installer to root and JS to public/.')
s=p.read_text(encoding='utf-8')
if 'id="newPayload"' not in s or 'id="payloadDialog"' not in s:raise SystemExit('Payload markup missing; no changes made.')
tag='<script src="/payload-editor-repair.js?v=20261122-2" defer></script>'
if tag not in s:
 if '</body>' not in s:raise SystemExit('Missing body closing tag.')
 s=s.replace('</body>',tag+'</body>',1)
 p.write_text(s,encoding='utf-8')
print('Payload editor repair installed.')

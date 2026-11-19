from pathlib import Path

path = Path("public/checklists.js")
if not path.exists():
    raise SystemExit("Run from repository root: public/checklists.js not found.")
source = path.read_text(encoding="utf-8")
old = '<div id="phaseItems" class="phase-list"></div><form id="phaseAdd"'
new = '<div class="phase-toolbar"><form id="phaseAdd"'
if source.count(old) != 1:
    raise SystemExit("Expected checklist markup not found exactly once; no changes made.")
source = source.replace(old, new, 1)
old = '</button></div><details class="phase-archive">'
new = '</button></div></div><div id="phaseItems" class="phase-list"></div><details class="phase-archive">'
if source.count(old) != 1:
    raise SystemExit("Expected action bar markup not found exactly once; no changes made.")
source = source.replace(old, new, 1)
path.write_text(source, encoding="utf-8")
print("UPDATED: public/checklists.js — task form and actions now above checklist items")

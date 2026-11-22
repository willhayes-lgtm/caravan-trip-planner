#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('public/premium-checklist-polish.css')
if not p.is_file(): raise SystemExit('Run from repository root; stylesheet not found')
s=p.read_text()
for name in ('phaseEdit','phaseReset'):
 s,n=re.subn(r'#phaseLists\s+\.phase-toolbar\s+#'+name+r'::before\s*\{[^}]*\}', '', s)
 if not n and 'CHECKLIST_TOOLBAR_COMPACT_V1' not in s: raise SystemExit('Expected duplicate icon rule not found: '+name+'; no changes saved')
marker='/* CHECKLIST_TOOLBAR_COMPACT_V1 */'
if marker not in s:
 s+='''\n/* CHECKLIST_TOOLBAR_COMPACT_V1 */
#phaseLists .phase-toolbar{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:10px!important;min-height:0!important;margin:12px 0 18px!important;padding:9px 12px!important;border:1px solid #dbe9e9!important;border-radius:13px!important;background:#f7faf9!important;box-shadow:none!important}
#phaseLists .phase-toolbar .phase-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;margin:0 0 0 auto!important;padding:0!important}
#phaseLists .phase-toolbar #phaseAddToggle,#phaseLists .phase-toolbar #phaseEdit,#phaseLists .phase-toolbar #phaseReset{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;height:42px!important;padding:9px 14px!important;margin:0!important;width:auto!important;min-width:0!important;max-width:none!important;font-size:14px!important;font-weight:700!important;line-height:1.2!important;border-radius:10px!important;white-space:nowrap!important}
#phaseLists .phase-toolbar #phaseAddToggle{background:#178f99!important;color:#fff!important}
#phaseLists .phase-toolbar #phaseEdit,#phaseLists .phase-toolbar #phaseReset{background:#e8f2f2!important;color:#164b5b!important;border:1px solid #d5e5e5!important}
#phaseLists .phase-toolbar #phaseEdit::before,#phaseLists .phase-toolbar #phaseReset::before,#phaseLists .phase-toolbar #phaseEdit::after,#phaseLists .phase-toolbar #phaseReset::after{content:none!important;display:none!important}
#phaseLists .phase-toolbar #phaseAdd{flex:1 0 100%!important;order:3!important;margin:2px 0 0!important}
#phaseLists .phase-toolbar #phaseAdd[hidden],#phaseLists .phase-toolbar #phaseAddToggle[hidden]{display:none!important}
#phaseLists .phase-toolbar #phaseEdit:focus-visible,#phaseLists .phase-toolbar #phaseReset:focus-visible,#phaseLists .phase-toolbar #phaseAddToggle:focus-visible{outline:3px solid #168f99!important;outline-offset:2px!important}
@media(max-width:600px){#phaseLists .phase-toolbar{gap:7px!important;padding:8px!important}#phaseLists .phase-toolbar .phase-actions{gap:6px!important}#phaseLists .phase-toolbar #phaseAddToggle,#phaseLists .phase-toolbar #phaseEdit,#phaseLists .phase-toolbar #phaseReset{min-height:44px!important;height:44px!important;padding:9px 11px!important;font-size:13px!important}}
@media(max-width:360px){#phaseLists .phase-toolbar #phaseAddToggle{flex:0 1 auto!important}#phaseLists .phase-toolbar .phase-actions{flex:0 0 auto!important}#phaseLists .phase-toolbar #phaseEdit,#phaseLists .phase-toolbar #phaseReset{padding:9px 8px!important}}
'''
p.write_text(s)
print('Checklist toolbar compacted. No JS, HTML or database changes.')

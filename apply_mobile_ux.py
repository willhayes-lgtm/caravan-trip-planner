#!/usr/bin/env python3
"""Caravan Planner mobile UX patch. Run once from repository root."""
from pathlib import Path

p=Path('public')
required=['index.html','checklists.js','ux-refresh.js','ux-dashboard-v2.js','navigation-controller.js']
for f in required:
    if not (p/f).is_file(): raise SystemExit('Missing '+str(p/f)+' — run from repository root')
files={f:(p/f).read_text() for f in required}

def change(f,old,new,n=1):
    if files[f].count(old)!=n: raise SystemExit(f'Unexpected source in {f}: expected {n} occurrence(s) of {old[:95]!r}, found {files[f].count(old)}. No files have been changed.')
    files[f]=files[f].replace(old,new)

# Shared header: CSS/JS will turn it into the compact mobile bar.
change('index.html','<link rel="stylesheet" href="/ux-refinement.css?v=20261120-2">','<link rel="stylesheet" href="/ux-refinement.css?v=20261120-2"><link rel="stylesheet" href="/mobile-experience.css?v=20261121-1">')
change('index.html','<script src="/navigation-controller.js?v=20261119-3" defer></script>','<script src="/navigation-controller.js?v=20261119-3" defer></script><script src="/mobile-experience.js?v=20261121-1" defer></script>')

# Make menu transitions reflect the new page, including profile and settings.
change('navigation-controller.js'," window.dispatchEvent(new CustomEvent('planner:navigate',{detail:{page:key}}));", " window.dispatchEvent(new CustomEvent('planner:navigate',{detail:{page:key}}));\n if(window.innerWidth<=900){document.body.classList.remove('ux-menu-open');document.querySelector('.ux-menu-toggle')?.setAttribute('aria-expanded','false');document.querySelector('.ux-menu-toggle')?.setAttribute('aria-label','Open menu');window.scrollTo(0,0);}")
# Existing profile click interceptor prevents the authoritative controller from seeing navigation.
change('ux-dashboard-v2.js',"profile.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();select('profile')},true);", "// Profile navigation is handled centrally by navigation-controller.js.")
# Position Add to Dashboard under the current page header, not at top of main.
change('ux-dashboard-v2.js',"main.prepend(bar);b.addEventListener('click'", "main.prepend(bar);const positionPin=()=>{const page=document.querySelector('body[data-current-page] #'+({trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',checklists:'checklistsPage',profile:'checklistsPage',service:'servicePage',payload:'payloadPage'}[activeKey()]||''));if(!page)return;const head=page.querySelector(':scope > .phase-head, :scope > .toolbar, :scope > .section-head, :scope > .phase2 .section-head, :scope > .phase2 #serviceTab .section-head, :scope > .phase2 #payloadTab .section-head');if(head)head.insertAdjacentElement('afterend',bar);else page.prepend(bar);};window.addEventListener('planner:navigate',()=>requestAnimationFrame(positionPin));setTimeout(positionPin,400);b.addEventListener('click'")
# Existing pinbar display controlled by navigation-controller; moving inside page is safe.

# Checklist: compact controls, hide add task until requested, remove historical runs from interface.
change('checklists.js'," $('#phaseAdd').hidden=!edit;$('#phaseEdit').textContent=edit?'✓ Finish editing':'✎ Customise checklist';$('#phaseReset').disabled=!run||!done.size;", " $('#phaseAdd').hidden=!edit||!$('#phaseAddToggle').getAttribute('aria-expanded')||$('#phaseAddToggle').getAttribute('aria-expanded')==='false';$('#phaseAddToggle').hidden=false;$('#phaseEdit').textContent=edit?'Done':'Edit';$('#phaseReset').textContent='Reset';$('#phaseReset').disabled=!run||!done.size;")
# Fix hidden calculation: when aria-expanded false, hide form.
change('checklists.js',"!edit||!$('#phaseAddToggle').getAttribute('aria-expanded')||$('#phaseAddToggle').getAttribute('aria-expanded')==='false'", "$('#phaseAddToggle').getAttribute('aria-expanded')!=='true'")
# Hide history without changing stored checklist runs.

change('checklists.js', '<div class="phase-notice">Safety reminder: these are prompts, not certification of roadworthiness. Always follow the specific caravan, coupling and tow vehicle manufacturers\' instructions.</div>', '<button type="button" id="phaseSafetyInfo" class="phase-safety-info" aria-label="Read checklist safety reminder" title="Safety reminder">ⓘ Safety information</button><dialog id="phaseSafetyDialog" class="phase-safety-dialog"><h3>Safety reminder</h3><p>These checklists are prompts, not certification of roadworthiness. Always follow the specific caravan, coupling and tow vehicle manufacturers\' instructions.</p><button type="button" id="phaseSafetyClose">Got it</button></dialog>')
change('checklists.js','<div class="phase-toolbar"><form id="phaseAdd" class="phase-add" hidden>', '<div class="phase-toolbar"><button type="button" id="phaseAddToggle" class="secondary phase-add-toggle" hidden aria-expanded="false" aria-controls="phaseAdd">+ Add new task</button><form id="phaseAdd" class="phase-add" hidden>')
change('checklists.js','✎ Customise checklist</button><button type="button" id="phaseReset" class="secondary">↻ Reset for next trip', 'Edit</button><button type="button" id="phaseReset" class="secondary">Reset')
change('checklists.js','<details class="phase-archive"><summary>Previous checklist runs</summary><div id="phaseHistory"></div></details>', '')
change('checklists.js'," $('#phaseEdit').onclick=()=>{edit=!edit;draw()};", " $('#phaseEdit').onclick=()=>{edit=!edit;$('#phaseAddToggle').setAttribute('aria-expanded','false');draw()};\n $('#phaseAddToggle').onclick=()=>{const expanded=$('#phaseAddToggle').getAttribute('aria-expanded')==='true';$('#phaseAddToggle').setAttribute('aria-expanded',String(!expanded));$('#phaseAdd').hidden=expanded;if(!expanded)$('#phaseAdd input[name=title]')?.focus()};\n $('#phaseSafetyInfo').onclick=()=>$('#phaseSafetyDialog').showModal();\n $('#phaseSafetyClose').onclick=()=>$('#phaseSafetyDialog').close();")
change('checklists.js',"e.target.reset();await refresh()", "e.target.reset();$('#phaseAddToggle').setAttribute('aria-expanded','false');await refresh()")
# The old history render targets a now-removed element; strip that single line.
import re
history_pattern=r" const older=data\.runs\.filter\(r=>r\.template_id===active.*?;\$\('#phaseHistory'\)\.innerHTML=.*?;\n"
updated, count=re.subn(history_pattern, '', files['checklists.js'], count=1)
if count!=1: raise SystemExit('Could not safely locate old checklist history renderer; no files changed.')
files['checklists.js']=updated


for f,s in files.items(): (p/f).write_text(s)
(p/'mobile-experience.js').write_text(r'''/* Mobile shell: a compact sticky header, accessible drawer and safe settings popover. */
(()=>{'use strict';
const header=document.querySelector('body > header');
const menu=document.querySelector('.ux-menu-toggle');
const sidebar=document.querySelector('.ux-sidebar');
if(!header||!menu||!sidebar)return;
menu.setAttribute('aria-label','Open menu');
menu.setAttribute('aria-controls','uxSidebar');
const close=()=>{document.body.classList.remove('ux-menu-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu')};
const setScrolled=()=>document.body.classList.toggle('ux-scrolled',window.scrollY>48);
window.addEventListener('scroll',setScrolled,{passive:true});setScrolled();
menu.addEventListener('click',()=>menu.setAttribute('aria-label',document.body.classList.contains('ux-menu-open')?'Close menu':'Open menu'));
window.addEventListener('planner:navigate',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('ux-menu-open')){close();menu.focus()}});
// Close when selecting any nav link, including dynamically injected items.
sidebar.addEventListener('click',e=>{if(e.target.closest('a[href],button[data-page],button[data-ux-profile],button[data-uxProfile]'))requestAnimationFrame(close)});
// Move the mobile menu button inside the page header, preserving the original element/listeners.
header.prepend(menu);
// Keep settings within the viewport; its source control remains in the sidebar.
const settings=sidebar.querySelector('.data-menu');
if(settings){
 settings.addEventListener('toggle',()=>{
  if(settings.open&&window.matchMedia('(max-width:900px)').matches){document.body.classList.add('ux-settings-open')}
  else document.body.classList.remove('ux-settings-open');
 });
 document.addEventListener('click',e=>{if(settings.open&&!settings.contains(e.target)){settings.open=false;document.body.classList.remove('ux-settings-open')}});
}
})();
''')
(p/'mobile-experience.css').write_text(r'''/* Mobile-first shell improvements; desktop remains unchanged. */
@media(max-width:900px){
 html{scroll-padding-top:84px}
 body>header{position:sticky!important;top:0;z-index:85;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;width:100%;min-height:76px;padding:12px 16px!important;background:#123f52!important;box-shadow:0 2px 12px #123f5220;transition:min-height .18s,padding .18s}
 body>header>div:first-of-type{min-width:0;flex:1}
 body>header h1{font-size:19px!important;line-height:1.2!important;margin:2px 0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 body>header .eyebrow,body>header p{display:none!important}
 body>header>.ux-menu-toggle{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 auto;position:static!important;order:2;margin:0!important;min-height:44px;padding:9px 12px!important;border-radius:10px;z-index:2}
 body.ux-scrolled>header{min-height:54px;padding:6px 14px!important}
 body.ux-scrolled>header h1{font-size:16px!important}
 .ux-sidebar{position:fixed!important;inset:0 auto 0 0!important;top:0!important;bottom:0!important;height:100vh!important;height:100dvh!important;width:min(340px,88vw)!important;max-height:none!important;z-index:101!important;overflow-y:auto!important;overscroll-behavior:contain!important;transform:translateX(-105%);background:#fff!important;box-shadow:12px 0 35px #123f5240;padding-top:max(12px,env(safe-area-inset-top))!important;padding-bottom:max(16px,env(safe-area-inset-bottom))!important}
 body.ux-menu-open .ux-sidebar{transform:translateX(0)!important}
 body.ux-menu-open .ux-backdrop{display:block!important;position:fixed!important;inset:0!important;z-index:100!important;background:rgba(8,29,36,.52)!important;border:0!important;border-radius:0!important;backdrop-filter:none!important}
 body.ux-menu-open{overflow:hidden}
 .ux-content{background:#f5f9f8!important}
 .ux-content main{padding-top:12px!important}
 .ux-account-footer{position:relative!important;min-width:0!important}
 .ux-account-footer .header-controls{width:100%!important;min-width:0!important;flex-wrap:wrap!important}
 .ux-account-footer .data-menu{width:100%!important;min-width:0!important}
 .ux-account-footer .data-menu>summary{width:100%!important;box-sizing:border-box}
 .ux-account-footer .data-menu-panel{position:static!important;left:auto!important;right:auto!important;top:auto!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-top:8px!important;box-shadow:none!important;overflow-wrap:anywhere!important}
 .ux-account-footer .data-menu-panel button{white-space:normal!important}
 #checklistsPage>.phase-head{margin-bottom:8px!important}
 #checklistsPage .ux-page-pinbar{margin:0 0 10px!important;justify-content:flex-start!important}
 #checklistsPage .ux-page-pinbar button{padding:7px 11px!important;font-size:12px!important}
 .ux-page-pinbar{margin-bottom:10px!important}
 #phaseLists>.phase-card{padding:13px!important}
 #phaseLists .phase-head{gap:8px!important;margin-bottom:10px!important}
 #phaseLists .phase-head h3{font-size:18px!important}
 #phaseLists .phase-head p{margin:2px 0!important}
 #phaseLists .phase-trip{width:100%!important;max-width:none!important}
 #phaseLists #phaseTabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-x:contain;scroll-snap-type:x proximity;gap:6px!important;margin:10px 0 12px!important;padding:0 0 5px!important;scrollbar-width:thin}
 #phaseLists #phaseTabs button{flex:0 0 auto!important;width:auto!important;min-width:0!important;white-space:nowrap!important;scroll-snap-align:start;padding:9px 12px!important;font-size:12px!important;min-height:38px!important}
 #phaseLists #phaseTitle{font-size:18px!important;margin-bottom:4px!important}
 #phaseLists #phaseDescription{font-size:12px!important;margin-bottom:10px!important}
 #phaseLists #phaseProgress{position:sticky!important;top:var(--mobile-progress-top,66px)!important;z-index:30!important;background:#fff!important;border:1px solid #dce9e9!important;box-shadow:0 3px 12px #123f5214!important;padding:10px 12px 5px!important;border-radius:11px!important;margin:0 0 10px!important}
 #phaseLists .phase-progress{height:8px!important;margin:7px 0 4px!important}
 #phaseLists .phase-progress-label{font-size:12px!important}
 body:not(.ux-scrolled){--mobile-progress-top:86px}
 body.ux-scrolled{--mobile-progress-top:64px}
 #phaseLists .phase-toolbar{display:flex!important;flex-direction:column!important;gap:9px!important;padding:0!important;margin:8px 0 12px!important;border:0!important;background:transparent!important}
 #phaseLists .phase-toolbar .phase-actions{display:flex!important;flex-wrap:nowrap!important;gap:8px!important;margin:0!important;order:0}
 #phaseLists .phase-toolbar .phase-actions button{flex:1 1 0!important;width:auto!important;min-width:0!important;margin:0!important;padding:9px 12px!important;font-size:13px!important}
 #phaseLists .phase-add-toggle{order:1;align-self:flex-start;min-height:38px;padding:8px 12px!important;font-size:13px!important}
 #phaseLists #phaseAdd{order:2;display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important;margin:0!important;padding:12px!important;background:#f3f9f8;border:1px solid #dbe9e9;border-radius:11px}
 #phaseLists #phaseAdd[hidden],#phaseLists #phaseAddToggle[hidden]{display:none!important}
 #phaseLists #phaseAdd label{min-width:0!important;width:100%!important}
 #phaseLists .phase-safety-info{display:inline-flex!important;align-items:center;gap:5px;background:transparent!important;color:#226f7b!important;border:0!important;padding:6px 0!important;margin:0 0 7px!important;font-size:12px!important;text-decoration:underline}
 #phaseLists .phase-archive{display:none!important}
 #phaseLists .phase-task{padding:10px!important}
 #phaseLists .phase-task-actions{flex-wrap:wrap!important}
 .phase-safety-dialog{width:min(420px,calc(100vw - 30px))!important;max-height:80dvh!important;overflow:auto!important;padding:22px!important}
 .phase-safety-dialog p{line-height:1.55;color:#405e65}
}
@media(min-width:901px){
 .phase-safety-info{background:transparent!important;color:#226f7b!important;padding:7px 0!important;text-decoration:underline}
 #phaseLists #phaseAdd[hidden],#phaseLists #phaseAddToggle[hidden]{display:none!important}
 #phaseLists .phase-archive{display:none!important}
}
''')
print('Mobile UX files patched:', ', '.join(required))
print('Created public/mobile-experience.js and public/mobile-experience.css')
print('No database migration required')

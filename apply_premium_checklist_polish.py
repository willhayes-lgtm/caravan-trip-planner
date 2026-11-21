#!/usr/bin/env python3
"""Caravan Trip Planner — checklist and trip editor polish.
Run once from repository root after git pull. No database migration.
"""
from pathlib import Path
root=Path("public")
def update(name,old,new):
    p=root/name
    s=p.read_text()
    if old not in s:
        if new in s:
            print(f"Already updated: {name}")
            return
        raise RuntimeError(f"Expected anchor missing in {p}: {old[:110]!r}. No further files changed.")
    p.write_text(s.replace(old,new,1))
    print(f"Updated {p}")

# Remove overlapping focus styling on selected trip tabs, preserving keyboard focus.
(root/"premium-checklist-polish.css").write_text("""
/* Trip editor: one selected state, without stacked focus rings. */
#editor .p2-tabs .p2-tab.active,
#editor .p2-tabs .p2-tab.active:focus,
#editor .p2-tabs .p2-tab.active:focus-visible {
  background:#e3f3f1!important;
  color:#13545a!important;
  border:1px solid #b9d9d7!important;
  box-shadow:none!important;
  outline:none!important;
  outline-offset:0!important;
  transform:none!important;
  -webkit-tap-highlight-color:transparent;
}
#editor .p2-tabs .p2-tab.active::before,
#editor .p2-tabs .p2-tab.active::after {box-shadow:none!important;outline:none!important;}
#editor .p2-tabs .p2-tab:focus-visible:not(.active) {outline:2px solid #147d83!important;outline-offset:2px!important;}
/* The selected tab still needs a visible keyboard focus state, but not a double border. */
#editor .p2-tabs .p2-tab.active:focus-visible {box-shadow:inset 0 0 0 2px #147d83!important;}

/* Move safety information into the heading/progress area. */
#phaseLists .phase-checklist-topline{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;margin:6px 0 4px;}
#phaseLists .phase-checklist-topline #phaseTitle{margin:0;min-width:0;}
#phaseLists #phaseSafetyInfo{position:static!important;display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 44px;width:44px;height:44px;min-width:44px;min-height:44px;padding:0!important;border:1px solid #c4dddf;border-radius:12px;background:#eff7f7;color:#155a68;font-size:24px!important;font-weight:600;line-height:1;box-shadow:none!important;cursor:pointer;}
#phaseLists #phaseSafetyInfo:hover{background:#e0f0f0;}
#phaseLists #phaseSafetyInfo:focus-visible{outline:3px solid #168f99;outline-offset:2px;}
/* Balanced toolbar across phone and desktop. */
#phaseLists .phase-toolbar{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-width:0;}
#phaseLists .phase-toolbar .phase-actions{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important;}
#phaseLists .phase-toolbar #phaseAddToggle,
#phaseLists .phase-toolbar #phaseEdit,
#phaseLists .phase-toolbar #phaseReset{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:46px!important;padding:10px 15px!important;font-size:14px!important;font-weight:700!important;line-height:1.2!important;letter-spacing:0!important;width:auto!important;min-width:0!important;max-width:100%!important;border-radius:12px!important;white-space:nowrap!important;}
#phaseLists .phase-toolbar #phaseAddToggle[hidden]{display:none!important;}
#phaseLists .phase-toolbar #phaseAddToggle{background:#178f99!important;color:#fff!important;}
#phaseLists .phase-toolbar #phaseEdit::before{content:"✎";font-size:21px;line-height:1;}
#phaseLists .phase-toolbar #phaseReset::before{content:"↻";font-size:23px;line-height:1;}
#phaseLists .phase-toolbar #phaseReset:disabled{opacity:.5;}
#phaseLists .phase-toolbar #phaseAdd{flex:1 0 100%;order:3;margin:0;}
#phaseLists .phase-toolbar #phaseAdd[hidden]{display:none!important;}
@media(max-width:600px){
 #phaseLists .phase-toolbar{gap:8px!important;}
 #phaseLists .phase-toolbar .phase-actions{gap:8px!important;}
 #phaseLists .phase-toolbar #phaseAddToggle,
 #phaseLists .phase-toolbar #phaseEdit,
 #phaseLists .phase-toolbar #phaseReset{min-height:44px!important;padding:10px 11px!important;font-size:13px!important;}
 #phaseLists .phase-toolbar #phaseEdit::before{font-size:20px;}
 #phaseLists .phase-toolbar #phaseReset::before{font-size:22px;}
}
@media(max-width:360px){
 #phaseLists .phase-toolbar #phaseAddToggle{flex:1 1 100%;}
 #phaseLists .phase-toolbar .phase-actions{flex:1;justify-content:flex-end;}
}
""".strip()+"\n")

# Ensure this override loads AFTER existing checklist/editor styles.
update("index.html",
       '<link rel="stylesheet" href="/trip-editor-tab-fix.css?v=1"></head>',
       '<link rel="stylesheet" href="/trip-editor-tab-fix.css?v=1"><link rel="stylesheet" href="/premium-checklist-polish.css?v=20261121-2"></head>')

# Move the existing safety button (preserve its id and click handler).
update("checklists.js",
       '<h3 id="phaseTitle"></h3><p class="phase-subtitle" id="phaseDescription"></p><div id="phaseProgress"></div><button type="button" id="phaseSafetyInfo" class="phase-safety-info" aria-label="Read checklist safety reminder" title="Safety reminder">ⓘ Safety information</button>',
       '<div class="phase-checklist-topline"><h3 id="phaseTitle"></h3><button type="button" id="phaseSafetyInfo" class="phase-safety-info" aria-label="Read checklist safety reminder" title="Safety information">ⓘ</button></div><p class="phase-subtitle" id="phaseDescription"></p><div id="phaseProgress"></div>')

# Keep button names in source (accessible and descriptive), let CSS add clear icons.
update("checklists.js",
       'id="phaseAddToggle" class="secondary phase-add-toggle" hidden aria-expanded="false" aria-controls="phaseAdd">+ Add new task',
       'id="phaseAddToggle" class="secondary phase-add-toggle" hidden aria-expanded="false" aria-controls="phaseAdd">+ Add task')

# Replace the existing defaults panel script with a version that checks the actual
# checklist data before showing the prompt, and hides itself when no tasks are missing.
p=root/"checklist-defaults.js"
s=p.read_text()
anchor="function mount(){const root=document.getElementById('phaseLists');"
if anchor not in s:
    raise RuntimeError("Unexpected checklist-defaults.js layout; review before applying")
s=s[:s.index("function mount(){")]+r"""
async function pending(){
 const response=await fetch('/api/checklists',{credentials:'same-origin'});
 if(!response.ok)throw Error('Unable to check recommended tasks');
 const data=await response.json();
 const targets=Object.entries(sets).map(([kind,entries])=>({entries,template:choose(data.templates||[],kind)}));
 if(targets.some(x=>!x.template))return null;
 return targets.reduce((count,{entries,template})=>count+entries.filter(([,title])=>!(data.items||[]).some(x=>x.template_id===template.id&&norm(x.title)===norm(title))).length,0);
}
let checking=false, lastCheck=0;
async function syncPanel(force=false){
 const panel=document.querySelector('.ct-defaults-panel');
 if(!panel||checking)return;
 if(!force&&Date.now()-lastCheck<20000)return;
 checking=true;lastCheck=Date.now();
 try{
   const count=await pending();
   panel.hidden=count===0||count===null;
   if(count>0){
     const status=panel.querySelector('#ct-defaults-status');
     if(status)status.textContent=`${count} recommended task${count===1?'':'s'} available to add.`;
   }
 }catch(e){
   // Don't block checklist usage if the recommendations API is unavailable.
   panel.hidden=true;
 }finally{checking=false;}
}
function mount(){
 const root=document.getElementById('phaseLists');
 if(!root||document.getElementById('ct-defaults-import'))return;
 const card=root.querySelector('.phase-card');
 if(!card)return;
 const panel=document.createElement('div');
 panel.className='ct-defaults-panel';
 panel.hidden=true;
 panel.innerHTML='<div><strong>Recommended setup & departure tasks</strong><p>Add motor mover, Aquaroll, toilet and departure checks without replacing your personalised lists.</p><small id="ct-defaults-status" role="status" aria-live="polite"></small></div><button type="button" id="ct-defaults-import" class="secondary">Add missing defaults</button>';
 card.append(panel);
 panel.querySelector('button').addEventListener('click',async()=>{await run();await syncPanel(true)});
 syncPanel(true);
}
function init(){
 mount();
 new MutationObserver(()=>mount()).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPanel(true)});
 window.addEventListener('planner:navigate',e=>{if(e.detail?.page==='checklists')syncPanel(true)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
"""
p.write_text(s)
# Hidden must beat flex styling even if other CSS specifies display:flex.
with (root/"premium-checklist-polish.css").open("a") as f:
    f.write("\n#phaseLists .ct-defaults-panel[hidden]{display:none!important;}\n")
print("Updated public/checklist-defaults.js")
print("Checklist polish installed. No SQL migration or API changes.")

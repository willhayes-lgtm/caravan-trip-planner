#!/usr/bin/env python3
from pathlib import Path
h=Path('public/index.html'); c=Path('public/checklists.js')
if not h.exists() or not c.exists(): raise SystemExit('Run from repository root')
html=h.read_text(); src=c.read_text()
old=" $('#phaseProgress').innerHTML=`<div class=\"phase-progress-label\"><span>${its.filter(x=>done.has(x.id)).length} of ${its.length} completed</span><span>${percent}%</span></div><div class=\"phase-progress\"><span style=\"width:${percent}%\"></span></div>`;"
new=''' const progress=$('#phaseProgress'),key=active+'|'+trip,priorKey=progress.dataset.key;
 const previous=Number(progress.dataset.percent||0),count=its.filter(x=>done.has(x.id)).length;
 if(!progress.querySelector('.phase-progress>span'))progress.innerHTML='<div class="phase-progress-label"><span class="mcf-count"></span><span class="mcf-percent">0%</span></div><div class="phase-progress"><span></span></div>';
 progress.querySelector('.mcf-count').textContent=`${count} of ${its.length} completed`;
 const bar=progress.querySelector('.phase-progress>span'),label=progress.querySelector('.mcf-percent');
 const start=priorKey===key?previous:percent,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(progress._frame)cancelAnimationFrame(progress._frame);
 if(progress._innerFrame)cancelAnimationFrame(progress._innerFrame);
 if(progress._counter)cancelAnimationFrame(progress._counter);
 bar.style.transition=reduced?'none':'width 450ms cubic-bezier(.22,1,.36,1)';
 bar.style.width=start+'%';label.textContent=Math.round(start)+'%';
 progress.dataset.key=key;progress.dataset.percent=String(percent);
 if(reduced||start===percent){bar.style.width=percent+'%';label.textContent=percent+'%';}
 else{
  progress._frame=requestAnimationFrame(()=>{progress._innerFrame=requestAnimationFrame(()=>bar.style.width=percent+'%')});
  const begin=performance.now();const tick=now=>{const t=Math.min(1,(now-begin)/450),ease=1-(1-t)**3;label.textContent=Math.round(start+(percent-start)*ease)+'%';if(t<1)progress._counter=requestAnimationFrame(tick)};
  progress._counter=requestAnimationFrame(tick);
 }'''
if src.count(old)!=1: raise SystemExit('Expected progress marker not found; no changes made')
if 'mobile-checklist-focus.js' in html:raise SystemExit('Already installed; do not run twice')
if html.count('</head>')!=1 or html.count('</body>')!=1:raise SystemExit('Unexpected HTML structure')
js=r'''(()=>{'use strict';
function init(){
 const page=document.getElementById('checklistsPage');if(!page)return;
 const heading=page.querySelector(':scope > .phase-head'),card=page.querySelector('#phaseLists>.phase-card');
 const toolbar=document.querySelector('#phaseLists .phase-toolbar'),tabs=document.getElementById('phaseTabs');
 const progress=document.getElementById('phaseProgress');
 if(!heading||!card||!toolbar||!tabs||!progress)return;
 const pin=page.querySelector('.ux-page-pinbar');
 const top=document.createElement('div');top.className='mcf-top';heading.before(top);top.append(heading);if(pin)top.append(pin);
 const headingTitle=heading.querySelector('h2');if(headingTitle)headingTitle.textContent='Checklists';
 const anchor=document.createElement('div');anchor.className='mcf-actions';toolbar.before(anchor);anchor.append(toolbar);
 const manage=document.createElement('details');manage.className='mcf-manage';
 manage.innerHTML='<summary aria-label="Manage checklist">••• <span>Manage</span></summary><div class="mcf-panel"></div>';
 anchor.append(manage);const panel=manage.querySelector('.mcf-panel');
 const add=document.getElementById('phaseAddToggle'),form=document.getElementById('phaseAdd'),actions=toolbar.querySelector('.phase-actions'),safety=document.getElementById('phaseSafetyInfo');
 if(!add||!form||!actions||!safety)return;
 const mobile=matchMedia('(max-width:900px)');
 function place(){
  if(mobile.matches){panel.append(add,form,actions,safety);manage.hidden=false;toolbar.hidden=true;}
  else{manage.open=false;manage.hidden=true;toolbar.hidden=false;toolbar.append(add,form,actions);progress.after(safety)}
  const b=document.getElementById('uxPinCurrent');if(b&&mobile.matches)b.textContent=b.getAttribute('aria-pressed')==='true'?'✓ Dashboard':'+ Dashboard';
 }
 place();mobile.addEventListener('change',place);
 const short=()=>{if(!mobile.matches)return;tabs.querySelectorAll('[data-template]').forEach(b=>{const t=b.textContent.trim();if(!b.dataset.mcfOriginal)b.dataset.mcfOriginal=t;const s=b.dataset.mcfOriginal;b.setAttribute('aria-label',s);b.textContent=/departure.*hitch|safe hitch|^departure/i.test(s)?'Departure':/setup/i.test(s)?'Setup':/pack|leav/i.test(s)?'Pack down':s})};
 new MutationObserver(short).observe(tabs,{childList:true});short();
 // Existing navigation moves the dashboard button; put it back alongside heading.
 window.addEventListener('planner:navigate',()=>requestAnimationFrame(()=>{const b=page.querySelector('.ux-page-pinbar');if(b&&b.parentNode!==top)top.append(b);place()}));
 const pinButton=document.getElementById('uxPinCurrent');if(pinButton)new MutationObserver(()=>{if(!mobile.matches)return;const desired=pinButton.getAttribute('aria-pressed')==='true'?'✓ Dashboard':'+ Dashboard';if(pinButton.textContent!==desired)pinButton.textContent=desired}).observe(pinButton,{childList:true,attributes:true,attributeFilter:['aria-pressed']});
 panel.addEventListener('click',e=>{if(e.target.closest('#phaseSafetyInfo,#phaseEdit,#phaseReset'))manage.open=false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();'''
css='''@media(max-width:900px){
 #checklistsPage .mcf-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px}
 #checklistsPage .mcf-top>.phase-head{margin:0!important;min-width:0;flex:1}
 #checklistsPage .mcf-top>.phase-head h2{font-size:23px!important;line-height:1.2;margin:0!important}
 #checklistsPage .mcf-top>.phase-head p{display:none!important}
 #checklistsPage .mcf-top>.ux-page-pinbar{margin:0!important;flex:0 0 auto}
 #checklistsPage .mcf-top #uxPinCurrent{padding:9px!important;min-height:40px;font-size:12px!important;white-space:nowrap}
 #phaseLists>.phase-card{padding:12px!important}
 #phaseLists>.phase-card>.phase-head{margin-bottom:8px!important}
 #phaseLists .phase-checklist-title,#phaseLists .phase-muted,#phaseLists #phaseDescription{display:none!important}
 #phaseLists .phase-trip{font-size:12px!important;margin:0!important}
 #phaseLists .phase-trip select{min-height:42px!important;padding:8px!important;font-size:14px!important}
 #phaseLists #phaseTabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;overflow:visible!important;padding:0!important;margin:9px 0!important}
 #phaseLists #phaseTabs button{width:100%!important;min-width:0!important;padding:9px 3px!important;font-size:12px!important;white-space:normal!important;min-height:42px!important}
 #phaseLists #phaseTitle{font-size:16px!important;margin:6px 0 7px!important}
 #phaseLists #phaseProgress{margin:0 0 8px!important;padding:8px 10px 5px!important}
 #phaseLists .phase-progress{height:7px!important;margin:6px 0 3px!important}
 #phaseLists .mcf-actions{display:flex;justify-content:flex-end;margin:0 0 8px}
 #phaseLists .mcf-manage{position:relative;margin-left:auto}
 #phaseLists .mcf-manage>summary{cursor:pointer;list-style:none;border:1px solid #c9dedf;border-radius:9px;padding:8px 10px;color:#164b5b;background:#f1f7f7;font-size:13px;font-weight:700;min-height:38px;box-sizing:border-box}
 #phaseLists .mcf-manage>summary::-webkit-details-marker{display:none}
 #phaseLists .mcf-panel{position:absolute;right:0;top:calc(100% + 5px);z-index:35;width:min(270px,calc(100vw - 48px));background:#fff;border:1px solid #cddfe1;border-radius:12px;padding:12px;box-shadow:0 12px 30px #123f5233;display:flex;flex-direction:column;gap:8px}
 #phaseLists .mcf-manage:not([open]) .mcf-panel{display:none!important}
 #phaseLists .mcf-panel .phase-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0!important}
 #phaseLists .mcf-panel .phase-actions button{min-width:0!important;padding:9px!important}
 #phaseLists .mcf-panel .phase-add-toggle{width:100%;margin:0!important}
 #phaseLists .mcf-panel #phaseAdd{padding:8px!important}
 #phaseLists .mcf-panel .phase-safety-info{margin:0!important;align-self:flex-start}
 #phaseLists .phase-task{padding:10px 11px!important;gap:10px!important;min-height:54px}
 #phaseLists .phase-task input[type=checkbox]{width:27px!important;height:27px!important}
 #phaseLists .phase-task-title{font-size:14px!important;line-height:1.35}
 #phaseLists .phase-task small{font-size:12px!important;line-height:1.35}
 #phaseLists .phase-list{gap:6px!important}
}
@media(prefers-reduced-motion:reduce){#phaseLists .phase-progress>span{transition:none!important}}
'''
# Write only after validations
c.write_text(src.replace(old,new));h.write_text(html.replace('</head>','<link rel="stylesheet" href="/mobile-checklist-focus.css?v=20261121-1"></head>').replace('</body>','<script src="/mobile-checklist-focus.js?v=20261121-1" defer></script></body>'))
Path('public/mobile-checklist-focus.js').write_text(js);Path('public/mobile-checklist-focus.css').write_text(css)
print('Updated checklist UX, animated progress and styles. No SQL migration.')

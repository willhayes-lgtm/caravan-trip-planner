from pathlib import Path
p=Path('public/index.html'); c=Path('public/checklists.js')
if not p.exists() or not c.exists(): raise SystemExit('Run from repository root')
h=p.read_text(); s=c.read_text()
if '/premium-interactions.js' in h: raise SystemExit('Already installed')
old="renderProfile();$('#phaseError').textContent='';alert('Caravan profile saved.')"
new="renderProfile();$('#phaseError').textContent='';window.caravanUXToast?.('Caravan profile saved')"
if s.count(old)!=1 or h.count('</head>')!=1 or h.count('</body>')!=1: raise SystemExit('Unexpected source version. No changes made; send terminal screenshot.')
js='''(()=>{'use strict';
let toastNode,timer;
window.caravanUXToast=(message)=>{if(!toastNode){toastNode=document.createElement('div');toastNode.className='premium-toast';toastNode.setAttribute('role','status');toastNode.setAttribute('aria-live','polite');document.body.append(toastNode)}toastNode.textContent=message;clearTimeout(timer);requestAnimationFrame(()=>toastNode.classList.add('visible'));timer=setTimeout(()=>toastNode.classList.remove('visible'),2200)};
function init(){const list=document.getElementById('phaseItems');if(!list)return;let pending=null;
list.addEventListener('change',e=>{const input=e.target.closest('input[data-check]');if(input?.checked)pending={id:input.dataset.check,at:Date.now()}},true);
new MutationObserver(()=>{if(!pending)return;if(Date.now()-pending.at>5000){pending=null;return}const row=[...list.querySelectorAll('.phase-task[data-id]')].find(x=>x.dataset.id===pending.id);if(!row?.classList.contains('checked'))return;pending=null;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){row.classList.add('premium-completed');row.addEventListener('animationend',()=>row.classList.remove('premium-completed'),{once:true})}window.caravanUXToast('Task completed')}).observe(list,{childList:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();'''
css='''/* Premium interaction polish */
button:not(:disabled){transition:background-color .18s ease,border-color .18s ease,transform .18s cubic-bezier(.22,1,.36,1)}
button:not(:disabled):active{transform:scale(.985)}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #168f99;outline-offset:2px}
#phaseItems .phase-task{transition:background-color .2s ease}
#phaseItems .phase-task input[type=checkbox]{accent-color:#168a74}
#phaseItems .phase-task.premium-completed{animation:premium-complete .38s cubic-bezier(.22,1,.36,1)}
@keyframes premium-complete{0%{transform:scale(.987);background:#d5f2e8}55%{transform:scale(1.008);background:#e2f6ee}100%{transform:scale(1);background:transparent}}
.premium-toast{position:fixed;bottom:max(24px,env(safe-area-inset-bottom) + 18px);left:50%;transform:translate(-50%,12px);opacity:0;pointer-events:none;z-index:99999;max-width:90vw;padding:12px 18px;border-radius:12px;background:#176f65;color:white;font-weight:650;box-shadow:0 10px 30px #062f3c33;transition:opacity .2s,transform .2s}
.premium-toast.visible{opacity:1;transform:translate(-50%,0)}
@media(max-width:900px){.premium-toast{bottom:max(100px,env(safe-area-inset-bottom) + 85px)}}
@media(prefers-reduced-motion:reduce){button,.premium-toast,#phaseItems .phase-task{transition:none!important}#phaseItems .phase-task.premium-completed{animation:none!important}}
'''
c.write_text(s.replace(old,new,1));p.write_text(h.replace('</head>','<link rel="stylesheet" href="/premium-interactions.css?v=1"></head>').replace('</body>','<script src="/premium-interactions.js?v=1" defer></script></body>'))
Path('public/premium-interactions.js').write_text(js);Path('public/premium-interactions.css').write_text(css)
print('Premium UX Phase 1 installed. No database migration required.')

(()=>{'use strict';
function sync(){
 const dialog=document.getElementById('payloadSafetyDialog');
 const done=document.getElementById('payloadSafetyDone');
 if(done){done.hidden=true;done.tabIndex=-1;done.setAttribute('aria-hidden','true')}
 const close=document.getElementById('payloadSafetyClose');
 if(close){close.setAttribute('title','Close safety information')}
 // A descriptive label ensures the icon-only dashboard action is understandable.
 const pin=document.getElementById('uxPinCurrent');
 if(pin){
   const on=pin.getAttribute('aria-pressed')==='true';
   const label=on?'Remove from my dashboard':'Add to my dashboard';
   pin.setAttribute('aria-label',label);pin.setAttribute('title',label);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
window.addEventListener('planner:navigate',()=>setTimeout(sync,120));
document.addEventListener('click',e=>{if(e.target.closest?.('#uxPinCurrent'))setTimeout(sync,150)});
})();
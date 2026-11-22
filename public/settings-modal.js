(()=>{'use strict';
function init(){
 const details=document.querySelector('.data-menu'),panel=details?.querySelector('.data-menu-panel'),summary=details?.querySelector('summary');
 if(!details||!panel||!summary||document.getElementById('settingsDataDialog'))return;
 const dialog=document.createElement('dialog');dialog.id='settingsDataDialog';dialog.setAttribute('aria-labelledby','settingsDataTitle');
 dialog.innerHTML='<div class="settings-modal-inner"><div class="settings-modal-head"><h2 id="settingsDataTitle">Settings</h2><button type="button" class="settings-modal-close" aria-label="Close settings">×</button></div><div class="settings-modal-body"></div></div>';
 document.body.append(dialog);
 const body=dialog.querySelector('.settings-modal-body'),close=dialog.querySelector('.settings-modal-close');
 const marker=document.createComment('settings panel original location');panel.before(marker);
 body.append(panel);details.open=false;
 function open(){details.open=false;if(!dialog.open)dialog.showModal();close.focus()}
 function dismiss(){if(dialog.open)dialog.close()}
 summary.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open()},true);
 summary.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}},true);
 close.addEventListener('click',dismiss);
 dialog.addEventListener('click',e=>{if(e.target===dialog)dismiss()});
 // Keep sidebar navigation's existing #settings deep link functional.
 function route(){if(location.hash==='#settings')open()}
 window.addEventListener('hashchange',()=>setTimeout(route,0));
 const observer=new MutationObserver(()=>{if(details.open){details.open=false;open()}});
 observer.observe(details,{attributes:true,attributeFilter:['open']});
 // File input remains hidden; import button still triggers the existing handler.
 const input=panel.querySelector('#file');if(input)input.hidden=true;
 setTimeout(route,0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
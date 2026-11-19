/* Shared account controls at the foot of the sidebar, including Phase 2. */
(()=>{'use strict';
function mount(){
 const sidebar=document.querySelector('.ux-sidebar');if(!sidebar)return;
 let footer=sidebar.querySelector('.ux-account-footer');if(footer)return;
 footer=document.createElement('div');footer.className='ux-account-footer';
 const phase=location.pathname.includes('phase2.html');
 if(!phase){
  const controls=document.querySelector('header .header-controls');
  if(controls){footer.append(controls);controls.classList.add('ux-footer-controls');
   const details=controls.querySelector('.data-menu');if(details){const summary=details.querySelector('summary');if(summary)summary.textContent='⚙ Settings';}
   const logout=controls.querySelector('#logout');if(logout)logout.textContent='↪ Sign out';
  }
 }else{
  const settings=document.createElement('a');settings.href='/#settings';settings.textContent='⚙ Settings';settings.className='ux-account-link';
  const signout=document.createElement('a');signout.href='/?signout=1';signout.textContent='↪ Sign out';signout.className='ux-account-link';
  footer.append(settings,signout);
 }
 sidebar.append(footer);
}
function route(){
 if(location.pathname.includes('phase2.html'))return;
 if(location.hash==='#settings'){
  const details=document.querySelector('.ux-account-footer .data-menu');if(details){details.open=true;details.querySelector('summary')?.focus();}
 }
 if(new URLSearchParams(location.search).get('signout')==='1'){
  const btn=document.getElementById('logout');if(btn){history.replaceState(null,'',location.pathname);btn.click();}
 }
}
function init(){mount();route();setTimeout(mount,500);setTimeout(mount,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('hashchange',route);
})();

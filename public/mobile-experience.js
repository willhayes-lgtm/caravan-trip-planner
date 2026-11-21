/* Mobile shell: a compact sticky header, accessible drawer and safe settings popover. */
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

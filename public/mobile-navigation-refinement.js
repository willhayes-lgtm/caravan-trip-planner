(()=>{'use strict';
const pages={trips:'tripsPage',wishlist:'wishlistPage',shopping:'shoppingPage',towing:'towingPage',maintenance:'maintenancePage',checklists:'checklistsPage',service:'servicePage',payload:'payloadPage'};
function init(){
 const header=document.querySelector('body>header'),menu=document.querySelector('.ux-menu-toggle');
 if(header&&menu&&menu.parentElement===header)header.insertBefore(menu,header.firstElementChild);
 const links={};
 Object.entries(pages).forEach(([key,id])=>{
  const section=document.getElementById(id);if(!section)return;
  const link=document.createElement('a');link.className='mnr-home-link';
  link.href='#dashboard';link.dataset.uxGo='dashboard';
  link.textContent='← Dashboard';link.setAttribute('aria-label','Back to dashboard');
  section.insertBefore(link,section.firstChild);links[key]=link;
 });
 function sync(){
  const page=document.body.dataset.currentPage||'dashboard';
  const mobile=matchMedia('(max-width:900px)').matches;
  Object.entries(links).forEach(([key,link])=>{
   link.hidden=!mobile||(key!==page&&!(key==='checklists'&&page==='profile'));
  });
 }
 window.addEventListener('planner:navigate',sync);
 window.addEventListener('resize',sync,{passive:true});
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
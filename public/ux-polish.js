/* Sidebar cleanup and reuse of the existing live next-trip tile. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
function update(){
 const nav=$('.ux-nav');if(!nav)return;
 const phase=location.pathname.includes('phase2.html');
 const links=[...nav.querySelectorAll('button,a')];
 const find=(key)=>links.find(el=>el.dataset.page===key||el.getAttribute('href')===key);
 const clean=(el,label)=>{if(el){el.textContent=label;el.setAttribute('title',label.replace(/^[^ ]+ /,''));}return el};
 const dash=find('dashboard')||find('/');clean(dash,'⌂  Dashboard');
 const trips=find('trips')||find('/#trips')||find('/');
 if(!phase)clean(trips,'▦  My Trips');
 const wish=find('wishlist');clean(wish,'♡  Wish List');
 const shopping=find('shopping');clean(shopping,'▤  Shopping List');
 const towing=find('towing');clean(towing,'↗  Towing Log');
 const service=links.find(el=>el.dataset.page==='service'||el.getAttribute('onclick')?.includes('#service')||el.getAttribute('href')==='/phase2.html#service');clean(service,'⚒  Service History');
 const payload=links.find(el=>el.dataset.page==='payload'||el.getAttribute('onclick')?.includes('#payload')||el.getAttribute('href')==='/phase2.html#payload');clean(payload,'⚖  Payload');
 const profile=nav.querySelector('[data-ux-profile]')||nav.querySelector('[data-uxProfile]');clean(profile,'▣  Profile');
 const checklist=find('checklists');clean(checklist,'☑  Checklists');
 const maintenance=find('maintenance');clean(maintenance,'⚙  Maintenance');
 nav.querySelectorAll('.ux-nav-group').forEach(x=>x.remove());
 const group=(label)=>{const el=document.createElement('div');el.className='ux-nav-group';el.textContent=label;nav.append(el)};
 const add=(el)=>{if(el&&el.parentElement===nav)nav.append(el)};
 add(dash);group('TRAVEL');[trips,wish,towing].forEach(add);group('MY CARAVAN');[profile,checklist,maintenance,service,payload,shopping].forEach(add);
 if(!phase){
  const d=$('#dashboardPage'),tile=$('#nextTrip');
  if(d&&tile){let home=$('#uxDashboardCards');if(home&&!$('#uxNextTripHost')){
   const host=document.createElement('div');host.id='uxNextTripHost';d.insertBefore(host,home);host.append(tile);
  }}
  const welcome=$('.ux-welcome');if(welcome)welcome.remove();
  const summary=$('.ux-next');if(summary)summary.remove();
 }
}
let scheduled=false;const run=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update()})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{update();setTimeout(update,700);setTimeout(update,1600)});else{update();setTimeout(update,700);setTimeout(update,1600)};
})();

/* Consistent Phase 2 sidebar: use the same grouping, ordering and active state as the dashboard. */
(()=>{'use strict';if(!location.pathname.includes('phase2.html'))return;
function sync(){const nav=document.querySelector('.phase2-site-nav.ux-nav');if(!nav)return;
 const anchors=[...nav.querySelectorAll('a')];const find=href=>anchors.find(a=>a.getAttribute('href')===href);
 const order=[['/','⌂ Dashboard'],['/#trips','▦ My Trips'],['/#wishlist','♡ Wish List'],['/#towing','↗ Towing Log'],['/#profile','▣ Profile'],['/#checklists','☑ Checklists'],['/#maintenance','⚙ Maintenance'],['/phase2.html#service','⚒ Service History'],['/phase2.html#payload','⚖ Payload'],['/#shopping','▤ Shopping List']];
 nav.querySelectorAll('.ux-nav-group').forEach(e=>e.remove());
 const group=t=>{const d=document.createElement('div');d.className='ux-nav-group';d.textContent=t;nav.append(d)};
 order.forEach(([href,label],i)=>{if(i===1)group('TRAVEL');if(i===4)group('MY CARAVAN');let a=find(href);if(a){a.textContent=label;nav.append(a)}});
 anchors.forEach(a=>{if(!order.some(([h])=>h===a.getAttribute('href')))a.remove()});
 const current=location.hash==='#payload'?'/phase2.html#payload':'/phase2.html#service';
 nav.querySelectorAll('a').forEach(a=>{const active=a.getAttribute('href')===current;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 }
 document.addEventListener('DOMContentLoaded',()=>{sync();setTimeout(sync,300);setTimeout(sync,900)});window.addEventListener('hashchange',sync);
 document.addEventListener('click',e=>{if(e.target.closest('[data-phase-link]'))setTimeout(sync,0)});
})();

(()=>{if(location.pathname.includes('phase2.html'))return;function route(){const key=location.hash.slice(1);if(!['trips','wishlist','shopping','towing'].includes(key))return;const b=document.querySelector('.main-nav [data-page="'+key+'"]');if(b)b.click()}document.addEventListener('DOMContentLoaded',()=>setTimeout(route,950));window.addEventListener('hashchange',()=>setTimeout(route,0))})();

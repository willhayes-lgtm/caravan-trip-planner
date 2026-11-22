/* Connect mobile menu buttons to existing inventory functionality. */
(() => {
  function init() {
    const menu=document.querySelector('#payloadTab .payload-more');
    if(!menu)return;
    menu.querySelectorAll('[data-inventory-action]').forEach(button=>{
      button.addEventListener('click',()=>{
        menu.open=false;
        document.getElementById(button.dataset.inventoryAction==='import'?'importInventory':'exportInventory')?.click();
      });
    });
    document.addEventListener('click',event=>{
      if(menu.open && !menu.contains(event.target))menu.open=false;
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')menu.open=false;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

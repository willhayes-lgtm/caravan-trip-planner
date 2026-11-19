(()=>{'use strict';
const sidebar=document.getElementById('phaseSidebar');
const toggle=document.getElementById('phaseMenuToggle');
const backdrop=document.getElementById('phaseMenuBackdrop');
const close=()=>{sidebar.classList.remove('open');backdrop.classList.remove('open');toggle.setAttribute('aria-expanded','false')};
toggle.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');backdrop.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open))});
backdrop.addEventListener('click',close);
sidebar.querySelector('nav').addEventListener('click',close);
function sync(){const section=location.hash==='#payload'?'payload':'service';const button=document.querySelector(`.tabs [data-tab="${section}"]`);if(button)button.click();document.querySelectorAll('[data-phase-link]').forEach(a=>{if(a.dataset.phaseLink===section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
window.addEventListener('hashchange',sync);sync();
})();

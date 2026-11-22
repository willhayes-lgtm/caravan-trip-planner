from pathlib import Path
import re
root=Path(__file__).resolve().parent
public=root/'public' if (root/'public/checklists.js').exists() else root
js=public/'checklists.js'
if not js.exists(): raise SystemExit('Run this script from the repository root (public/checklists.js required).')
s=js.read_text()
if 'PROFILE_PATCH_20261122' not in s:
    marker='function renderProfile(){'
    if marker not in s:raise SystemExit('Profile renderer not found; no changes made')
    helpers='''/* PROFILE_PATCH_20261122 */
function profileField(key,label,type){
 const val=dimensionKeys.has(key)?metresFromMm(profile[key]):(profile[key]??'');
 if(key==='warranty_notes')return `<label class="wide"><span>${esc(label)}</span><textarea name="${key}" rows="3">${esc(val)}</textarea></label>`;
 if(key==='axles')return `<label><span>Axle configuration</span><select name="axles"><option value="">Select axle type</option><option value="1" ${String(val)==='1'?'selected':''}>Single axle</option><option value="2" ${String(val)==='2'?'selected':''}>Twin axle</option></select></label>`;
 if(key==='noseweight_limit_kg')return `<label><span>${esc(label)}</span><input name="${key}" type="number" min="0" step="any" value="${esc(val)}"><span class="profile-nose-guide"><strong data-nose-guide></strong><small>85% planning reference only — not a required loading target. Follow manufacturer limits.</small></span></label>`;
 if(key==='tyre_size')return `<label><span>${esc(label)}</span><input name="${key}" placeholder="185/80 R14 104N" pattern="[0-9]{3}/[0-9]{2,3}\\s*[Rr]\\s*[0-9]{2}(\\s+[0-9]{2,3}[A-Za-z])?" title="Example: 185/80 R14 104N" value="${esc(val)}"><small class="profile-field-help">Width/profile R rim, optionally load index and speed rating. Check your tyre sidewall.</small></label>`;
 if(key==='insurance_contact'||key==='breakdown_contact')return `<label><span>${esc(label)}</span><input name="${key}" type="tel" value="${esc(val)}"><span class="profile-call-container" data-call="${key}"></span></label>`;
 return `<label><span>${esc(label)}</span><input name="${key}" type="${type||'text'}" ${type==='number'?'min="0" step="any"':''} value="${esc(val)}"></label>`;
}
function updateProfileExtras(){
 const root=$('#phaseProfileForm');if(!root)return;
 const nose=root.querySelector('[name="noseweight_limit_kg"]'),guide=root.querySelector('[data-nose-guide]');
 if(nose&&guide){const n=Number(nose.value);guide.textContent=nose.value.trim()!==''&&Number.isFinite(n)&&n>0?`85% reference: ${(n*.85).toLocaleString('en-GB',{maximumFractionDigits:1})} kg`:'Enter noseweight limit';}
 for(const key of ['insurance_contact','breakdown_contact']){const inp=root.querySelector(`[name="${key}"]`),slot=root.querySelector(`[data-call="${key}"]`);if(!inp||!slot)continue;const number=inp.value.trim(),dial=number.replace(/[^+0-9]/g,'');slot.replaceChildren();if(/^\\+?[0-9]{6,15}$/.test(dial)){const a=document.createElement('a');a.href='tel:'+dial;a.className='profile-call-link';a.textContent='☎ Call '+number;slot.append(a);}}
}
'''
    s=s.replace(marker,helpers+marker,1)
    pattern=r'\$\{fields\.map\(\(\[key,label,type\]\)=>`<label.*?\)\.join\(\'\'\)\}'
    updated,count=re.subn(pattern,"${fields.map(([key,label,type])=>profileField(key,label,type)).join('')}",s,count=1)
    if count!=1:raise SystemExit('Unexpected profile field renderer. No changes saved.')
    s=updated.replace(" }).join('');\n}\nfunction setup()", " }).join('');\n updateProfileExtras();\n}\nfunction setup()",1)
    s=s.replace(" $('#phaseProfileSave').onsubmit=", " $('#phaseProfileForm').addEventListener('input',e=>{if(['noseweight_limit_kg','insurance_contact','breakdown_contact'].includes(e.target.name))updateProfileExtras()});\n $('#phaseProfileSave').onsubmit=",1)
    js.write_text(s)
(public/'caravan-profile-update.css').write_text('''#phaseProfileForm .profile-nose-guide{display:flex;flex-direction:column;gap:5px;background:#f0f4f7;color:#243343;border-radius:9px;padding:12px;margin-top:8px;line-height:1.35}#phaseProfileForm .profile-nose-guide small,#phaseProfileForm .profile-field-help{display:block;font-size:12px;line-height:1.45;margin-top:7px;font-weight:400}#phaseProfileForm .profile-call-container{display:block;margin-top:8px}#phaseProfileForm .profile-call-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 12px;border:1px solid currentColor;border-radius:9px;text-decoration:none;font-weight:600;max-width:100%;box-sizing:border-box}#phaseProfileForm select[name=axles],#phaseProfileForm input[name=tyre_size],#phaseProfileForm input[type=tel]{width:100%;min-width:0;box-sizing:border-box}@media(max-width:600px){#phaseProfileForm .profile-call-link{width:100%}}
''')
html=public/'index.html'
if html.exists():
    h=html.read_text()
    if '/caravan-profile-update.css' not in h:h=h.replace('</head>','<link rel="stylesheet" href="/caravan-profile-update.css?v=1"></head>',1)
    h=re.sub(r'/checklists\.js\?v=[^" ]+','/checklists.js?v=profile-20261122',h)
    html.write_text(h)
print('Updated public/checklists.js, public/index.html, public/caravan-profile-update.css')

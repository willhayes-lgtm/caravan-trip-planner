const fields=['name', 'location', 'url', 'notes', 'status'];
const table='wishlist';
function normalize(t){
 if(!t||typeof t!=='object')throw Error('Invalid item');
 const v={name:String(t.name||'').trim().slice(0,160),location:String(t.location||'').slice(0,200),url:String(t.url||'').slice(0,2000),notes:String(t.notes||'').slice(0,2000),status:String(t.status||'Interested')};
 if(!v.name)throw Error('Name required');
 if(v.url){let u;try{u=new URL(v.url)}catch{throw Error('Invalid URL')}if(!['https:','http:'].includes(u.protocol))throw Error('Invalid URL')}
 if(!['Interested','Shortlisted','Ready to book'].includes(v.status))throw Error('Invalid status');
 return v;
}
export async function onRequestGet({env}){try{const r=await env.DB.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC,name`).all();return Response.json(r.results)}catch(e){return Response.json({error:'Database tables not ready; run migration-five-features.sql'},{status:503})}}
export async function onRequestPost({request,env}){try{const v=normalize(await request.json()),id=crypto.randomUUID();await env.DB.prepare(`INSERT INTO ${table} (id,${fields.join(',')}) VALUES (${Array(fields.length+1).fill('?').join(',')})`).bind(id,...fields.map(k=>v[k])).run();return Response.json({id,...v},{status:201})}catch(e){return Response.json({error:e.message},{status:400})}}
export async function onRequestPut({request,env}){try{const t=await request.json();if(typeof t.id!=='string')throw Error('Missing ID');const v=normalize(t);const r=await env.DB.prepare(`UPDATE ${table} SET ${fields.map(k=>k+'=?').join(',')} WHERE id=?`).bind(...fields.map(k=>v[k]),t.id).run();if(!r.meta.changes)return Response.json({error:'Not found'},{status:404});return Response.json({id:t.id,...v})}catch(e){return Response.json({error:e.message},{status:400})}}
export async function onRequestDelete({request,env}){try{const {id}=await request.json();if(typeof id!=='string')throw Error('Missing ID');await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();return Response.json({ok:true})}catch(e){return Response.json({error:e.message},{status:400})}}

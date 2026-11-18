const fields=['title','location','start_date','end_date','cost','paid','diesel','leave_days','status','notes','booking_ref','due_date','image_url','mileage','activities','stops','awning','rating'];
const numeric=['cost','paid','diesel','leave_days','rating'];
const allowedStatuses=['planned','booked','completed','cancelled'];
function validate(t){
 if(!t||typeof t!=='object')throw Error('Invalid trip');
 if(!String(t.title||'').trim())throw Error('Title required');
 for(const d of ['start_date','end_date'])if(!/^\d{4}-\d{2}-\d{2}$/.test(t[d]||''))throw Error('Invalid '+d);
 if(t.end_date<t.start_date)throw Error('End date before start date');
 for(const n of [...numeric,'mileage'])if(t[n]!==''&&t[n]!=null&&(!Number.isFinite(Number(t[n]))||Number(t[n])<0))throw Error('Invalid '+n);
 if(t.status&&!allowedStatuses.includes(t.status))throw Error('Invalid status');
 if(t.rating!==undefined&&t.rating!==null&&t.rating!==''&&(!Number.isInteger(Number(t.rating))||Number(t.rating)>10))throw Error('Rating must be a whole number from 0 to 10');
 if(String(t.image_url||'').length>2000)throw Error('Image URL too long');
 if(t.image_url){let u;try{u=new URL(t.image_url)}catch{throw Error('Invalid image URL')}if(!['http:','https:'].includes(u.protocol))throw Error('Image must use HTTP or HTTPS')}
 if(String(t.activities||'').length>4000)throw Error('Activities too long');
 if(!['Not decided','Full Awning','Canopy','No Awning'].includes(t.awning||'Not decided'))throw Error('Invalid awning');
 let stops=t.stops||'[]';if(Array.isArray(stops))stops=JSON.stringify(stops);
 if(typeof stops!=='string'||stops.length>16000)throw Error('Invalid itinerary');
 let parsed;try{parsed=JSON.parse(stops)}catch{throw Error('Invalid itinerary JSON')}
 if(!Array.isArray(parsed)||parsed.length>30)throw Error('Invalid itinerary');
 for(const s of parsed){if(!s||typeof s!=='object'||!String(s.name||'').trim()||String(s.name).length>160)throw Error('Invalid stop name');
  if(s.arrival&&!/^\d{4}-\d{2}-\d{2}$/.test(s.arrival))throw Error('Invalid stop arrival');
  if(s.departure&&!/^\d{4}-\d{2}-\d{2}$/.test(s.departure))throw Error('Invalid stop departure');
  if(s.arrival&&s.departure&&s.departure<s.arrival)throw Error('Stop departure before arrival');
  for(const k of ['reference','notes'])if(String(s[k]||'').length>1000)throw Error('Stop text too long');
 }

}
function normal(t){
 const o={};
 for(const k of fields)o[k]=numeric.includes(k)?Number(t[k]||0):k==='mileage'?(t[k]===''||t[k]==null?null:Number(t[k])):String(t[k]||'');
 o.status=o.status||'planned';o.awning=o.awning||'Not decided';o.stops=Array.isArray(t.stops)?JSON.stringify(t.stops):String(t.stops||'[]');
 return o;
}
export async function onRequestGet({env}){
 try{const r=await env.DB.prepare('SELECT * FROM trips ORDER BY start_date, title').all();return Response.json(r.results)}
 catch(e){return Response.json({error:'Database error. If upgrading, run migration.sql against production D1.'},{status:503})}
}
export async function onRequestPost({request,env}){
 try{const t=await request.json();validate(t);const v=normal(t),id=crypto.randomUUID();
 await env.DB.prepare(`INSERT INTO trips (id,${fields.join(',')}) VALUES (${Array(fields.length+1).fill('?').join(',')})`).bind(id,...fields.map(f=>v[f])).run();
 return Response.json({id,...v},{status:201})}catch(e){return Response.json({error:e.message},{status:400})}
}
export async function onRequestPut({request,env}){
 try{const t=await request.json();if(typeof t.id!=='string')throw Error('Missing ID');validate(t);const v=normal(t);
 const r=await env.DB.prepare(`UPDATE trips SET ${fields.map(f=>f+'=?').join(',')},updated_at=datetime('now') WHERE id=?`).bind(...fields.map(f=>v[f]),t.id).run();
 if(!r.meta.changes)return Response.json({error:'Not found'},{status:404});
 return Response.json({id:t.id,...v})}catch(e){return Response.json({error:e.message},{status:400})}
}
export async function onRequestDelete({request,env}){
 const {id}=await request.json().catch(()=>({}));
 if(typeof id!=='string')return Response.json({error:'Missing ID'},{status:400});
 await env.DB.prepare('DELETE FROM trips WHERE id=?').bind(id).run();
 return Response.json({ok:true})
}

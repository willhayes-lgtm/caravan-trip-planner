const fields=['journey_date','trip_id','origin','destination','miles','notes'];
function normal(t){
 if(!t||typeof t!=='object')throw Error('Invalid journey');
 const journey_date=String(t.journey_date||''),trip_id=String(t.trip_id||''),origin=String(t.origin||'').trim(),destination=String(t.destination||'').trim(),miles=Number(t.miles),notes=String(t.notes||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(journey_date)||!Number.isFinite(Date.parse(journey_date+'T12:00:00Z')))throw Error('Enter a valid date');
 if(!origin||!destination||origin.length>200||destination.length>200)throw Error('Enter origin and destination');
 if(!Number.isFinite(miles)||miles<=0||miles>100000)throw Error('Enter valid towing miles');
 if(notes.length>1000)throw Error('Notes too long');
 if(trip_id.length>100)throw Error('Invalid trip');
 return {journey_date,trip_id,origin,destination,miles,notes};
}
function fail(e){return Response.json({error:e.message||'Request failed'},{status:400})}
export async function onRequestGet({env}){try{const r=await env.DB.prepare('SELECT * FROM towing_journeys ORDER BY journey_date DESC, created_at DESC').all();return Response.json(r.results)}catch(e){return Response.json({error:'Towing table unavailable. Run the new D1 migration.'},{status:503})}}
export async function onRequestPost({request,env}){try{const v=normal(await request.json()),id=crypto.randomUUID();await env.DB.prepare(`INSERT INTO towing_journeys (id,${fields.join(',')}) VALUES (${Array(fields.length+1).fill('?').join(',')})`).bind(id,...fields.map(k=>v[k])).run();return Response.json({id,...v},{status:201})}catch(e){return fail(e)}}
export async function onRequestPut({request,env}){try{const t=await request.json();if(typeof t.id!=='string'||!t.id)throw Error('Missing ID');const v=normal(t);const r=await env.DB.prepare(`UPDATE towing_journeys SET ${fields.map(k=>k+'=?').join(',')} WHERE id=?`).bind(...fields.map(k=>v[k]),t.id).run();if(!r.meta.changes)return Response.json({error:'Journey not found'},{status:404});return Response.json({id:t.id,...v})}catch(e){return fail(e)}}
export async function onRequestDelete({request,env}){try{const {id}=await request.json();if(typeof id!=='string'||!id)throw Error('Missing ID');await env.DB.prepare('DELETE FROM towing_journeys WHERE id=?').bind(id).run();return Response.json({ok:true})}catch(e){return fail(e)}}

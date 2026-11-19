export async function onRequestGet({env}) {
 try { const row=await env.DB.prepare('SELECT make,model,model_year FROM caravan_profile WHERE id=1').first();return Response.json(row||{make:'',model:'',model_year:null}); }
 catch {return Response.json({error:'Caravan profile unavailable. Run the D1 migration.'},{status:503})}
}
export async function onRequestPut({request,env}) {
 try {const v=await request.json(),make=String(v.make||'').trim(),model=String(v.model||'').trim(),year=Number(v.model_year);
 if(!make||!model||make.length>100||model.length>150||!Number.isInteger(year)||year<1900||year>2100)throw Error('Enter a valid make, model and year.');
 await env.DB.prepare('INSERT INTO caravan_profile(id,make,model,model_year,updated_at) VALUES(1,?,?,?,datetime(\'now\')) ON CONFLICT(id) DO UPDATE SET make=excluded.make,model=excluded.model,model_year=excluded.model_year,updated_at=datetime(\'now\')').bind(make,model,year).run();return Response.json({make,model,model_year:year});
 }catch(e){return Response.json({error:e.message},{status:400})}
}

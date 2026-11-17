import {makeCookie} from '../_middleware.js';
const enc=new TextEncoder();
async function digest(s){return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));}
export async function onRequestPost({request,env}){
 const data=await request.json().catch(()=>({}));
 const a=await digest(String(data.password||'')),b=await digest(env.ADMIN_PASSWORD);
 const match=a.length===b.length && a.reduce((v,c,i)=>v|(c^b[i]),0)===0;
 if(!match) return Response.json({error:'Incorrect password'},{status:401});
 return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Set-Cookie':await makeCookie(env.SESSION_SECRET)}});
}

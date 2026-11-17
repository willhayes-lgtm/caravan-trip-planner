const encoder = new TextEncoder();
function b64(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
async function signature(secret, value) {
 const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value))));
}
function cookies(request) { return Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2)); }
export async function onRequest(context) {
 const {request,env,next} = context;
 const url = new URL(request.url);
 if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.DB) return new Response('Site not configured. Set ADMIN_PASSWORD, SESSION_SECRET and DB binding in Cloudflare Pages.',{status:503});
 if (url.pathname === '/login' || url.pathname === '/login.html' || url.pathname === '/api/login') return next();
 const token = cookies(request).caravan_session;
 let ok=false;
 if(token){const [expiry,sig]=token.split('.');if(expiry && sig && /^\d+$/.test(expiry) && Number(expiry)>Date.now()){const expected=await signature(env.SESSION_SECRET,expiry);ok=expected.length===sig.length && expected.split('').every((c,i)=>c===sig[i]);}}
 if(!ok){if(url.pathname.startsWith('/api/')) return Response.json({error:'Unauthorized'},{status:401});return Response.redirect(new URL('/login.html',request.url),302);}
 return next();
}
export async function makeCookie(secret) {
 const expiry=String(Date.now()+7*24*60*60*1000);
 return `caravan_session=${expiry}.${await signature(secret,expiry)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

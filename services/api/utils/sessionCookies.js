const jwt=require('jsonwebtoken');

const COOKIE_NAMES={platform:'opsynq_platform_session',agency:'opsynq_agency_session'};

function parseCookies(header=''){
  const out={};
  for(const part of String(header||'').split(';')){
    const i=part.indexOf('=');if(i<1)continue;
    const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();
    if(k)out[k]=decodeURIComponent(v);
  }
  return out;
}
function bearer(req){
  const h=String(req.headers?.authorization||'');
  if(!h.startsWith('Bearer '))return'';
  const token=h.slice(7).trim();
  return token&&token!=='null'&&token!=='undefined'?token:'';
}
function readSessionToken(req,realm){return bearer(req)||parseCookies(req.headers?.cookie||'')[COOKIE_NAMES[realm]]||''}
function isProduction(){return process.env.NODE_ENV==='production'}
function cookieBase(maxAgeMs){return{httpOnly:true,secure:isProduction(),sameSite:'lax',path:'/',maxAge:maxAgeMs}}
function serializeCookie(name,value,opts={}){
  const parts=[`${name}=${encodeURIComponent(value)}`,`Path=${opts.path||'/'}`];
  if(opts.httpOnly)parts.push('HttpOnly');if(opts.secure)parts.push('Secure');
  if(opts.sameSite)parts.push(`SameSite=${String(opts.sameSite)[0].toUpperCase()}${String(opts.sameSite).slice(1)}`);
  if(Number.isFinite(opts.maxAge))parts.push(`Max-Age=${Math.max(0,Math.floor(opts.maxAge/1000))}`);
  return parts.join('; ');
}
function setSessionCookie(res,realm,token){
  const maxAgeMs=realm==='agency'?24*60*60*1000:12*60*60*1000;
  res.append('Set-Cookie',serializeCookie(COOKIE_NAMES[realm],token,cookieBase(maxAgeMs)));
}
function clearSessionCookie(res,realm){res.append('Set-Cookie',serializeCookie(COOKIE_NAMES[realm],'',{...cookieBase(0),maxAge:0}))}
function decodeAndVerify(token){return jwt.verify(token,process.env.JWT_SECRET)}
function isDemoAccount(user){return String(user?.email||'').toLowerCase().endsWith('@opsynq.demo')}
function demoBearerEnabled(user){return isDemoAccount(user)&&(process.env.DEMO_BEARER_COMPAT!=='0')}
function unscopedDemoAllowed(user){return isDemoAccount(user)&&(process.env.NODE_ENV!=='production'||process.env.ALLOW_UNSCOPED_DEMO==='1')}
module.exports={COOKIE_NAMES,parseCookies,bearer,readSessionToken,setSessionCookie,clearSessionCookie,decodeAndVerify,isDemoAccount,demoBearerEnabled,unscopedDemoAllowed};

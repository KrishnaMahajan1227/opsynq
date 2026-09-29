const crypto = require('crypto');

const buckets = new Map();

function clientKey(req, namespace, includeIdentifier = false) {
  const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
  const identifier = includeIdentifier
    ? String(req.body?.identifier || req.body?.email || req.body?.mobile || '').trim().toLowerCase()
    : '';
  const digest = identifier ? crypto.createHash('sha256').update(identifier).digest('hex').slice(0, 20) : '';
  return `${namespace}:${ip}:${digest}`;
}

function rateLimiter({ namespace, windowMs, max, includeIdentifier = false, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = clientKey(req, namespace, includeIdentifier);
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= windowMs) bucket = { start: now, count: 0 };
    bucket.count += 1;
    buckets.set(key, bucket);
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil((bucket.start + windowMs) / 1000)));
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.start + windowMs - now) / 1000)));
      return res.status(429).json({ message });
    }
    next();
  };
}

exports.requestContext = (req, res, next) => {
  const incoming=String(req.headers['x-request-id']||'');
  req.requestId=/^[A-Za-z0-9._:-]{1,100}$/.test(incoming)?incoming:crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-DNS-Prefetch-Control','off');
  res.setHeader('X-Download-Options','noopen');
  res.setHeader('Origin-Agent-Cluster','?1');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws: http://localhost:*");
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};


function containsUnsafeKey(value, depth = 0) {
  if (depth > 20 || value == null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => containsUnsafeKey(item, depth + 1));
  return Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || ['__proto__','prototype','constructor'].includes(key) || containsUnsafeKey(child, depth + 1));
}

exports.rejectUnsafeKeys = (req, res, next) => {
  if (containsUnsafeKey(req.body) || containsUnsafeKey(req.query) || containsUnsafeKey(req.params)) {
    return res.status(400).json({ message: 'Request contains unsupported field names.' });
  }
  next();
};
exports.authRateLimit = rateLimiter({
  namespace: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 12,
  includeIdentifier: true,
  message: 'Too many authentication attempts. Please try again later.',
});

exports.recoveryRateLimit = rateLimiter({
  namespace: 'recovery',
  windowMs: 60 * 60 * 1000,
  max: 6,
  includeIdentifier: true,
  message: 'Too many password recovery requests. Please try again later.',
});

exports.sensitiveWriteRateLimit = rateLimiter({
  namespace: 'sensitive-write',
  windowMs: 5 * 60 * 1000,
  max: 60,
  includeIdentifier: false,
  message: 'Too many requests. Please try again shortly.',
});

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > 2 * 60 * 60 * 1000) buckets.delete(key);
  }
}, 30 * 60 * 1000).unref();

exports.aiRateLimit = rateLimiter({
  namespace: 'ai',
  windowMs: 60 * 1000,
  max: 12,
  includeIdentifier: false,
  message: 'AI request limit reached. Please wait a minute and try again.',
});

exports.realtimeRevisionTracker=(req,res,next)=>{
  if(!['POST','PUT','PATCH','DELETE'].includes(String(req.method||'').toUpperCase()))return next();
  res.on('finish',()=>{
    if(res.statusCode<200||res.statusCode>=400)return;
    setImmediate(async()=>{
      try{
        const RealtimeRevision=require('../models/RealtimeRevision');
        const keys=new Set();
        const companyId=req.tenant?.companyId||((req.platformUser?.role==='platform_superadmin')?(req.query?.companyId||req.body?.companyId):null);
        if(companyId)keys.add(`company:${String(companyId)}`);
        for(const id of req.agencyScope?.companyIds||[])keys.add(`company:${String(id)}`);
        for(const id of req.agencyScope?.agencyIds||[])keys.add(`agency:${String(id)}`);
        await Promise.all([...keys].map(scopeKey=>RealtimeRevision.findOneAndUpdate({scopeKey},{$inc:{revision:1},$set:{updatedAt:new Date()}},{upsert:true,new:true,setDefaultsOnInsert:true})));
      }catch(error){console.error('Realtime revision update failed:',error.message);}
    });
  });
  next();
};

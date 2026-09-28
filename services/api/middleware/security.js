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
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};


function containsUnsafeKey(value, depth = 0) {
  if (depth > 20 || value == null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => containsUnsafeKey(item, depth + 1));
  return Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || containsUnsafeKey(child, depth + 1));
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

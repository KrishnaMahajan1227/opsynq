function assertSecurityConfig() {
  const secret = String(process.env.JWT_SECRET || '');
  if (secret.length < 48) {
    const message = 'JWT_SECRET must be at least 48 characters and randomly generated.';
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    console.warn(`[SECURITY] ${message}`);
  }
  if (process.env.NODE_ENV === 'production') {
    const explicitOrigins = String(process.env.CLIENT_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
    const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    const effectiveOrigins = [...explicitOrigins, ...(vercelHost ? [`https://${String(vercelHost).replace(/^https?:\/\//,'')}`] : [])];
    if (!effectiveOrigins.length) throw new Error('CLIENT_ORIGIN or a Vercel deployment URL is required in production.');
    if (explicitOrigins.some((origin) => !origin.startsWith('https://') && !origin.startsWith('http://localhost'))) {
      throw new Error('Every non-local production CLIENT_ORIGIN must use HTTPS.');
    }
    const provider = String(process.env.EMAIL_PROVIDER || '').toLowerCase();
    if (provider !== 'resend' || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.warn('[SECURITY] Email password recovery is disabled until EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM are configured.');
    }
  }
}

module.exports = { assertSecurityConfig };

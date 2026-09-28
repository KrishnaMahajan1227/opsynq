function assertSecurityConfig() {
  const secret = String(process.env.JWT_SECRET || '');
  if (secret.length < 48) {
    const message = 'JWT_SECRET must be at least 48 characters and randomly generated.';
    if (process.env.NODE_ENV === 'production') throw new Error(message);
    console.warn(`[SECURITY] ${message}`);
  }
  if (process.env.NODE_ENV === 'production') {
    const origins = String(process.env.CLIENT_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (!origins.length) throw new Error('CLIENT_ORIGIN is required in production.');
    if (origins.some((origin) => !origin.startsWith('https://'))) {
      throw new Error('Every production CLIENT_ORIGIN must use HTTPS.');
    }
    if (!process.env.PUBLIC_APP_URL || !String(process.env.PUBLIC_APP_URL).startsWith('https://')) {
      throw new Error('PUBLIC_APP_URL must be an HTTPS URL in production.');
    }
    if (String(process.env.EMAIL_PROVIDER || '').toLowerCase() !== 'resend' || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error('Production password recovery requires EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM.');
    }
  }
}

module.exports = { assertSecurityConfig };

const APP_NAME = 'Opsynq';

const clean = (v) => String(v || '').trim();

function publicBaseUrl() {
  if (clean(process.env.PUBLIC_APP_URL)) return clean(process.env.PUBLIC_APP_URL).replace(/\/$/, '');
  const vercelHost = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL);
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//,'').replace(/\/$/,'')}`;
  const firstOrigin = clean(process.env.CLIENT_ORIGIN).split(',').map((x) => x.trim()).find(Boolean);
  return (firstOrigin || 'http://localhost:5173').replace(/\/$/, '');
}

async function sendViaResend({ to, subject, html, text }) {
  const key = clean(process.env.RESEND_API_KEY);
  if (!key) throw new Error('RESEND_API_KEY is not configured.');
  const from = clean(process.env.EMAIL_FROM);
  if (!from) throw new Error('EMAIL_FROM is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Email provider rejected the request (${response.status}): ${body.slice(0, 300)}`);
  }
  return response.json().catch(() => ({}));
}

async function sendEmail(message) {
  const provider = clean(process.env.EMAIL_PROVIDER || 'console').toLowerCase();
  if (provider === 'resend') return sendViaResend(message);
  if (provider === 'console' && process.env.NODE_ENV !== 'production') {
    console.log(`[DEV EMAIL] To: ${message.to} | Subject: ${message.subject}\n${message.text || ''}`);
    return { id: 'console-development-email' };
  }
  throw new Error('Production email provider is not configured. Set EMAIL_PROVIDER=resend, RESEND_API_KEY and EMAIL_FROM.');
}

function passwordResetMessage({ to, name, token }) {
  const resetUrl = `${publicBaseUrl()}/?resetToken=${encodeURIComponent(token)}`;
  const display = clean(name) || 'there';
  const subject = `${APP_NAME} password reset`;
  const text = `Hello ${display},\n\nA password reset was requested for your ${APP_NAME} account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 20 minutes and can be used only once. If you did not request this reset, you can ignore this email.\n\nFor security, never forward this link.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,sans-serif;color:#17211c"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:36px 16px"><table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#fff;border:1px solid #dfe5e1;border-radius:14px"><tr><td style="padding:34px"><div style="font-size:13px;font-weight:800;letter-spacing:.12em;color:#547064">OPSYNQ SECURITY</div><h1 style="font-size:24px;margin:14px 0 10px">Reset your password</h1><p style="font-size:15px;line-height:1.65;color:#59655f">Hello ${escapeHtml(display)}, a password reset was requested for your Opsynq account.</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#193f31;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:9px">Reset password</a></p><p style="font-size:13px;line-height:1.6;color:#68736d">This secure link expires in <strong>20 minutes</strong> and can be used only once. If you did not request this, ignore this email. Never forward the reset link.</p><hr style="border:0;border-top:1px solid #e5e9e7;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#7b8580">If the button does not work, copy this address into your browser:<br><span style="word-break:break-all">${resetUrl}</span></p></td></tr></table></td></tr></table></body></html>`;
  return { to, subject, text, html, resetUrl };
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

module.exports = { sendEmail, passwordResetMessage, publicBaseUrl };

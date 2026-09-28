const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const has = (p, needle, label) => assert(read(p).includes(needle), `${label} missing in ${p}`);

has('services/api/routes/unifiedAuthRoutes.js', "'/forgot-password'", 'forgot password route');
has('services/api/routes/unifiedAuthRoutes.js', "'/reset-password'", 'reset password route');
has('services/api/models/PasswordResetToken.js', 'tokenHash', 'hashed reset token');
has('services/api/models/PasswordResetToken.js', "expiresAt", 'reset expiry');
has('services/api/controllers/unifiedAuthController.js', 'crypto.randomBytes(32)', 'cryptographic reset token generation');
has('services/api/controllers/unifiedAuthController.js', 'PASSWORD_RESET_COMPLETED', 'security audit event');
has('services/api/controllers/unifiedAuthController.js', 'tokenVersion = Number(user.tokenVersion || 0) + 1', 'session invalidation on reset');
has('services/api/middleware/authMiddleware.js', 'decoded.tv', 'agency token-version enforcement');
has('services/api/middleware/platform/platformAuth.js', 'decoded.tv', 'platform token-version enforcement');
has('services/api/server.js', 'Session has been invalidated', 'socket token-version enforcement');
has('services/api/utils/passwordSecurity.js', 'password.length < 12', '12 character password policy');
has('services/api/utils/emailService.js', 'https://api.resend.com/emails', 'email provider integration');
has('services/api/middleware/security.js', 'Strict-Transport-Security', 'HSTS header');
has('services/api/middleware/security.js', 'rejectUnsafeKeys', 'NoSQL operator-key rejection');
has('apps/platform-web/src/features/public/PublicPages.jsx', 'ForgotPassword', 'forgot password UI');
has('apps/platform-web/src/features/public/PublicPages.jsx', 'ResetPassword', 'reset password UI');
has('apps/platform-web/src/App.jsx', 'resetToken', 'reset token app routing');
has('apps/agency-web/src/pages/DashboardSuperAdmin.jsx', 'used for secure password recovery', 'agency recovery-email administration');
has('services/api/.env.example', 'EMAIL_PROVIDER=console', 'email environment template');
has('services/api/.env.example', 'RESEND_API_KEY=', 'production email provider key');

const resetModel = read('services/api/models/PasswordResetToken.js');
assert(!/\btoken\s*:\s*\{/.test(resetModel), 'Reset model must never store plaintext token field');
const emailService = read('services/api/utils/emailService.js').toLowerCase();
assert(!emailService.includes('whatsapp') && !emailService.includes('twilio'), 'Phase 34 must remain email-only');

console.log('✓ Phase 34 security + email recovery contracts passed');

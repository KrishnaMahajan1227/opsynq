const COMMON = new Set([
  'password','password123','12345678','123456789','qwerty123','admin123','welcome123',
  'letmein123','changeme123','opsynq123','company123','technician123','administrator'
]);

function validatePassword(value) {
  const password = String(value || '');
  if (password.length < 12) return { ok: false, message: 'Password must be at least 12 characters.' };
  if (password.length > 128) return { ok: false, message: 'Password must be 128 characters or fewer.' };
  if (COMMON.has(password.toLowerCase())) return { ok: false, message: 'Choose a less common password.' };
  if (/^\s|\s$/.test(password)) return { ok: false, message: 'Password cannot start or end with a space.' };
  const classes = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9\s]/.test(password)].filter(Boolean).length;
  if (password.length < 16 && classes < 3) {
    return { ok: false, message: 'Use at least 3 of: uppercase, lowercase, number, and symbol, or use a 16+ character passphrase.' };
  }
  return { ok: true };
}

function passwordHelp() {
  return 'Use 12+ characters. A 16+ character passphrase is recommended. Avoid reused or common passwords.';
}

module.exports = { validatePassword, passwordHelp };

# Opsynq Security + Email Recovery Hardening

## Scope
This pass deliberately implements **email recovery only**. No WhatsApp or SMS dependency is introduced.

## What is now implemented

### Unified password recovery
- One recovery entry point for Platform, Company and Agency identities.
- Recovery requests always return the same public message to prevent account enumeration.
- Reset tokens are generated with `crypto.randomBytes(32)`.
- Only a SHA-256 token hash is stored in MongoDB; the raw token exists only in the outbound reset link.
- Reset links expire after 20 minutes and are single-use.
- A successful reset invalidates every previous JWT session by incrementing `tokenVersion`.
- Outstanding Agency handoff codes are invalidated after reset.
- Reset links are removed from the browser address bar after the UI captures them.

### Login hardening
- Authentication endpoint rate limit: 12 attempts / 15 minutes per IP + normalized identifier bucket.
- Persistent account lockout after repeated invalid passwords: 5 failures -> 15 minute lock.
- Lock state clears on successful login or secure password reset.
- Login/recovery security events are written without storing plaintext identifiers.

### Password policy
For new, changed, and reset passwords:
- Minimum 12 characters, maximum 128.
- 16+ character passphrases are accepted without arbitrary symbol rules.
- Shorter passwords must use at least 3 character classes.
- A small deny-list rejects obvious/common passwords.
- Existing passwords are not force-migrated, avoiding disruption to running operations.

### Session security
- Platform and Agency JWTs now contain a token-version claim.
- HTTP middleware checks token version against the live user record.
- Socket.IO authentication performs the same token-version check.
- Default Agency JWT lifetime reduced to 24 hours and is configurable through `AGENCY_JWT_EXPIRES_IN`.

### API hardening
- Added/refined security headers: HSTS in production, no-referrer, no-sniff, frame deny, opener/resource policies, permissions policy.
- API responses default to `Cache-Control: no-store`.
- Request keys beginning with `$` or containing `.` are rejected to reduce NoSQL operator-injection risk.
- Optional reverse-proxy trust is explicit via `TRUST_PROXY=1` instead of implicit.
- Production startup refuses weak JWT configuration, non-HTTPS client origins, non-HTTPS public app URL, or missing production email settings.

### Recovery email administration
- New Agency users require an email address.
- Agency Superadmin user management can add/edit the recovery email.
- New Platform/Company team accounts require email.
- New identities are prevented from reusing an email/mobile already assigned in the other authentication realm, avoiding ambiguous unified-login or recovery routing.
- Existing accounts without email continue to work but cannot self-recover until an administrator adds an email address.

## Email delivery
The implementation uses the Resend HTTP API so no new SMTP library is required.

Local development:
```env
EMAIL_PROVIDER=console
PUBLIC_APP_URL=http://localhost:5173
```
The reset email is printed to the API console.

Production:
```env
EMAIL_PROVIDER=resend
EMAIL_FROM=Opsynq Security <security@your-domain.com>
RESEND_API_KEY=<provider key>
PUBLIC_APP_URL=https://app.your-domain.com
CLIENT_ORIGIN=https://app.your-domain.com,https://agency.your-domain.com
NODE_ENV=production
```
Production startup intentionally fails if email recovery is not configured.

## Deployment security actions still required outside the codebase
1. Rotate the MongoDB credential because it has previously been distributed in project environment files/conversation history.
2. Rotate Cloudinary API secret for the same reason.
3. Use a fresh production JWT secret. The project validates minimum strength but cannot rotate a deployed secret in an external environment by itself.
4. Use HTTPS only in production and configure `TRUST_PROXY=1` only behind a trusted reverse proxy that overwrites forwarding headers.
5. Configure and verify the sending domain in the email provider.
6. For multi-instance API deployment, replace the in-memory request-rate buckets with a shared Redis-backed limiter.

## QA
Run:
```bash
npm run qa:phase34
npm run qa:source
npm run qa:routes
```

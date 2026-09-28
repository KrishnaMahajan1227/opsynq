# OPSYNQ Phase 34 — Security + Email Recovery

## Delivered
- Unified email-based Forgot Password for Platform, Company and Agency users.
- One-time SHA-256-hashed reset tokens, 20-minute expiry, atomic token consumption.
- Generic recovery response to reduce account enumeration.
- Reset-token URL scrubbed from browser address/history after capture.
- Password reset invalidates all existing JWT and Socket.IO sessions via `tokenVersion`.
- Agency handoff codes invalidated after password reset.
- Persistent failed-login account lock after repeated failures.
- Tighter authentication and recovery rate limits.
- Security-event audit collection with hashed identifiers.
- 12+ character password policy for new/change/reset flows.
- Recovery email required for newly created Platform/Company/Agency users.
- Cross-realm email/mobile collision prevention for unified identity safety.
- NoSQL operator-key rejection on incoming requests.
- Stronger security headers and production HTTPS/HSTS checks.
- Production startup validation for JWT, origins and email provider configuration.
- Legacy unused Agency login screen removed; one public login remains.
- Duplicate JSX permission source removed.
- Real `.env` files removed from the release archive.
- WhatsApp/SMS intentionally excluded.

## Email delivery
Local:
- `EMAIL_PROVIDER=console`
- reset link is printed in the API terminal.

Production:
- `EMAIL_PROVIDER=resend`
- configure `EMAIL_FROM`, `RESEND_API_KEY`, `PUBLIC_APP_URL`, HTTPS `CLIENT_ORIGIN`.

## Existing users
Existing accounts remain valid. Accounts without an email can continue working, but self-service password recovery becomes available only after an administrator adds a unique recovery email.

## External security actions required before production
These cannot be completed by source-code changes alone:
1. Rotate MongoDB credentials previously included in older source bundles.
2. Rotate Cloudinary API secret previously included in older source bundles.
3. Restrict/rotate Google API keys as appropriate in Google Cloud Console.
4. Set a fresh production JWT secret.
5. Verify your email sending domain and configure the production email provider key.
6. Use TLS/HTTPS and a trusted reverse proxy configuration.

## Recommended next security phase
- HttpOnly/Secure/SameSite cookie session migration (reduces browser token exposure vs localStorage).
- MFA for Platform Superadmin / Company Owner / Company Admin.
- Redis-backed distributed rate limiting for multi-instance deployments.
- Admin security center: session/device list, revoke sessions, security-event viewer.
- Automated dependency/SAST/secrets scanning in CI.

## QA passed
- `npm run qa:source`
- `npm run qa:routes`
- `npm run qa:phase34`

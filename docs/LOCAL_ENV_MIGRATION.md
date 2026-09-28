# Local Environment Migration After Security Hardening

The hardened source package intentionally does **not** include real `.env` files.

On your private development machine:

1. Keep the `.env` files from your previous working Opsynq copy private.
2. Copy them into the same locations:
   - `services/api/.env`
   - `apps/platform-web/.env`
   - `apps/agency-web/.env`
3. Compare against each folder's `.env.example` and add the new Phase 34 variables.
4. For local password recovery use `EMAIL_PROVIDER=console`; reset links appear only in the API terminal.
5. For production use a verified email sender/provider as described in `SECURITY_EMAIL_RECOVERY_2026-09-27.md`.

## Important credential rotation
Because previous source bundles contained live credentials, rotate the external credentials before production deployment:
- MongoDB database password/connection credential.
- Cloudinary API secret.
- Google Maps/API key restrictions or key if appropriate.
- JWT secret (use a new 48+ character random value).

Do not place real `.env` files back into a source archive, Git commit, email attachment, or shared drive.

# Final demo package - available images included

This package is intended to be merged/copied into the existing project root. Keep your already-working private `.env` files unchanged; this ZIP intentionally excludes real `.env` files.

## Included demo image set
- OPS-DM-001: 2 images
- OPS-DM-003: 7 images
- OPS-DM-014: 10 images
- Total: 19 unique photorealistic AI-generated JPGs

Other seeded beneficiaries deliberately use the application's empty-media state.

## Safe run order (PowerShell)
```powershell
npm ci
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:db-check
npm run demo:seed-ready
npm run backend
# second terminal
npm run frontend
```

`demo:seed-ready` performs read-only DB preflight, uploads the packaged images to Cloudinary, seeds the existing demo tenants/accounts, and runs post-seed sanity checks.

Do not run destructive `demo:reset` unless you intentionally want the guarded backup/wipe flow and have set its explicit destructive confirmation variable.

## Verification limitation
Live MongoDB, Cloudinary upload, and remote URL reachability cannot be executed from this packaging runtime. Those checks are performed by the commands above in your environment.

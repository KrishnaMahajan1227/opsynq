# Demo media duplicate-governance fix

The Haryana walkthrough intentionally reuses the approved AI-generated demo media. The uploader's duplicate-byte guard remains enabled globally; only explicitly listed logical evidence slots in `demoMediaSpec.js` may reuse bytes.

## Recovery after the 2026-10-03 failed reset
The database wipe already completed and the reset stopped during media upload, before demo seeding. After merging this build, do not wipe again. Run:

```powershell
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:media:upload
npm run demo:seed
npm run demo:rms-prime
npm run demo:sanity
```

Then run the apps normally.

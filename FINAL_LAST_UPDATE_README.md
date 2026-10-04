# OPSYNQ Final Dashboard + RMS Demo Update

## Final changes
- Company dashboard Agency Performance is now a ranked Top 5 view.
- Ranking score is transparent: 65% installation completion, 25% survey coverage, 10% issue-free execution.
- Every ranked row shows agency, state/district coverage, beneficiary count, completion %, survey %, issues and score.
- Score is shown with a restrained radial indicator; clicking a row opens Agency Performance.
- State Execution remains separate and unchanged in priority.
- RMS overview remains tenant/agency/technician scoped.
- For the demo simulator only, if current-state output metrics are unexpectedly empty while persisted telemetry exists, the overview safely derives output from the latest persisted telemetry per device. Real providers are not fabricated or overridden.
- Demo RMS prime now fails if active demo devices exist but all operating output is zero.

## Existing healthy demo DB
If the 29-beneficiary demo is already healthy, no destructive reset is required just for the UI ranking code. To refresh RMS demo output:

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:rms-prime
npm run demo:sanity
npm run qa:final-dashboard
npm run qa:source
```

Then run:

```powershell
npm run backend
```

Second terminal:

```powershell
cd D:\Opsynq
npm run frontend
```

## Clean demo rebuild
Use only on the confirmed demo/dev database:

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
npm run qa:final-dashboard
npm run qa:source
```

## Git
After browser verification:

```bash
git status
git add .
git commit -m "feat: finalize ranked agency dashboard and RMS demo visibility"
git push
```

## Safety
- Existing real `.env` files are not included.
- No new runtime dependency was added.
- Ranking is calculated from tenant-scoped beneficiary/work-package data.
- RMS fallback uses only persisted telemetry from the same role scope.

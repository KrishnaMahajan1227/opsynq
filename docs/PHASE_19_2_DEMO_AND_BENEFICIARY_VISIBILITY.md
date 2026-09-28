# Phase 19.2 — Demo & Beneficiary Visibility Closure

## Fixed

- Platform login now detects legacy Agency Operations accounts and returns clear guidance to use the Agency app.
- Agency demo login remains on `/api/auth/login` and the Agency UI includes quick-fill demo accounts.
- Agency beneficiary detail now fetches Opsynq assignment context and displays:
  - company / agency
  - program / work order / work package
  - beneficiary + scheme + location
  - survey + final verification
  - dispatch + material receipt
  - installation + commissioning
  - pump / motor / controller serials
  - installed asset register
  - technician material issues
  - complaint / service cases
  - quality / compliance records
  - survey / installation / final / LR image galleries
- Company Operations includes a first-class `Beneficiary Records` workspace with:
  - search
  - execution-status filter
  - paging
  - agency/work-package visibility
  - evidence counts
  - detailed field images
  - installed asset and service context

## Demo apps

- Platform / Company: `http://localhost:5173`
- Agency Operations: `http://localhost:5174`

## Demo verification

After seeding and starting the backend:

```bash
npm run verify:demo
```

This verifies a Company Admin login, Agency Superadmin login, demo beneficiary visibility and agency detail-context mapping.

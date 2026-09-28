# Phase 20 — Unified Secure Login + Agency Operations Redesign

## Unified sign-in

Opsynq now exposes a single user-facing sign-in experience from the Platform Web application.

- Platform Superadmin → Platform workspace
- Company users → their Company workspace
- Agency Superadmin/Admin/Technician → Agency Operations workspace

Agency credentials are no longer entered on a separate Agency login page.

### Secure agency routing

Agency sign-in does **not** pass the password or JWT in a redirect URL.

1. Unified login validates credentials on the backend.
2. Backend issues a random 60-second handoff code.
3. Only a SHA-256 hash of the handoff code is stored.
4. Agency app exchanges the code exactly once.
5. Handoff is marked used and replay is rejected.
6. Agency JWT is stored only on the Agency app origin.

This preserves session separation between the Platform and Agency applications while delivering one login experience.

## Agency Operations design system

Admin and Superadmin now share a single professional sidebar component with grouped navigation:

- Command Center
- Beneficiary Execution
- Workforce
- Agency Governance (Superadmin)
- Data Operations

Features:

- collapsible sidebar
- permanently accessible reopen control
- active-module state
- collapsible group headings
- account context
- consistent logout behavior
- shared shell on Excel Import Center
- restrained enterprise palette
- sticky workspace header
- responsive compact rail

Technician UI remains mobile-first and retains its low-tap queue workflow.

## Important environment rule

No existing `.env` file is created, rewritten or overwritten by this phase.

Optional deployment variables can be provided later if required:

- `VITE_PLATFORM_APP_URL`
- `VITE_AGENCY_APP_URL`

They are **not required for local development** because localhost URLs are derived automatically.

## Demo verification

```bash
npm run seed:full-demo
npm run backend
npm run verify:demo
```

The verification script now checks:

- unified Company login
- unified Agency login
- one-time secure handoff exchange
- handoff replay rejection
- Agency beneficiary visibility
- Agency beneficiary Opsynq assignment context

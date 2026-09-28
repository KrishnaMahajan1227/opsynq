# Phase 17 — Access Governance & Operator Views

Phase 17 closes two day-to-day production gaps: role-aware company access and repeatable operator views.

## Completed

- Central Platform capability policy shared by backend route authorization.
- Authenticated Platform/Company users receive their effective capability list.
- Company sidebar identifies modules where the current role has view-only access.
- Clean permission-denied feedback replaces confusing raw 403 failures.
- Company `Team & Access` workspace:
  - list/search company users
  - create operational users
  - update role/contact details
  - activate/deactivate accounts
  - optional password reset
  - Company Owner account protected from company-level modification
  - self-deactivation blocked
  - audit events for user creation and access changes
- Saved views for high-frequency operational screens:
  - Work Packages
  - Service / Warranty cases
  - Claims & Receivables
- Saved views are company-scoped and browser-local; no tenant data is sent to another tenant.
- Release QA now validates:
  - centralized permission policy usage
  - navigation capability references
  - frontend named imports/exports
  - React effect cleanup contracts
  - JS/JSX syntax
  - frontend/API route mount coverage
  - real `.env` exclusion

## Environment policy

Phase 17 does not ship, rewrite, regenerate, or modify real `.env` files.

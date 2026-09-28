# Opsynq Phase 10 — Platform Architecture & Navigation Consolidation

## Why this phase exists
The Platform Web application had grown into a single monolithic `App.jsx`. Phase 10 restructures it by business domain without changing the validated Agency Operations workflow or the existing backend API contracts.

## New Platform Web structure

```text
apps/platform-web/src/
├── App.jsx                         # thin application/session router
├── main.jsx
├── core/
│   ├── api.js                      # API client, token key, domain URL builders
│   └── format.js                   # number/money/object formatting helpers
├── components/
│   └── common.jsx                  # Brand, status, page header, modal
├── layout/
│   └── Shell.jsx                   # app shell + grouped/searchable navigation
├── features/
│   ├── public/PublicPages.jsx      # landing, login, company registration
│   ├── platform/PlatformPages.jsx  # platform superadmin pages
│   ├── tracking/DriverTrackingPage.jsx
│   └── company/
│       ├── CompanyWorkspace.jsx
│       ├── operations/OperationsPages.jsx
│       ├── inventory/InventoryPages.jsx
│       ├── logistics/LogisticsPages.jsx
│       ├── service/ServicePages.jsx
│       ├── governance/GovernancePages.jsx
│       ├── assurance/AssurancePages.jsx
│       └── system/AutomationPage.jsx
└── styles/index.css
```

## Navigation UX
Company navigation is grouped into:
- Execution
- Supply Chain
- Assets & Service
- Commercial
- Governance
- System

A sidebar module search is included for fast access as the product grows. Existing page IDs and functional routes are preserved.

## Compatibility
- Existing Agency Web is unchanged.
- Existing backend route contracts are unchanged.
- Existing `.env` files are not included, modified, generated or overwritten.
- Existing root run commands remain unchanged: `npm run backend` and `npm run frontend`.

## QA
- Platform JSX/JS parser validation: passed.
- Local Platform import-path resolution: passed.
- Backend JavaScript syntax validation: passed.
- No actual `.env` files packaged.

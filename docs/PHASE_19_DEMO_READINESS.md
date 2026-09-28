# Phase 19 — Full & Final Demo Readiness

Phase 19 converts Opsynq from an internal build baseline into a **show-ready demo environment**.

## What this phase adds

- Rich demo master data for:
  - Platform
  - Company
  - Agency
  - Inventory
  - Logistics
  - Installations
  - Service / Complaint
  - Claims
  - Compliance
  - Documents
  - Notifications
- Demo accounts for both:
  - **Platform / Company users**
  - **Agency app users**
- Demo media package with realistic project images for:
  - survey
  - inspection
  - installation progress
  - completed installation
  - service/maintenance
- Local static API route to serve demo media: `/demo-media/*`
- Idempotent demo seed command that can be re-run safely.

## Important note

Existing real `.env` files remain untouched. Demo seeding uses the current configured database and only adds/upserts demo content.

## Commands

Seed base platform account (existing behavior):

```bash
npm run seed
```

Seed all demo companies, agencies, users, data and images:

```bash
npm run seed:demo
```

Run both in order:

```bash
npm run seed:full-demo
```

Start app locally:

```bash
npm run backend
npm run frontend
```

## Demo scope covered

### Platform / Company modules

- Companies
- Company Users
- Programs
- Contracts / LOA
- Work Orders
- Work Packages
- Beneficiary Context
- Inventory / Serials / Warehouses
- Purchase Orders / GRN
- Shipments / Tracking
- Material Issues
- Installed Assets
- Service Cases
- Claims
- Compliance
- Documents
- Notifications
- Approval Requests
- Readiness / data quality checks

### Agency workflow demo coverage

- Login roles for agency superadmin/admin/technician
- Beneficiary / farmer records
- Survey stage data
- Dispatch / order confirmation status
- Installation records
- Complaint case data
- Technician-linked demo material issues
- Photo-backed field records

## Demo media

Media files are stored under:

`services/api/demo-media`

Served automatically by the API at:

`http://localhost:<PORT>/demo-media/<file>`

If you want a different media host in your environment, set:

`DEMO_MEDIA_BASE_URL`

This is optional and Phase 19 does not create or modify `.env` automatically.

## Phase 19.1 hotfix notes

- Access-control JSX module is now `src/core/accessControl.jsx`; all imports are explicit, so a stale older `permissions.js` file cannot be selected by Vite.
- Farmer final-inspection default/enum contract is corrected.
- Demo beneficiary records explicitly seed a valid final-inspection status.
- Import-batch reserved-key warning is suppressed without changing stored field names.

If upgrading an existing extracted folder, fully stop Vite before copying the update, then restart it after the files are replaced. A clean extraction is preferred for final demos.

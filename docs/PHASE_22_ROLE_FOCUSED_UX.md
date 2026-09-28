# Phase 22 — Role-Focused UX & Notifications

## Objective

Every user should see the workspace required for their job — not the whole ERP.

## Company workspace visibility

- **Company Owner / Company Admin** — complete company workspace.
- **Operations Manager** — delivery, relevant supply-chain visibility, field assets/service, SLA/compliance, approvals and operational governance.
- **Program Manager** — programs/contracts/work packages/beneficiaries, claims, SLA, compliance and program analytics.
- **Inventory Manager** — inventory, warehouses, stock, scanner, shipments/material custody, reconciliation and data quality.
- **Procurement Manager** — item master, warehouses, procurement, stock, analytics/documents/notifications.
- **Finance User** — claims/receivables, financial analytics, documents, notifications and relevant audit history.
- **Quality User** — beneficiaries, installed assets, service/warranty, SLA, compliance, agency performance and evidence.
- **Logistics Manager** — inventory visibility, stock/scanner, logistics, shipments, fleet, technician material and reconciliation.
- **Viewer** — curated read-only workspace: overview, analytics, notifications and documents.

Hidden modules are also removed from My Workspace, command palette and role-scoped search navigation.

## Notifications

Notifications now support:

- direct user targeting
- selected-role targeting
- whole-company targeting
- per-user read/unread state for shared notifications

Automation-generated notifications are role targeted:

- Service SLA / warranty → Owner, Admin, Operations, Quality
- Claim SLA → Owner, Admin, Program, Finance

## Sidebar design

Company sidebar is simplified to six business areas:

1. Workspace
2. Delivery
3. Supply Chain
4. Asset Care
5. Finance & Assurance
6. Administration

Only one primary group is expanded at a time. Search temporarily expands matching groups. Collapse/reopen remains persistent and accessible.

Agency sidebar is simplified to:

1. Overview
2. Field Work
3. Team
4. Data
5. Administration — Agency Superadmin only

Technicians continue to use the dedicated mobile field workflow instead of back-office navigation.

## Environment

No real `.env` file is created or modified by this release.

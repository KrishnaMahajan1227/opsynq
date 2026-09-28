# Phase 31 — Role Dashboard Revamp

Phase 31 replaces the generic company overview with a restrained, role-specific command dashboard system.

## Design principles

- English-only UI.
- Neutral enterprise palette with semantic color only for operational state.
- No decorative gradients and no multi-color KPI backgrounds.
- Maximum six KPI cards per role.
- Two analytical/decision panels per row.
- Every KPI and meaningful dashboard row drills into the related workspace.
- Dashboard data respects the same role capabilities used by navigation and APIs.

## Role dashboards

- Company Owner — company-wide execution, service, approvals and commercial exposure.
- Company Admin — administration, delivery health, compliance and decisions.
- Operations Manager — beneficiary execution, work packages, service and SLA exceptions.
- Program Manager — programs, work orders, package completion and claims.
- Inventory Manager — items, serials, stock, warehouses and low-stock attention.
- Procurement Manager — purchase-order workload and replenishment readiness.
- Finance User — claim realization, blocked exposure, insurance and regulatory reporting.
- Quality User — service, SLA, warranty, compliance and recent quality activity.
- Logistics Manager — shipments, fleet and technician material custody.
- Viewer — concise executive summary only.

All company roles now land on `Dashboard`; the content itself is role-specific.

## Platform and Agency

Platform Superadmin now uses the same restrained command-dashboard visual system for global portfolio governance. Agency Admin/Superadmin dashboard surfaces were normalized to the same neutral spacing, borders and typography. Technician remains task-first and mobile-first rather than chart-heavy.

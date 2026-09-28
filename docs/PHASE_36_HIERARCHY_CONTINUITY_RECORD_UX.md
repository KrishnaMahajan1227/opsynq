# Phase 36 — Hierarchy continuity, record UX and Agency performance

This pass keeps Company delivery navigation and record presentation aligned with the operational hierarchy.

## Navigation continuity
- Sidebar navigation and folder drill-down now share one hierarchy context.
- Program folder → Contracts / LOA module becomes active.
- Contract / LOA folder → Work Orders module becomes active.
- Work Order folder → Work Packages module becomes active.
- Direct sidebar navigation clears stale hierarchy context.
- A compact workspace breadcrumb keeps the last four visited modules available without adding a separate Back button.
- The delivery hierarchy has its own short context breadcrumb for Program / Contract / Work Order / Work Package.

## Record presentation
- Delivery screens show a context summary before the record list/folders.
- Program, Contract, Work Order and Work Package cards expose parent context and operating metrics instead of title-only detail.
- Beneficiary rows expose Program + Contract/LOA + Work Order + Work Package linkage.
- Work Package beneficiary workspace keeps agency and geography visible alongside execution records.

## Agency performance
Agency Directory now surfaces live metrics derived from Work Packages and linked beneficiary execution data:
- active/completed/blocked packages
- beneficiary completion percentage
- completed/in-progress beneficiaries
- pending surveys
- issue load
- district coverage
- last field activity

No synthetic score is used. Metrics come from current company operational records.

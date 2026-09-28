# Opsynq Phase 15 — Runtime Stability, Professional Navigation & Action Center

## Closed runtime defect
Some Platform screens used `useEffect(load, ...)` where `load()` returned a Promise. React can interpret a non-function effect return value as cleanup, which caused the runtime error `destroy is not a function` during unmount/navigation. All direct function-reference effect patterns were replaced with effect wrappers that return only valid cleanup functions or nothing.

A permanent `scripts/effect-contracts.js` release check now blocks direct `useEffect(identifier, deps)` and async effect callbacks.

## Sidebar/navigation redesign
The Company workspace navigation now uses professional section headings with nested dropdown modules:
- Control Center
- Execution Management
- Supply Chain
- Assets & Service
- Commercial Control
- Governance & Assurance
- System Administration

The navigation includes module search, section counts, active-section highlighting, expand/collapse all, persisted section state, desktop compact mode, a mobile drawer with backdrop/close control, Ctrl/Cmd+K quick switch, and a complete module launcher.

## Action Center
A new Company Action Center is the default company landing screen. It aggregates actionable exceptions across approvals, service SLA, claim SLA, compliance, shipments, inventory reconciliation, blocked work packages and near-due work packages. Every card links directly to the owning module.

## Compatibility
The existing Agency field workflow and all previous Company/Platform modules remain present. Existing environment files are not included or rewritten.

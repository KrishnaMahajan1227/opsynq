# Phase 16 — Simplified Navigation & Operator Productivity

## Goals
- Keep every Company module easy to reach without an overwhelming sidebar.
- Guarantee that a collapsed desktop sidebar can always be expanded again.
- Preserve all existing Platform, Company and Agency functionality.
- Add a personal operator workspace for pinned and recently used modules.

## Navigation changes
- Main headings are simplified to Home, Execution, Supply Chain, Assets & Service, Commercial, Governance and System.
- Only the Home section is open by default on a fresh browser profile; the current module section automatically opens.
- Search temporarily expands matching headings.
- Group state and desktop compact state are remembered in local storage.
- Compact mode has two recovery controls: the brand-area toggle and a permanent edge-mounted Expand control.
- Mobile navigation remains a drawer and never inherits desktop compact behavior.

## My Workspace
A new Company module provides:
- Pinned modules
- Recent modules
- Searchable full module directory
- One-click navigation
- Per-company browser persistence for pins and recents

No backend schema changes are required for these personal navigation preferences.

## Environment policy
No real `.env` file is included or modified by this phase.

# Phase 45.2 — Automation Trigger Hotfix

- Added `INTELLIGENCE_SCAN` to the audited `AutomationRun.trigger` enum.
- Fixes `POST /api/platform/ai/scan` failing with Mongoose validation error.
- Preserves distinct audit provenance instead of rewriting intelligence scans as generic SYSTEM runs.
- No business workflow or frontend behavior changed.

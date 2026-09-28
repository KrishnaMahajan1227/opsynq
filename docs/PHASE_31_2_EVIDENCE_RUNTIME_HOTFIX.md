# Phase 31.2 — Evidence Runtime Hotfix

This hotfix permanently removes the stale `EvidenceControlPage` execution path that could survive incremental extraction on Windows.

- Active configuration screens now live in `ConfigurationCenter.jsx`.
- `CompanyWorkspace.jsx` imports that file explicitly.
- `ConfigurationPages.jsx` is only a compatibility re-export shim.
- Evidence Control uses only evidence-specific state: stage, evidence type, mandatory/optional, and active/archive.
- Release QA verifies the active module path and rejects foreign Master Data state inside `EvidenceControlPage`.

Existing `.env` files remain user-managed and are not included or modified.

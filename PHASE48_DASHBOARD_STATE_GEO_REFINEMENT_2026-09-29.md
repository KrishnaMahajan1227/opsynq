# Phase 48 — Company Dashboard, State Execution & Geo Reliability

- Dashboard is the first Company workspace navigation item.
- Removed the duplicate visible Action Center navigation entry; the underlying route remains available for governed workflows.
- Top dashboard KPI strip now surfaces management-attention signals; removed the duplicated Management Attention panel.
- Replaced District execution dashboard panel with State execution, including a state selector, beneficiary/agency/district counts, completion rate, record drill-down, and map drill-down.
- Dashboard API now derives state execution from tenant-scoped Work Package geography and linked beneficiary context.
- Geo Operations now restores dashboard filter context, sanitizes invalid coordinates, and refreshes Leaflet size/bounds on responsive/sidebar layout changes.
- No schema migration required.

# Phase 35 — Delivery Hierarchy, Cross-Module Filters & Query Performance

## Objective
Make the operational delivery model read and behave like one connected execution tree instead of independent flat registers.

## Primary hierarchy
`Program → Contract / LOA → Work Order → Work Package → Beneficiary`

Work Orders that legitimately have no Contract / LOA remain visible under a virtual `Direct / No Contract` folder so legacy or direct-award records are never hidden.

## Frontend changes
- Programs, Contracts / LOA, Work Orders and Work Packages now use the same folder-style delivery explorer.
- Breadcrumb drilling keeps parent context visible at every level.
- Folder cards show child counts and beneficiary counts rather than only raw record details.
- Opening a Work Package displays its Agency, geography and beneficiary execution records in context.
- Agency detail now shows linked Work Packages and beneficiary footprint.
- Beneficiary Records supports Program, Contract, Work Order, Work Package, Agency, Scheme, State, District, Taluka, Village, Survey and Execution filters.
- Geo Operations exposes the same operational hierarchy filters.
- Beneficiary Import explicitly follows Program → Contract / LOA → Work Order → Work Package and its history can be searched/filtered.

## Backend changes
- `GET /portfolio` returns Programs, Contracts, Work Orders, Work Packages and Agencies with beneficiary/child metrics in one request.
- `GET /beneficiary-filter-options` supplies company-scoped geography, scheme and status options.
- Beneficiary listing accepts hierarchy + geography + scheme filters and returns populated delivery context.
- Geo overview accepts Program / Contract / Work Order / Work Package / Agency / Scheme / geography filters.

## Performance improvements
- Consolidated hierarchy loading reduces repeated module-reference requests.
- Beneficiary text search is debounced in the UI.
- Beneficiary API projection/population is narrowed to operational fields needed by the screen.
- Added MongoDB indexes for beneficiary geography/status lookups, delivery-context joins and Work Package geography/agency filtering.

## QA
`npm run qa:source`, API route contracts and Phase 35 contracts are required release gates for this change.

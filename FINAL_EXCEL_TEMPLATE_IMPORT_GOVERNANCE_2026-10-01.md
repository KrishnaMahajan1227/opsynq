# OPSYNQ Excel Template & Import Governance — 2026-10-01

## Scope
Standardized every governed Excel import surface in the existing project without changing the core business hierarchy or tenant model.

Covered imports:
- Company Beneficiary Import
- Agency Beneficiary Import
- Agency JSR Import
- Item Master Import
- Agency Master Import
- Warehouse Master Import
- Driver Master Import
- Vehicle Master Import

## Template behavior
- Every governed template includes two clearly marked `SAMPLE` rows with realistic dummy data.
- A blank `IMPORT` row is included for the first real record.
- `SAMPLE` rows are automatically ignored by importers, so leaving them in the file cannot create dummy production records.
- Templates include an Instructions sheet and an Allowed Values sheet.
- Controlled fields carry list-validation metadata where supported by the spreadsheet client; Allowed Values remains the reliable reference fallback.
- Agency templates populate technician-related allowed values from the signed-in Agency scope.

## Import behavior
- Required fields are validated before unsafe writes where applicable.
- Exact-file duplicate protection remains enabled on governed imports that already use import batches.
- Duplicate business keys within the same uploaded workbook are detected; later duplicates are skipped and reported by Excel row.
- Existing records use explicit update/skip behavior where the module supports conflict review.
- Tenant/Agency ownership conflicts are blocked rather than overwritten.
- Import summaries report Created, Updated, Skipped and Failed counts with row-level reasons.

## Extra user-added columns
Extra Excel columns are accepted as governed custom metadata rather than being discarded.

Storage follows the existing entity convention:
- Beneficiary: `Farmer.customFields` and `BeneficiaryContext.normalizedData.customFields`
- Item Master: `metadata.importExtras`
- Agency/Warehouse/Driver/Vehicle masters: `metadata.importExtras`

Updates merge imported extras with existing custom metadata instead of erasing previously imported values.
Unsafe custom column names are sanitized before persistence.
Core protected workflow/status/ownership fields are not dynamically created from arbitrary columns.

Relevant entity detail / 360 screens expose these values under `Additional Imported Fields` / custom-field sections.

## Safety
- Company imports remain company-scoped.
- Agency beneficiary imports remain Agency-scoped and block Beneficiary IDs owned outside the signed-in Agency scope.
- Same-file duplicate Beneficiary IDs/SKUs/master keys are not silently processed twice.
- Agency required-row validation can stop the import before writes when mandatory identity fields are missing.

## QA
- Excel governance regression: 22/22 PASS
- Frontend JSX syntax: PASS (82 JS/JSX files)
- API route contracts: PASS
- Data integrity contracts: PASS
- Phase 43 governed intelligence/import/geo contracts: PASS
- Agency final workflow: 13/13 PASS
- Agency production flow: 13/13 PASS
- Offline/resilience: 11/11 PASS
- Professional UX: PASS
- UI stability: PASS
- Beneficiary material custody: 18/18 PASS

Repository-wide source sanity still reports two pre-existing baseline findings unrelated to this release:
- `apps/platform-web/src/core/permissions.js` contains JSX in a `.js` file.
- The existing single-login frontend contract is incomplete.

## Deployment
No database migration is required.

Recommended validation:
```bash
npm ci
npm run build:all
npm run qa:excel-import
npm run qa:agency-final
```

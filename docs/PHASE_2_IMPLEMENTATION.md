# Opsynq Phase 2 — Company Work Orchestration

Implemented above the preserved Agency Operations layer:

- Programs
- Contract / LOA master
- Work Orders linked to Programs and optional Contract / LOA
- Company Agency onboarding
- Work Packages linked to Program + Work Order + Agency
- Bulk approved Farmer / Beneficiary Excel intake into an agency-assigned Work Package
- BeneficiaryContext linkage to the existing Farmer record instead of rewriting the validated Farmer schema
- Company-scoped dashboard and company-user workspace
- Platform Superadmin can enter any active company operations workspace
- Company users are restricted to their own tenant by backend middleware
- Import batches retain file hash, source file, row outcomes and audit context

## Beneficiary import minimum columns

Use either:
- `Beneficiary ID` or `Application ID` or `beneficiaryId`
- `Beneficiary Name` or `Farmer Name` or `beneficiaryName`

Recognized optional columns include Mobile, Scheme, District, Village, Taluka/Block, Address, Pump HP, Aadhaar and legacy Agency fields where present.

A Work Package must be assigned to an Agency before beneficiary import.

## Important compatibility rule

The existing `Farmer` schema and Agency workflow remain the operational system of record for ground execution. Higher-level company context is attached through `BeneficiaryContext` so the validated Agency workflow is not broken.

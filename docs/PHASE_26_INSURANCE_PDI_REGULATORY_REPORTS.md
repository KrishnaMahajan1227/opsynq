# Phase 26 — Insurance, PDI & Regulatory Reports

Phase 26 intentionally defers the Farmer/Beneficiary self-service portal and closes the requested enterprise controls first.

## Regression fix

The beneficiary operations router previously declared `/beneficiaries/:farmerId` before fixed paths such as `/beneficiaries/imports`. Express therefore treated `imports` as a farmer id and Mongoose raised an ObjectId CastError.

Phase 26 fixes this at two levels:

1. Fixed beneficiary routes are mounted before the dynamic farmer route.
2. `getBeneficiaryDetail` validates ObjectId input and returns a clean `400` instead of a server error.

## Asset Insurance

New role-aware module: **Asset Care → Asset Insurance**.

Capabilities:

- Company-scoped policy registry
- Beneficiary linkage
- Optional installed-asset linkage
- Policy/reference number
- Insurer and policy type
- Coverage and premium
- Start/end dates
- Active / expiring / expired / cancelled lifecycle
- Insurance claim number/status/dates
- Policy PDF/image upload through Cloudinary
- Search and status filters
- Clickable record → detailed drawer
- Policy/claim updates
- Automatic 30-day expiry state refresh
- Scheduled expiry notifications to Finance, Quality and Company Owner/Admin

## PDI / Pre-Dispatch Inspection

New role-aware module: **Supply Chain → PDI & Asset Inspection**.

Capabilities:

- Unique PDI number
- Serial/barcode-linked inspection
- SKU/item/brand/model/supplier context
- Inspection date and inspector
- PASS / FAIL / HOLD / PENDING result
- Structured checklist
- Multiple inspection history records per serial
- Evidence image/PDF upload
- Certificate/evidence references
- Warehouse / agency disposition
- Warehouse accept / reject-return / rework hold / agency release states
- Failed available serials move to `REJECTED`
- Search and result filters
- Clickable record → detailed drawer
- PDI result/checklist/disposition updates

## Regulatory Reports Center

New role-aware module: **Finance & Assurance → Regulatory Reports**.

Live reports are generated from current company data:

1. **District × Agency Synopsis**
   - beneficiary counts
   - survey pending/completed
   - ready-for-installation
   - installation completed
   - complaint counts

2. **Asset & IMEI Mapping**
   - application/beneficiary
   - district and agency
   - asset role
   - SKU, item, brand, model
   - serial number
   - IMEI for controller mappings
   - install date and lifecycle status

3. **JCR Office Report**
   - beneficiary/application and geography
   - scheme/component
   - pump capacity
   - survey and installation status/dates
   - pump/motor/controller serials
   - IMEI
   - agency and work package

4. **JCR Installer Report**
   - installer/agency
   - beneficiary/application
   - geography
   - pump capacity
   - material / dispatch status
   - installation state/date
   - mapped serials and IMEI

All four reports support:

- on-screen preview
- district filter
- agency/installer filter
- CSV download
- Excel (`.xlsx`) download

## Role access

- Insurance: Owner/Admin; Finance/Quality write; Operations read
- PDI: Owner/Admin; Inventory/Procurement/Quality write
- Regulatory Reports: Owner/Admin; Operations/Program/Finance/Quality read

The same capabilities are enforced on the backend API.

## Demo data

`npm run seed:full-demo` now also seeds:

- active insurance policy
- expiring insurance policy with claim context
- passed PDI record
- PDI held for rework
- evidence URLs and realistic demo media

## Validation

Run:

```bash
npm run qa:release
```

Phase 26 also adds `npm run qa:phase26`, which permanently checks the beneficiary route-order regression and the Insurance/PDI/Reports integration contracts.

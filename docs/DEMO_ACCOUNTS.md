# Demo Accounts

The reset/seed flow preserves every existing demo account record, `_id`, tenant mapping, role and password hash. It does not reset existing credentials.

`seed/demoData.js` now requires every listed demo account and tenant mapping to already exist. It refuses to create, reset or remap any login. The existing Platform SuperAdmin credentials remain environment-owned and are intentionally not copied into this document.

## Unified sign-in

Use the same Opsynq sign-in page for Platform, Company, Agency and Technician users:

`http://localhost:5173/?login=1`

Agency users are routed to Agency Operations through the existing one-time handoff flow. Passwords and JWTs are not placed in redirect URLs.

## Platform / Company demo accounts

### SuryaKisan Energy Private Limited (SKEPL)

| Role | Name | Login | Mobile |
|---|---|---|---|
| company_owner | Rohan Kulkarni | rohan.kulkarni@opsynq.demo | 9000000001 |
| company_admin | Megha Sharma | megha.sharma@opsynq.demo | 9000000002 |
| operations_manager | Aniket Joshi | aniket.joshi@opsynq.demo | 9000000003 |
| inventory_manager | Kavita Patil | kavita.patil@opsynq.demo | 9000000004 |
| logistics_manager | Sameer Khan | sameer.khan@opsynq.demo | 9000000005 |
| quality_user | Neha Deshmukh | neha.deshmukh@opsynq.demo | 9000000006 |
| finance_user | Vikram Naik | vikram.naik@opsynq.demo | 9000000007 |
| viewer | Prerna Sable | prerna.sable@opsynq.demo | 9000000008 |

### AgriVolt Solar Infra Limited (AVSIL)

| Role | Name | Login | Mobile |
|---|---|---|---|
| company_owner | Sanjay Borse | sanjay.borse@opsynq.demo | 9100000001 |
| company_admin | Pooja More | pooja.more@opsynq.demo | 9100000002 |
| operations_manager | Harshal Jadhav | harshal.jadhav@opsynq.demo | 9100000003 |
| inventory_manager | Nitin Kale | nitin.kale@opsynq.demo | 9100000004 |
| quality_user | Manasi Pawar | manasi.pawar@opsynq.demo | 9100000005 |

## Agency / Technician demo accounts

### Nagpur Field Ops Agency (NAGFOPS)

| Role | Username | Mobile |
|---|---|---|
| superadmin | nagpur.superadmin | 9200000001 |
| admin | nagpur.admin | 9200000002 |
| field_technician | nagpur.tech01 | 9200000003 |
| field_technician | nagpur.tech02 | 9200000004 |

### Nashik Rural Installations (NASRINS)

| Role | Username | Mobile |
|---|---|---|
| superadmin | nashik.superadmin | 9300000001 |
| admin | nashik.admin | 9300000002 |
| field_technician | nashik.tech01 | 9300000003 |
| field_technician | nashik.tech02 | 9300000004 |

### Pune Energy Services (PUNESVC)

| Role | Username | Mobile |
|---|---|---|
| superadmin | pune.superadmin | 9400000001 |
| admin | pune.admin | 9400000002 |
| field_technician | pune.tech01 | 9400000003 |

## Demo data summary

- 2 demo companies and 3 linked demo agencies.
- Exactly 18 beneficiaries: 10 Nagpur, 5 Nashik, 3 Pune.
- 3 work packages with assigned quantities matching beneficiary counts.
- Lifecycle coverage from new/pending through survey, dispatch, installation, complaint, closed, plus ON_HOLD and REJECTED edge demonstrations.
- Serialized inventory with available, agency-stock, issued and installed states tied to beneficiaries/technicians.
- Procurement, GRN, stock movement, shipments, material issue, installed assets, service, compliance, claims, RMS-supporting records, notifications, audit and reports seed data.
- Real-media mode is limited to 6 selected beneficiaries (58 unique JPG slots). The seed requires a verified Cloudinary manifest; all other beneficiaries keep empty media fields so the UI does not render broken URLs.

## Recommended demo walkthrough

1. **Company Owner/Admin — SKEPL:** open Company Overview, Delivery, Beneficiaries, Supply Chain, Agency Performance, Financial Control, RMS, Reports and Audit. Use `OPS-DM-004`, `OPS-DM-005`, `OPS-DM-015` and `OPS-DM-016` for installed/closed/service examples.
2. **Operations Manager — SKEPL:** show Nagpur/Nashik work packages and beneficiary drill-down. `OPS-DM-001` is early-stage, `OPS-DM-002` survey in progress, `OPS-DM-003` ready for installation, `OPS-DM-017` is the on-hold edge case, and `OPS-DM-018` is the rejected edge case.
3. **Inventory/Logistics:** show free stock first, then serialized material assigned/installed against `OPS-DM-004/005/006/015/016`; `OPS-DM-011` demonstrates material issued and ready for field installation.
4. **Agency Admin — Nagpur:** show only NAGFOPS work, team/access, inbound material, assignments and beneficiary operations. No Nashik/Pune tenant data should be visible.
5. **Technician — `nagpur.tech01`:** show mobile-first field queue and the assigned installation/evidence flow around `OPS-DM-004` or `OPS-DM-015`.
6. **Company 2 — AVSIL:** use AVSIL owner/admin and Pune Agency accounts to demonstrate a second tenant and prove separation from SKEPL.

Run `npm run demo:sanity` after a verified demo reset/seed before presenting the client demo.

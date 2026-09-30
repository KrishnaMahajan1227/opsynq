# Demo Accounts

All seeded demo accounts use the same default password unless you override it with `DEMO_DEFAULT_PASSWORD` before seeding.

**Default demo password:** `Demo@1234`

> Existing platform superadmin continues to use the credentials already present in your real `.env`.

## Platform / Company demo accounts

### Company 1 — SuryaKisan Energy Private Limited (SKEPL)

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

### Company 2 — AgriVolt Solar Infra Limited (AVSIL)

| Role | Name | Login | Mobile |
|---|---|---|---|
| company_owner | Sanjay Borse | sanjay.borse@opsynq.demo | 9100000001 |
| company_admin | Pooja More | pooja.more@opsynq.demo | 9100000002 |
| operations_manager | Harshal Jadhav | harshal.jadhav@opsynq.demo | 9100000003 |
| inventory_manager | Nitin Kale | nitin.kale@opsynq.demo | 9100000004 |
| quality_user | Manasi Pawar | manasi.pawar@opsynq.demo | 9100000005 |

## Agency app demo accounts

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

- 2 demo companies
- 3 demo agencies
- 24 seeded beneficiaries / farmer records
- 3 work packages
- 3 shipments
- installed asset records
- material issues
- service complaints
- compliance records
- commercial claims
- documents and notifications

## Which login screen to use

**Platform / Company users:** `http://localhost:5173`

**Agency Superadmin / Admin / Technician:** `http://localhost:5174`

Agency accounts authenticate against `/api/auth/login`, not `/api/platform/auth/login`.

After `npm run seed:full-demo` and while the backend is running, verify the seeded demo accounts with:

```bash
npm run verify:demo
```

## Phase 20 unified login

Use the **same Opsynq sign-in page** for every seeded account:

`http://localhost:5173/?login=1`

- Platform / Company accounts remain in the Platform application.
- Agency Superadmin / Admin / Technician accounts are securely redirected to Agency Operations after authentication.
- Agency passwords and JWT tokens are never placed in redirect URLs; a one-time 60-second handoff code is used instead.

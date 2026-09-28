# Phase 33 Local Test

Keep your existing `services/api/.env` unchanged.

## 1. Seed the complete demo

```powershell
npm run seed:full-demo
```

This creates representative stock consumption, low/out-of-stock positions, Agency shipments/receipts, procurement history and claims, then evaluates replenishment so intelligence screens are populated.

## 2. Start backend

```powershell
npm run backend
```

## 3. Start both frontends

```powershell
npm run frontend
```

## 4. Verify demo integration

With the backend running:

```powershell
npm run verify:demo
```

The verifier checks unified Company login, Procurement Intelligence, Financial Control, unified Agency handoff, Agency Material Receipts and beneficiary assignment context.

## 5. Manual procurement test

1. Sign in as Company Admin, Inventory Manager or Procurement Manager.
2. Open **Supply Chain → Procurement Intelligence**.
3. Confirm the demo stockout/critical positions are visible.
4. Open a recommendation and review rule inputs and recommended quantity.
5. Open the prepared Draft PO.
6. Confirm supplier, quantity and unit price.
7. Explicitly issue the PO.
8. Open Procurement and receive a valid partial/full GRN.
9. Confirm over-receipt or wrong warehouse is rejected.

## 6. Agency receipt test

1. Sign in through unified login with an Agency Admin/Superadmin demo account.
2. Open **Material → Material Receipts**.
3. Open an in-transit shipment.
4. Confirm good/damaged/missing quantities and serials where applicable.
5. Submit the receipt.
6. In Company Operations open **Agency Material Control** and confirm the sent/received/pending/damaged/missing figures changed.

## 7. Financial Control

Open **Finance & Assurance → Financial Control** and confirm:

- ordered procurement value
- goods received value
- open commitment
- estimated on-hand inventory value
- pricing coverage
- claims / approved / paid / receivable / blocked values
- Agency material and commercial exposure

The view is operational management finance, not a statutory general ledger.

## 8. AI brief

If a supported Gemini/Google AI key already exists in your backend environment, use **AI brief** on Procurement Intelligence or Financial Control. If no supported key is configured or the provider is unavailable, Opsynq returns a deterministic rules-based brief instead. AI never issues a purchase order.

## 9. Release checks

```powershell
npm run qa:release
npm run uat:contracts
npm run build:all
```

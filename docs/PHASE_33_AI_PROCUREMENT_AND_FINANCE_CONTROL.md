# Phase 33 — AI-Assisted Procurement, Agency Stock Accountability & Finance Control

Phase 33 closes the decision layer above the existing physical stock chain.

## Existing custody chain preserved

Opsynq already records:

PO → GRN → warehouse balance → serialized shipment → agency receipt → damage/missing reconciliation → technician issue → installation.

Phase 33 does not replace that model. It uses the existing records as the source of truth.

## Procurement Intelligence

New Company workspace: **Supply Chain → Procurement Intelligence**.

The replenishment engine calculates, by item and warehouse:

- On-hand quantity
- Allocated quantity
- Incoming shipment quantity
- Open PO quantity
- 30-day outbound movement
- Minimum stock
- Reorder level
- Estimated days of cover
- Target stock
- Suggested replenishment quantity
- Estimated unit cost from historical PO lines
- Estimated replenishment value
- Suggested supplier from current/open PO history

The deterministic calculation remains authoritative. Gemini adds explanatory advisory text only.

### AI policy

Gemini runs server-side only using `GEMINI_API_KEY`.

The browser never receives the Gemini API key.

Scheduled automation refreshes the deterministic plan every 15 minutes. When a Gemini key is configured, AI advisory text is refreshed when stale rather than on every scheduler cycle.

### Manual procurement control

AI or automation never directly issues a supplier PO.

Flow:

Replenishment recommendation → Procurement/Inventory review → Draft PO → Owner/Admin approval → ISSUED PO → GRN → stock replenished.

Critical/high stock risks generate role-targeted notifications for Company Owner, Company Admin, Inventory Manager and Procurement Manager.

## Agency Stock Accountability

New Company workspace: **Supply Chain → Agency Stock Accountability**.

Per Agency it shows:

- Shipment count
- Units dispatched
- Units received
- Units still in transit
- Damaged units
- Missing units
- Receipt/accountability percentage
- Current Agency warehouse stock
- Units issued onward to technicians

Values are computed from the existing shipment, receipt, inventory-balance and material-issue records.

## Financial Control

New Company workspace: **Finance & Assurance → Financial Control**.

Company-level calculations include:

- Procurement committed value
- Procurement received value
- Open procurement commitment
- Estimated inventory book value
- Claim gross / eligible / approved / paid
- Receivables (approved minus paid)
- Blocked claim value

Agency-level calculations include:

- Work Packages
- Assigned quantity
- Active installed assets
- Material shipped / received / damaged / missing
- Claim gross / approved / paid
- Outstanding receivable

### Valuation note

Inventory book value is an operational estimate using weighted PO unit cost × on-hand balance. It is not a substitute for audited accounting valuation, tax accounting, vendor payable ledgers or a general ledger.

## Dashboard integration

Role dashboards consume the new intelligence endpoints:

- Owner/Admin: supply risk + finance control panels
- Inventory: critical stock risks + suggested units
- Procurement: open PO + risk + suggested quantity + estimated replenishment
- Finance: receivables + procurement commitments + inventory value
- Logistics: Agency stock exceptions

## Automation

The scheduled automation engine now includes a `replenishment` job.

It creates/refreshes replenishment plans and sends role-targeted stock-risk notifications.

## Security

- Gemini key is backend-only.
- Procurement users can prepare DRAFT POs.
- Only Company Owner/Admin can approve/issue replenishment POs.
- Approval Center enforces the same Owner/Admin restriction.
- All draft creation, approval, dismissal and automation refresh actions are audited.

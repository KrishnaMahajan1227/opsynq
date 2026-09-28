# Opsynq Phase 7 — Governance, Analytics, Documents & Notifications

Phase 7 extends the company layer without changing the validated Agency field workflow.

## Added
- Company Analytics & Reports workspace with execution, inventory, logistics, service and commercial summaries.
- Company Notifications workspace with unread tracking and company-wide operational messages.
- Controlled Document Repository for Contract/LOA/PO/Invoice/GRN/POD/Inspection/Beneficiary/Warranty/Service/Claim evidence.
- Audit Trail explorer for sensitive company operations.
- Idempotent Opsynq bootstrap seed (`npm run seed`) that reads the existing backend `.env` and upserts the Platform organization + Platform Superadmin.

## Security / tenant rules
- All new endpoints use the existing Platform JWT authentication.
- Company users are automatically restricted to their company context.
- Platform Superadmin must explicitly supply/open a company context.
- Uploaded documents are scoped by company and audit logged.
- Notification recipients, when specified, must belong to the same company.
- No `.env` file is shipped or rewritten by this phase.

## Existing Agency layer
No existing Farmer, Survey, Technician, Installation, Complaint, Final Inspection or Agency UI workflow was renamed or removed.

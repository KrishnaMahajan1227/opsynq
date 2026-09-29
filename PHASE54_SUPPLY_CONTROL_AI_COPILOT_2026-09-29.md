# Phase 54 — Supply Control + Persistent AI Copilot

- Supply Chain Control now starts with role-aware daily actions: add inventory item, create PO, receive/scan GRN, transfer stock, and create dispatch.
- Quick actions open the target workflow directly and consume their navigation action once so dialogs do not reopen on later visits.
- Existing operating flow, KPIs, focused workspaces, exceptions, dispatch capacity, and recent dispatch activity remain intact.
- Company AI Copilot is mounted at Company Shell level for AI-capable operational roles, independent of whether the Operations Intelligence nav item is currently visible.
- Copilot keeps session conversation across Company pages, uses current-screen scope, supports minimize/restore, and links to Operations Intelligence when available.
- Historical security .env.example restored with placeholders only; no real credentials included.

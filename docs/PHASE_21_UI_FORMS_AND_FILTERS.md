# Phase 21 — UI Forms, Popups & Filters

## Goals

- Prevent forms/modals from clipping outside the viewport.
- Keep long forms internally scrollable instead of scrolling the entire page.
- Keep primary actions visible through sticky modal action areas.
- Standardize control/button sizing.
- Keep search visible while moving secondary filters into right-side drawers where the workspace benefits from it.
- Remove repeated screen-title / explanatory heading banners from back-office screens.

## Platform / Company updates

- Shared `Modal` now uses a bounded viewport shell with a scrollable body.
- Modal actions stay visible at the bottom of long forms.
- Mobile modals use a full-height sheet pattern.
- Added shared `FilterDrawer` and `FilterButton` components.
- Right-side filter drawers applied to major high-volume screens including Companies, Beneficiary Records, Installed Assets, Service Cases, Quality & Compliance and Documents.
- Search remains in the primary command bar.
- Buttons, selects and search controls use consistent 42px interaction height.
- `PageHeader` no longer renders repeated page title/description banners; it only keeps relevant actions.

## Agency updates

- Repeated Agency screen heading/description banner removed.
- Bootstrap/custom dialogs receive project-wide viewport-safe scrolling.
- Modal footer actions stay accessible on long forms.
- Existing filter drawers for Farmer Records, Technician filters and Operations filters are retained and normalized.
- Search, filter and primary-action controls share consistent height/radius/spacing.
- Mobile dialogs become full-height sheets so no fields/actions are cut off.

## Environment

No real `.env` file is created, modified or bundled by this phase.

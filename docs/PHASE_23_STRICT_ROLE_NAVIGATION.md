# Phase 23 — Strict Role Workspaces & Sidebar Refinement

## Core rule

A company user now sees only the modules that belong to that role's actual work. Unrelated modules are not exposed as "view-only" screens.

The same filtered module registry drives:
- sidebar
- default landing screen
- Ctrl/Cmd + K module switcher
- My Workspace
- global search result destinations

Backend domain read permissions are also tightened to follow the same ownership model.

## Role landing pages

- Company Owner / Admin → My Workspace
- Operations Manager → Action Center
- Program Manager → Programs
- Inventory Manager → Inventory Overview
- Procurement Manager → Procurement
- Finance User → Claims & Receivables
- Quality User → Action Center
- Logistics Manager → Logistics Overview
- Viewer → Executive Overview

## Sidebar behavior

Expanded sidebar is intentionally dense and clean:
- one business area open at a time
- tighter vertical rhythm
- no module-count clutter
- no "View" badges
- no read-only banner

Collapsed sidebar is now a true icon rail:
- only the business-area icons are visible
- child modules are not stacked in collapsed mode
- clicking a business-area icon automatically reopens the sidebar and opens that section
- a persistent edge expand button remains available
- compact width is reduced to 68px

## Environment

No real `.env` files are included or rewritten by this phase.

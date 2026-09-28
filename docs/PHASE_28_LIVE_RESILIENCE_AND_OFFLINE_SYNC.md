# Phase 28 — Live Resilience, Session Continuity & Offline Sync

Phase 28 makes Opsynq safer during local development, live deployments and temporary connectivity loss.

## Automatic UI update

### Local development

`npm run frontend` continues to use Vite HMR. Frontend source edits are pushed to every open development browser without clearing authentication.

`npm run backend` already uses Node watch mode and restarts the API when imported backend files change.

### Production / deployed frontend

Each Platform and Agency client periodically checks two independent revision signals:

1. `/api/runtime/revision` — backend/repository runtime revision.
2. the currently served `/index.html` fingerprint — detects a newly deployed frontend build.

When a revision changes, Opsynq saves continuity state and reloads only when it is safe. Active form fields, selects, textareas and open dialogs defer the refresh until the user is no longer actively editing.

For mutable servers where source files are edited directly, use:

```bash
npm run production:watch
```

For normal immutable/container/CI deployments, keep `npm run production:start`; the deployment process should restart the API and publish a new frontend build. `RELEASE_ID`, `COMMIT_SHA` or `GIT_COMMIT` can be supplied by CI for an explicit deployment revision.

## Session continuity

- JWTs are kept in local storage and are not removed by update refreshes.
- Platform user context is cached locally.
- Platform Superadmin selected page/company context is stored in session storage.
- Company workspace module is stored per company + role.
- Agency BrowserRouter path is naturally restored after refresh.
- Scroll position is restored after safe reload.
- Only a real HTTP 401 expires a Platform session; a temporary network failure no longer triggers logout.

## Offline read cache

Successful GET responses are cached in IndexedDB.

When connectivity drops, previously loaded screens can use the latest cached response instead of immediately becoming empty.

## Offline write queue

Network-failed JSON and FormData mutations are stored in IndexedDB for Platform and Agency applications.

Supported methods:

- POST
- PUT
- PATCH
- DELETE

Authentication and unified-login requests are intentionally never queued.

When the browser comes back online, Opsynq replays queued writes in order using the current session token. After successful synchronization the client safely refreshes so server state is reflected in the UI.

A compact top status bar appears only when the browser is offline, syncing, or has queued changes.

## Security

- Password/login requests are never written to the offline queue.
- Tokens remain in the same existing local-storage session model; they are not added to IndexedDB queue records.
- Queue replay uses the current token at synchronization time.
- HTTP 401/403 stops replay rather than repeatedly sending unauthorized writes.
- Existing tenant and role authorization remains server-side and is applied again during replay.

## Important production behavior

Changing raw frontend source on a production server does not alter already-built static files by itself. Opsynq detects and refreshes automatically after the production build/deployment has actually changed the served frontend. For a direct-edit mutable server, rebuild the frontend and use `production:watch` for API source changes.

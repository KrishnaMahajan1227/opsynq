import { lazy } from 'react';

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed|error loading dynamically imported module/i;
const RELOAD_PARAM = '__opsynq_deploy';
const PREFIX = 'opsynq.chunk-reload';

const isChunkLoadError = error => CHUNK_ERROR.test(String(error?.message || error || ''));
const reloadKey = key => `${PREFIX}:${key}:${location.pathname}:${location.hash}`;

function clearReloadParam() {
  try {
    const url = new URL(location.href);
    if (!url.searchParams.has(RELOAD_PARAM)) return;
    url.searchParams.delete(RELOAD_PARAM);
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {}
}

function recoverFromChunkFailure(key) {
  if (!import.meta.env.PROD || typeof window === 'undefined') return false;
  const marker = reloadKey(key);
  if (sessionStorage.getItem(marker)) return false;
  sessionStorage.setItem(marker, String(Date.now()));
  try {
    const url = new URL(location.href);
    url.searchParams.set(RELOAD_PARAM, String(Date.now()));
    location.replace(url.toString());
  } catch {
    location.reload();
  }
  return true;
}

async function loadWithRecovery(loader, key) {
  const marker = reloadKey(key);
  try {
    const mod = await loader();
    sessionStorage.removeItem(marker);
    clearReloadParam();
    return mod;
  } catch (error) {
    if (isChunkLoadError(error) && recoverFromChunkFailure(key)) return new Promise(() => {});
    sessionStorage.removeItem(marker);
    throw error;
  }
}

export const lazyWithRetry = (loader, key = 'module') => lazy(() => loadWithRecovery(loader, key));
export const lazyNamedWithRetry = (loader, name) => lazyWithRetry(() => loader().then(mod => ({ default: mod[name] })), name);

export function installVitePreloadRecovery() {
  if (typeof window === 'undefined' || window.__opsynqPreloadRecoveryInstalled) return;
  window.__opsynqPreloadRecoveryInstalled = true;
  window.addEventListener('vite:preloadError', event => {
    if (!isChunkLoadError(event?.payload)) return;
    event.preventDefault?.();
    recoverFromChunkFailure('vite-preload');
  });
}

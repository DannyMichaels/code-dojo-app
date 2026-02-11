/**
 * In-memory session mutex to prevent concurrent message processing
 * on the same session. Single-process only.
 * Includes a TTL to prevent stale locks from blocking sessions forever.
 */
const activeSessions = new Map();

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes — generous for long Claude responses

export function acquireSessionLock(sessionId) {
  const key = sessionId.toString();
  const existing = activeSessions.get(key);

  // If lock exists but is stale (older than TTL), force-release it
  if (existing && Date.now() - existing > LOCK_TTL_MS) {
    activeSessions.delete(key);
  }

  if (activeSessions.has(key)) return false;
  activeSessions.set(key, Date.now());
  return true;
}

export function releaseSessionLock(sessionId) {
  activeSessions.delete(sessionId.toString());
}

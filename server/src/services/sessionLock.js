/**
 * In-memory session mutex to prevent concurrent message processing
 * on the same session. Single-process only.
 */
const activeSessions = new Map();

export function acquireSessionLock(sessionId) {
  const key = sessionId.toString();
  if (activeSessions.has(key)) return false;
  activeSessions.set(key, Date.now());
  return true;
}

export function releaseSessionLock(sessionId) {
  activeSessions.delete(sessionId.toString());
}

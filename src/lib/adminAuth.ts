// Simple password protection (HTTP Basic Auth, any username).
// ADMIN_PASSWORD opens the admin area and the worker page; WORKER_PASSWORD (optional) opens only the
// worker page, for staff who print orders. If a password isn't set, that area is locked.

export function isAdminAuthorized(authHeader: string | null): boolean {
  return passwordMatches(authHeader, process.env.ADMIN_PASSWORD);
}

/** The worker page: staff password or the admin password. */
export function isStaffAuthorized(authHeader: string | null): boolean {
  return passwordMatches(authHeader, process.env.WORKER_PASSWORD) || passwordMatches(authHeader, process.env.ADMIN_PASSWORD);
}

function passwordMatches(authHeader: string | null, password: string | undefined): boolean {
  if (!password || !authHeader?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authHeader.slice(6));
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given.length !== password.length) return false;
    let diff = 0;
    for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ password.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}

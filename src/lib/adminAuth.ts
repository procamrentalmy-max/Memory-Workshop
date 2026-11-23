// Simple password protection for the admin area (HTTP Basic Auth, any username).
// Set ADMIN_PASSWORD in .env.local. If it isn't set, the admin area is locked.

export function isAdminAuthorized(authHeader: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
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

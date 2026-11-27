// The customer login cookie (shared by the proxy and the account code, so it has no other imports).
export const SESSION_COOKIE = "mw_customer";
/** The longest a browser keeps a cookie (400 days). It's renewed whenever the customer opens their page. */
export const SESSION_MAX_AGE = 400 * 24 * 60 * 60;

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
});

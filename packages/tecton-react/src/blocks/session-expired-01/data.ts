export const sessionExpiredCopy = {
  status: "Session expired",
  protocol: "HTTP 401",
  title: "Your session has expired.",
  description:
    "For your security, sessions end after a period of inactivity. Sign in again to pick up where you left off; any unsaved changes are kept on this device.",
  ssoProvider: "single sign-on",
  signInHref: "#sign-in",
  ssoHref: "#sso",
}

export const sessionContext = {
  signedInAs: "lena.haugen@example.com",
  expiredAt: "2026-09-12T14:02:36Z",
  /** Where the user was when the session ended; restored after sign-in. */
  returnTo: "/reports/summary",
  /** Unsaved local edits waiting to be synced. */
  pendingEdits: 3,
}

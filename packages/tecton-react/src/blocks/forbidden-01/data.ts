export const forbiddenCopy = {
  status: "Access restricted",
  protocol: "HTTP 403",
  title: "You don't have permission to view this page.",
  description:
    "Your account is signed in, but it hasn't been granted access to this page. You can request access below, or switch to an account that has it.",
  switchAccountHref: "#switch-account",
}

export const forbiddenContext = {
  signedInAs: "jonas.berg@example.com",
  requestId: "req_c07d55e1",
}

export function validateReason(value: string): string | undefined {
  if (value.trim().length < 12)
    return "Tell us what you need access for (at least 12 characters)."
  return undefined
}

type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL: "Enter a valid email address.",
  ACCOUNT_NOT_FOUND:
    "No account exists for this email. Create an account to continue.",
  ACCOUNT_ALREADY_EXISTS:
    "An account already exists for this email. Sign in instead.",
  EMAIL_DOMAIN_UNREACHABLE:
    "That email domain cannot receive mail. Check the address and try again.",
  INVALID_OTP: "That code is incorrect or has expired. Request a new one.",
  OTP_EXPIRED: "That code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Request a new code.",
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE:
    "Too many attempts. Sign in again to get a new challenge.",
  INVALID_TWO_FACTOR_COOKIE:
    "Your verification window expired. Sign in again to continue.",
  INVALID_CODE:
    "That code is incorrect. Check your authenticator app and try again.",
  INVALID_BACKUP_CODE:
    "That recovery code is invalid or has already been used.",
  BACKUP_CODES_NOT_ENABLED:
    "Recovery codes are not available for this account. Sign in again and restart setup.",
  TOTP_NOT_ENABLED:
    "Authenticator setup is not active. Sign in again and restart setup from this page.",
  TOTP_ALREADY_ENABLED:
    "An authenticator is already active on this account. Sign in with it instead.",
  TWO_FACTOR_NOT_ENABLED:
    "Two-factor authentication is not active on this account. Sign in again and complete setup.",
  ACCOUNT_TEMPORARILY_LOCKED:
    "Too many failed attempts. This account is locked for 15 minutes.",
  INVALID_PASSWORD:
    "This account does not use a password. Sign in with an email code.",
  SESSION_EXPIRED: "Your session expired. Sign in again.",
  UNAUTHORIZED: "You need to sign in to continue.",
  FORBIDDEN: "You do not have permission to do that.",
};

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (typeof error === "object" &&
      error !== null &&
      "message" in error &&
      /fetch|network|load failed/i.test(String((error as Error).message)))
  );
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (isNetworkError(error)) {
    return "We could not reach the server. Check your connection and try again.";
  }

  const value = error as AuthErrorLike;
  const code = value.code?.toUpperCase();

  if (code && MESSAGES[code]) {
    return MESSAGES[code];
  }

  if (value.status === 429) {
    return "Too many requests. Wait a minute and try again.";
  }

  if (value.message && !/^[A-Z0-9_]+$/.test(value.message)) {
    return value.message;
  }

  return fallback;
}

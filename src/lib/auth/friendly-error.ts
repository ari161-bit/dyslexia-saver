const KNOWN_MESSAGES: [pattern: RegExp, friendly: string][] = [
  [/already registered/i, "An account with that email already exists. Try logging in instead."],
  [/invalid login credentials/i, "Incorrect email or password."],
  [/email not confirmed/i, "Please confirm your email before logging in."],
  [/password should be at least/i, "Password must be at least 8 characters."],
  [/rate limit/i, "Too many attempts. Please wait a minute and try again."],
];

// Supabase/Postgres errors (e.g. "Database error saving new user") are
// meaningless to someone signing up and read as the product being broken
// rather than a backend hiccup — never show one of these verbatim.
export function friendlyAuthError(message: string): string {
  for (const [pattern, friendly] of KNOWN_MESSAGES) {
    if (pattern.test(message)) return friendly;
  }
  if (/database error|internal|unexpected|fetch/i.test(message)) {
    return "Something went wrong on our end creating your account. Please try again in a moment.";
  }
  return message;
}

/** Turn Apollo/HTTP errors into actionable, non-technical messages for the UI. */
export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const network = error.networkError;
  const raw = String(error.message || "");
  if (network || /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(raw)) {
    return "Cannot connect to SpendWise. Check your internet connection and try again.";
  }
  const graphQLErrors = error.graphQLErrors || [];
  const code = graphQLErrors[0]?.extensions?.code;
  if (code === "UNAUTHENTICATED" || /not authenticated|unauthorized|login required|not logged in/i.test(raw)) {
    return "Your session may have expired. Please sign in again.";
  }
  if (code === "FORBIDDEN") return "You do not have permission to perform this action.";
  if (/invalid credentials|incorrect password|invalid username|user not found/i.test(raw)) {
    return "Incorrect username or password.";
  }
  if (/already exists|duplicate|already taken/i.test(raw)) {
    return "This information is already in use. Please choose another value.";
  }
  if (/rate limit|too many requests|too many attempts/i.test(raw)) {
    return "Too many attempts. Please wait a little before trying again.";
  }
  if (/invalid.*(amount|date)|must be greater than|validation failed/i.test(raw)) {
    return "Please check your entries and try again.";
  }
  // Do not expose resolver stack traces, database details, or internal errors.
  return fallback;
}

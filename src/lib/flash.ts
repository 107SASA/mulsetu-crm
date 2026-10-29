// Appends a query param to a redirect target, e.g. withParam("/projects?tab=x", "notice", "Saved").
export function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

// Redirect target that makes the app shell show a short success toast.
export function withNotice(path: string, message: string) {
  return withParam(path, "notice", message);
}

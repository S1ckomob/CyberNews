const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

/** Read the CSRF token from the cookie set by the proxy */
export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${CSRF_COOKIE}=`))
      ?.split("=")[1] || ""
  );
}

/** Return headers object with the CSRF token included */
export function csrfHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    [CSRF_HEADER]: getCsrfToken(),
    ...extra,
  };
}

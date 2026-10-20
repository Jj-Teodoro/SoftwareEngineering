// Which portal the URL is showing: "/admin...", "/scanner..." or anything else (students).
export function currentPortal() {
  const segment = window.location.pathname.split("/")[1];
  return segment === "admin" || segment === "scanner" ? segment : "user";
}

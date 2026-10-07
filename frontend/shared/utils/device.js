/** A short, human description of this browser, e.g. "Chrome · Windows". */
export function describeDevice(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
    ? "Opera"
    : /Firefox\//.test(ua)
    ? "Firefox"
    : /Chrome\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : "Browser";

  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Linux/.test(ua)
    ? "Linux"
    : "Unknown OS";

  const kind = /Mobi|Android|iPhone/.test(ua) ? "Phone" : /iPad|Tablet/.test(ua) ? "Tablet" : "Computer";
  return `${browser} · ${os} · ${kind}`;
}

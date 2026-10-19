const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const ACCESS_KEY = "oasis_access_token";
const REFRESH_KEY = "oasis_refresh_token";

function readToken(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    // storage unavailable; tokens only live for this request
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // nothing to clear
  }
}

export function hasSession() {
  return Boolean(readToken(ACCESS_KEY));
}

export class ApiError extends Error {
  constructor(status, data) {
    super(extractMessage(data) || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

// DRF errors come back as {detail: "..."} or {field: ["..."]}
function extractMessage(data) {
  if (!data || typeof data !== "object") return null;
  if (typeof data.detail === "string") return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  return typeof first === "string" ? first : null;
}

async function send(path, { method = "GET", body, query, auth = true } = {}) {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  const headers = { "Content-Type": "application/json" };
  const token = auth && readToken(ACCESS_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

let refreshing = null;

async function refreshAccessToken() {
  const refresh = readToken(REFRESH_KEY);
  if (!refresh) throw new ApiError(401, { detail: "Session expired" });

  // share one refresh call between requests that fail at the same time
  refreshing ??= send("/token/refresh", { method: "POST", body: { refresh }, auth: false })
    .then(saveTokens)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || options.auth === false) throw error;
    try {
      await refreshAccessToken();
    } catch {
      clearTokens();
      window.dispatchEvent(new Event("oasis:logout"));
      throw error;
    }
    return send(path, options);
  }
}

export async function login(studentId, password) {
  const tokens = await send("/token", {
    method: "POST",
    body: { student_id: studentId, password },
    auth: false,
  });
  saveTokens(tokens);
  return tokens;
}

export function logout() {
  clearTokens();
  window.dispatchEvent(new Event("oasis:logout"));
}

export const api = {
  me: () => request("/user/me"),
  users: {
    list: (query) => request("/user", { query }),
    get: (studentId) => request(`/user/${encodeURIComponent(studentId)}`),
    create: (user) => request("/user/register", { method: "POST", body: user }),
    bulkCreate: (users) => request("/user/bulk", { method: "POST", body: users }),
    update: (studentId, changes) => request(`/user/${encodeURIComponent(studentId)}`, { method: "PATCH", body: changes }),
    remove: (studentId) => request(`/user/${encodeURIComponent(studentId)}`, { method: "DELETE" }),
  },
  events: {
    list: (query) => request("/event", { query }),
    get: (eventId) => request(`/event/${eventId}`),
    create: (event) => request("/event", { method: "POST", body: event }),
    update: (eventId, changes) => request(`/event/${eventId}`, { method: "PATCH", body: changes }),
    remove: (eventId) => request(`/event/${eventId}`, { method: "DELETE" }),
  },
  attendance: {
    list: (query) => request("/attendance", { query }),
    create: (attendance) => request("/attendance", { method: "POST", body: attendance }),
    update: (attendanceId, changes) => request(`/attendance/${attendanceId}`, { method: "PATCH", body: changes }),
    remove: (attendanceId) => request(`/attendance/${attendanceId}`, { method: "DELETE" }),
  },
  notifications: {
    list: (query) => request("/notification", { query }),
    create: (notification) => request("/notification", { method: "POST", body: notification }),
    update: (notificationId, changes) => request(`/notification/${notificationId}`, { method: "PATCH", body: changes }),
    markAllRead: (studentId) => request(`/user/${encodeURIComponent(studentId)}/notifications/read`, { method: "POST" }),
  },
  logs: {
    list: (query) => request("/log", { query }),
    create: (log) => request("/log", { method: "POST", body: log }),
  },
};

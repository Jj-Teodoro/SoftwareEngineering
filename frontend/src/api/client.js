// Talks to the Django API (which stores everything in Supabase Postgres).
// The admin, scanner and student portals share one origin, so each portal keeps
// its own tokens: signing in at /admin doesn't sign anyone in on the student site.
import { currentPortal } from "./portal.js";

// Deployed on Vercel the API is served from the same domain under /api (see the
// root vercel.json); in `npm run dev` it is the local Django server.
const DEFAULT_API_URL = import.meta.env.DEV ? "http://localhost:8000/api" : "/api";
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

const SESSION_EVENT = "oasis:session";

const accessKey = () => `oasis_${currentPortal()}_access_token`;
const refreshKey = () => `oasis_${currentPortal()}_refresh_token`;

function readToken(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(accessKey(), access);
    if (refresh) localStorage.setItem(refreshKey(), refresh);
  } catch {
    // storage unavailable; the session ends with the tab
  }
}

function clearTokens() {
  try {
    localStorage.removeItem(accessKey());
    localStorage.removeItem(refreshKey());
  } catch {
    // nothing to clear
  }
}

function announceSession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function hasSession() {
  return Boolean(readToken(accessKey()));
}

// Calls `callback` whenever the user signs in or out (replaces onAuthStateChanged).
export function subscribeSession(callback) {
  const handler = () => callback(hasSession());
  window.addEventListener(SESSION_EVENT, handler);
  return () => window.removeEventListener(SESSION_EVENT, handler);
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
  // the base makes a same-origin API_URL like "/api" work too
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  const headers = { "Content-Type": "application/json" };
  const token = auth && readToken(accessKey());
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
  const refresh = readToken(refreshKey());
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
      announceSession();
      throw error;
    }
    return send(path, options);
  }
}

// portal: "staff" (username) or "student" (email or student ID)
export async function login(identifier, password, portal) {
  const { access, refresh, user } = await send("/auth/login", {
    method: "POST",
    body: { identifier, password, portal },
    auth: false,
  });
  saveTokens({ access, refresh });
  announceSession();
  return user;
}

export function logout() {
  clearTokens();
  announceSession();
}

const id = encodeURIComponent;

export const api = {
  me: () => request("/user/me"),
  updateProfile: (fields) => request("/user/me", { method: "PATCH", body: fields }),
  changePassword: (currentPassword, newPassword) =>
    request("/user/me/password", {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  // staff also send where they are: { app, page, event, device }
  heartbeat: (online, where = {}) => request("/user/me/presence", { method: "POST", body: { online, ...where } }),
  // "forgot password" for a student number or a staff username
  requestTempPassword: (studentId) =>
    send("/auth/password-request", { method: "POST", body: { student_id: studentId }, auth: false }),

  staff: {
    list: () => request("/staff"),
    create: (name, username, role) => request("/staff", { method: "POST", body: { name, username, role } }),
  },

  users: {
    list: (query) => request("/user", { query }),
    get: (studentId) => request(`/user/${id(studentId)}`),
    create: (user) => request("/user/register", { method: "POST", body: user }),
    bulkCreate: (users) => request("/user/bulk", { method: "POST", body: users }),
    bulkDelete: (studentIds) => request("/user/bulk-delete", { method: "POST", body: { student_ids: studentIds } }),
    update: (studentId, changes) => request(`/user/${id(studentId)}`, { method: "PATCH", body: changes }),
    remove: (studentId) => request(`/user/${id(studentId)}`, { method: "DELETE" }),
    issueAccount: (studentId) => request(`/user/${id(studentId)}/account`, { method: "POST" }),
    storedTempPassword: (studentId) => request(`/user/${id(studentId)}/account`),
    dismissPasswordRequest: (studentId) => request(`/user/${id(studentId)}/password-request`, { method: "DELETE" }),
  },
  events: {
    list: () => request("/event"),
    create: (event) => request("/event", { method: "POST", body: event }),
    update: (eventId, changes) => request(`/event/${eventId}`, { method: "PATCH", body: changes }),
    remove: (eventId) => request(`/event/${eventId}`, { method: "DELETE" }),
    announce: (eventId, kind, message) =>
      request(`/event/${eventId}/announce`, { method: "POST", body: { kind, message } }),
  },
  attendance: {
    list: (query) => request("/attendance", { query }),
    create: (attendance) => request("/attendance", { method: "POST", body: attendance }),
    update: (attendanceId, changes) => request(`/attendance/${attendanceId}`, { method: "PATCH", body: changes }),
    remove: (attendanceId) => request(`/attendance/${attendanceId}`, { method: "DELETE" }),
    scan: (eventId, studentId) => request("/attendance/scan", { method: "POST", body: { event: eventId, user: studentId } }),
  },
  notifications: {
    list: () => request("/notification"),
    markRead: (notificationId) =>
      request(`/notification/${notificationId}`, { method: "PATCH", body: { read_status: true } }),
    markAllRead: (studentId) => request(`/user/${id(studentId)}/notifications/read`, { method: "POST" }),
  },
  requirements: {
    list: () => request("/requirement"),
    create: (requirement) => request("/requirement", { method: "POST", body: requirement }),
    update: (requirementId, changes) => request(`/requirement/${requirementId}`, { method: "PATCH", body: changes }),
    remove: (requirementId) => request(`/requirement/${requirementId}`, { method: "DELETE" }),
    completions: () => request("/requirement/completion"),
    toggle: (studentId, requirementId) =>
      request("/requirement/completion/toggle", { method: "POST", body: { student: studentId, requirement: requirementId } }),
  },
  hobbies: {
    list: () => request("/hobby"),
  },
};

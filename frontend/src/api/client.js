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

// When a JWT stops being valid (its `exp` claim), in ms; null if unreadable.
function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

// The session lasts as long as the refresh token (24 hours from signing in by
// default, set on the server); after that the person has to log in again.
function sessionExpired() {
  const expiry = tokenExpiry(readToken(refreshKey()) || "");
  return !expiry || expiry <= Date.now();
}

let expiryTimer = null;

// Signs the person out the moment their session runs out, instead of waiting
// for the next request to fail.
function scheduleSessionEnd() {
  clearTimeout(expiryTimer);
  const expiry = tokenExpiry(readToken(refreshKey()) || "");
  if (!expiry) return;
  // setTimeout can't wait longer than ~24.8 days; sessions are far shorter
  expiryTimer = setTimeout(() => {
    clearTokens();
    announceSession();
  }, Math.max(0, expiry - Date.now()));
}

export function hasSession() {
  if (!readToken(accessKey())) return false;
  if (sessionExpired()) {
    clearTokens();
    return false;
  }
  return true;
}

if (hasSession()) scheduleSessionEnd();

// Calls `callback` whenever the user signs in or out (replaces onAuthStateChanged).
export function subscribeSession(callback) {
  const handler = () => callback(hasSession());
  window.addEventListener(SESSION_EVENT, handler);
  return () => window.removeEventListener(SESSION_EVENT, handler);
}

// What to say when the server answered with an error but no readable message.
function describeStatus(status) {
  if (status === 404) return "The server doesn't have this yet. It may still be updating, so try again in a minute.";
  if (status >= 500) {
    return "The server had a problem. If the system was just updated, its database may need the update too. Tell the person who runs the system.";
  }
  return `Request failed with status ${status}`;
}

export class ApiError extends Error {
  constructor(status, data) {
    super(extractMessage(data) || describeStatus(status));
    this.status = status;
    this.data = data;
  }
}

// DRF errors come back as {detail: "..."} or {field: ["..."]}
// Readable names for the fields a form can send, so an error says which field it
// is about instead of appearing to belong to whatever input shows it.
const FIELD_LABELS = {
  student_id: "ID number",
  first_name: "Name",
  middle_name: "Name",
  last_name: "Name",
  program: "Course",
  year_level: "Year level",
  section: "Section",
  email: "Email",
  contact_number: "Contact number",
  address: "Address",
};

// One record's errors, e.g. {section: ["Ensure this field has no more than 20 characters."]}
export function describeFieldErrors(errors) {
  if (!errors || typeof errors !== "object") return null;
  const [field, first] = Object.entries(errors)[0] || [];
  const message = Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : null;
  if (!message) return null;
  return FIELD_LABELS[field] ? `${FIELD_LABELS[field]}: ${message}` : message;
}

// A bulk request answers with errors per row: a list, or an object keyed by row number
// ({"2": {...}}). Returns [{ index, message }] for the rows that were rejected.
export function rowErrors(data) {
  if (!data || typeof data !== "object") return [];
  const entries = Array.isArray(data) ? data.map((e, i) => [i, e]) : Object.entries(data);
  if (!entries.every(([key]) => /^\d+$/.test(String(key)))) return [];
  return entries
    .map(([key, errors]) => ({ index: Number(key), message: describeFieldErrors(errors) }))
    .filter((e) => e.message);
}

function extractMessage(data) {
  if (!data || typeof data !== "object") return null;
  if (typeof data.detail === "string") return data.detail;
  const rows = rowErrors(data);
  if (rows.length > 0) {
    const more = rows.length > 1 ? ` (and ${rows.length - 1} more row${rows.length === 2 ? "" : "s"})` : "";
    return `Row ${rows[0].index + 1}: ${rows[0].message}${more}`;
  }
  return describeFieldErrors(data);
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
  let data = null;
  let readable = true;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      readable = false; // an error page or something else that is not data
    }
  }
  if (!response.ok) throw new ApiError(response.status, readable ? data : null);
  if (!readable) throw new ApiError(502, { detail: "The server sent back something unexpected. Try again in a minute." });
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
  scheduleSessionEnd();
  announceSession();
  return user;
}

// Cancels the session on the server too, so the saved token can't be reused.
export function logout() {
  const refresh = readToken(refreshKey());
  if (refresh) {
    send("/auth/logout", { method: "POST", body: { refresh }, auth: false }).catch(() => {});
  }
  clearTimeout(expiryTimer);
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
  myActivity: () => request("/user/me/activity"),
  heartbeat: (online, where = {}) => request("/user/me/presence", { method: "POST", body: { online, ...where } }),
  // "forgot password" for a student number or a staff username
  requestTempPassword: (studentId) =>
    send("/auth/password-request", { method: "POST", body: { student_id: studentId }, auth: false }),

  staff: {
    list: () => request("/staff"),
    // the student-style details plus role ("admin" or "scanner")
    create: (account) => request("/staff", { method: "POST", body: account }),
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
    // logins for many students at once: { created: [{student_id, temp_password}], skipped: [{student_id, reason}] }
    bulkAccounts: (studentIds) => request("/user/accounts", { method: "POST", body: { student_ids: studentIds } }),
    storedTempPassword: (studentId) => request(`/user/${id(studentId)}/account`),
    // { student_id, role, temp_password (only when they had no login yet) }
    makeAdmin: (studentId) => request(`/user/${id(studentId)}/make-admin`, { method: "POST" }),
    dismissPasswordRequest: (studentId) => request(`/user/${id(studentId)}/password-request`, { method: "DELETE" }),
  },
  events: {
    list: () => request("/event"),
    create: (event) => request("/event", { method: "POST", body: event }),
    update: (eventId, changes) => request(`/event/${eventId}`, { method: "PATCH", body: changes }),
    remove: (eventId) => request(`/event/${eventId}`, { method: "DELETE" }),
    // stops scanning for good (until reopened)
    close: (eventId) => request(`/event/${eventId}/close`, { method: "POST" }),
    reopen: (eventId) => request(`/event/${eventId}/close`, { method: "DELETE" }),
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
  settings: {
    // null means "automatic": the sum of every requirement and event that applies to the student
    clearance: () => request("/settings/clearance"),
    setClearance: (requiredPoints) =>
      request("/settings/clearance", { method: "PATCH", body: { required_points: requiredPoints } }),
  },
  hobbies: {
    list: () => request("/hobby"),
  },
};

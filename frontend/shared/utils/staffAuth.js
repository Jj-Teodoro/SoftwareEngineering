import { doc, getDoc } from "firebase/firestore";

// Staff (admin / scanner) sign in with a username. The Firebase login behind it
// is `<username>@oasis.local`, or a versioned address after an admin re-issues
// the account (Firebase cannot change another person's password from a browser,
// so a reset creates a fresh login and points the username at it).

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const normalizeUsername = (username) => String(username || "").trim().toLowerCase();

export const staffLoginEmail = (username, version = 1) => {
  const u = normalizeUsername(username);
  return version > 1 ? `${u}+oasis${version}@oasis.local` : `${u}@oasis.local`;
};

// Key for the temporary-password and reset-request documents of a staff account.
export const staffKey = (username) => `staff_${normalizeUsername(username)}`;

// Document in `loginAliases` that maps a username to its current login address.
export const staffAliasId = (username) => sha256Hex(`staff:${normalizeUsername(username)}`);

/** The login address to use for this username (an admin may have re-issued it). */
export async function resolveStaffLoginEmail(db, username) {
  try {
    const alias = await getDoc(doc(db, "loginAliases", await staffAliasId(username)));
    if (alias.exists()) return alias.data().authEmail;
  } catch {
    // no alias; use the default address
  }
  return staffLoginEmail(username);
}

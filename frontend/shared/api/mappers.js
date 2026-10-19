// Converts between the Django API's records and the shapes the sites' components use
// (the same shapes they used with Firestore, so the UI code didn't have to change).

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const toMillis = (iso) => (iso ? Date.parse(iso) : null);

// "LAST, FIRST M." <-> last / first / middle, matching splitName in StudentIdCard
export function formatName({ last_name = "", first_name = "", middle_name = "" }) {
  const given = [first_name, middle_name].filter(Boolean).join(" ");
  return [last_name, given].filter(Boolean).join(", ");
}

export function parseName(full = "") {
  const comma = full.indexOf(",");
  if (comma === -1) return { last_name: full.trim(), first_name: "", middle_name: "" };

  const tokens = full.slice(comma + 1).trim().split(/\s+/).filter(Boolean);
  let middle = "";
  if (tokens.length > 1 && /^[A-Za-z]\.?$/.test(tokens[tokens.length - 1])) {
    middle = tokens.pop();
  }
  return { last_name: full.slice(0, comma).trim(), first_name: tokens.join(" "), middle_name: middle };
}

export function formatYearLevel(level) {
  return YEAR_LABELS[level - 1] || `${level} Year`;
}

export function parseYearLevel(label) {
  const digit = Number(String(label ?? "").match(/\d/)?.[0]);
  return digit >= 1 && digit <= 4 ? digit : 1;
}

export function toStudent(user) {
  return {
    studentId: user.student_id,
    name: formatName(user),
    course: user.program,
    yearLevel: formatYearLevel(user.year_level),
    section: user.section,
    status: user.status,
    email: user.email,
    contactNumber: user.contact_number,
    address: user.address,
    bio: user.bio,
    hobbies: user.hobbies || [],
    talent: user.talent,
    photo: user.photo,
    role: user.role,
    // components check `authUid` to see whether the student has a login yet
    authUid: user.has_account ? user.student_id : null,
    mustChangePassword: user.must_change_password,
    passwordRequestedAt: toMillis(user.password_requested_at),
    lastSeen: toMillis(user.last_seen),
    online: user.online,
  };
}

const STUDENT_FIELDS = {
  studentId: "student_id",
  course: "program",
  section: "section",
  status: "status",
  email: "email",
  contactNumber: "contact_number",
  address: "address",
};

export function fromStudent(fields) {
  const data = {};
  Object.entries(STUDENT_FIELDS).forEach(([key, apiKey]) => {
    if (key in fields) data[apiKey] = typeof fields[key] === "string" ? fields[key].trim() : fields[key];
  });
  if ("name" in fields) Object.assign(data, parseName(fields.name.trim()));
  if ("yearLevel" in fields) data.year_level = parseYearLevel(fields.yearLevel);
  return data;
}

export function toStaff(user) {
  return {
    uid: user.student_id,
    username: user.student_id,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.student_id,
    role: user.role,
  };
}

export function toEvent(event) {
  return {
    id: event.event_id,
    title: event.title,
    date: event.date,
    description: event.description || "",
    image: event.image || "",
    pointValue: event.default_points,
    programFilter: event.program_for?.[0] || "ALL",
    createdBy: event.created_by,
    createdByName: event.created_by_name,
    createdByRole: event.created_by_role,
    createdAt: event.created_at,
    lastNotifiedAt: event.last_notified_at,
  };
}

export function fromEvent({ title, date, description, image, pointValue, programFilter }) {
  return {
    title,
    date,
    description,
    image: image || "",
    default_points: Number(pointValue) || 0,
    program_for: programFilter && programFilter !== "ALL" ? [programFilter] : [],
  };
}

export function toAttendance(record) {
  return {
    id: record.attendance_id,
    eventId: record.event,
    studentId: record.user,
    pointValue: record.points_awarded,
    timeIn: record.timestamp,
    timeOut: record.time_out,
  };
}

export function toNotification(notification) {
  return {
    id: notification.notification_id,
    type: notification.event ? "event" : "system",
    kind: notification.kind,
    eventId: notification.event,
    title: notification.title,
    message: notification.message,
    eventDate: notification.event_date,
    createdAt: notification.created_at,
    read: notification.read_status,
  };
}

export function toRequirement(requirement) {
  return {
    id: requirement.requirement_id,
    title: requirement.title,
    pointValue: requirement.point_value,
    programFilter: requirement.program_filter || "ALL",
    createdAt: requirement.created_at,
  };
}

export function fromRequirement({ title, pointValue, programFilter }) {
  return {
    title,
    point_value: Math.max(0, Number(pointValue) || 0),
    program_filter: programFilter || "ALL",
  };
}

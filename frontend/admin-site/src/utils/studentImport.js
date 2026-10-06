import ExcelJS from "exceljs";

const HEADER_ALIASES = {
  studentid: "studentId",
  "student id": "studentId",
  id: "studentId",
  "id number": "studentId",
  name: "name",
  "full name": "name",
  "student name": "name",
  course: "course",
  program: "course",
  yearlevel: "yearLevel",
  "year level": "yearLevel",
  year: "yearLevel",
  section: "section",
  status: "status",
  email: "email",
  "email address": "email",
  contactnumber: "contactNumber",
  "contact number": "contactNumber",
  contact: "contactNumber",
  phone: "contactNumber",
  "phone number": "contactNumber",
  address: "address",
};

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function cellToText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.text) return String(value.text).trim();
    if (value.result != null) return String(value.result).trim();
    return "";
  }
  return String(value).trim();
}

function parseCsvText(text) {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };

  const headerCells = parseLine(lines[0]);
  const headerMap = {};
  headerCells.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (key) headerMap[i] = key;
  });

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const record = {};
    cells.forEach((v, idx) => {
      const key = headerMap[idx];
      if (key) record[key] = v.trim();
    });
    if (Object.keys(record).length > 0) rows.push(record);
  }
  return rows;
}

async function parseWorkbookFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  let headerMap = {};
  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    const values = row.values.slice(1);
    if (rowNumber === 1) {
      values.forEach((v, i) => {
        const key = HEADER_ALIASES[normalizeHeader(cellToText(v))];
        if (key) headerMap[i] = key;
      });
      return;
    }
    const record = {};
    values.forEach((v, i) => {
      const key = headerMap[i];
      if (key) record[key] = cellToText(v);
    });
    if (Object.keys(record).length > 0) rows.push(record);
  });

  return rows;
}

export async function parseStudentsFile(file) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".csv")) {
    const text = await file.text();
    return parseCsvText(text);
  }
  return parseWorkbookFile(file);
}

export function normalizeImportRow(row) {
  const studentId = (row.studentId || "").trim();
  const name = (row.name || "").trim();
  const statusRaw = (row.status || "").trim().toUpperCase();

  return {
    studentId,
    name,
    course: (row.course || "").trim(),
    yearLevel: (row.yearLevel || "").trim() || "1st Year",
    section: (row.section || "").trim(),
    status: statusRaw === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    email: (row.email || "").trim(),
    contactNumber: (row.contactNumber || "").trim(),
    address: (row.address || "").trim(),
  };
}

export async function downloadImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "Student ID", key: "studentId", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "Course", key: "course", width: 25 },
    { header: "Year Level", key: "yearLevel", width: 12 },
    { header: "Section", key: "section", width: 12 },
    { header: "Email", key: "email", width: 30 },
    { header: "Contact Number", key: "contactNumber", width: 16 },
    { header: "Address", key: "address", width: 25 },
  ];
  sheet.addRow({
    studentId: "2024-00000",
    name: "DELA CRUZ, JUAN P.",
    course: "BS Computer Engineering",
    yearLevel: "1st Year",
    section: "BSCPE-1A",
    email: "juan.delacruz@dyci.edu.ph",
    contactNumber: "0900-000-0000",
    address: "City, Province",
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "oasis_student_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

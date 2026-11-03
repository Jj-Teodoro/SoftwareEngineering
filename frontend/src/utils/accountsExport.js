import ExcelJS from "exceljs";

// Writes the temporary passwords just issued to an Excel file the admin can print, filter
// and hand out. Sorted by program, year, section and name so a class can be handed its own rows.
export async function downloadPasswordsXlsx(rows) {
  const sorted = [...rows].sort((a, b) =>
    [a.course, a.yearLevel, a.section, a.name]
      .map((v) => v || "")
      .join("|")
      .localeCompare([b.course, b.yearLevel, b.section, b.name].map((v) => v || "").join("|"))
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Temporary passwords");
  sheet.columns = [
    { header: "Student Number", key: "studentId", width: 16 },
    { header: "Name", key: "name", width: 34 },
    { header: "Program", key: "course", width: 28 },
    { header: "Year", key: "yearLevel", width: 12 },
    { header: "Section", key: "section", width: 12 },
    { header: "Temporary Password", key: "tempPassword", width: 22 },
  ];
  sorted.forEach((row) => sheet.addRow(row));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF2A0507" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2B400" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "F1" };
  // text, so Excel never turns a student number or password into a number
  ["A", "F"].forEach((col) => {
    sheet.getColumn(col).numFmt = "@";
  });
  sheet.getColumn("F").font = { name: "Consolas", bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oasis-temporary-passwords-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

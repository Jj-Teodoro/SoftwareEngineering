import ExcelJS from "exceljs";

export async function exportPaymentsToExcel({ students, items, isPaid, getStatus, label }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Payments");

  sheet.columns = [
    { header: "Student ID", key: "studentId", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "Program", key: "course", width: 25 },
    { header: "Section", key: "section", width: 12 },
    { header: "Status", key: "status", width: 10 },
    ...items.map((item) => ({ header: item, key: item, width: 18 })),
    { header: "Cleared", key: "cleared", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  students.forEach((s) => {
    const row = {
      studentId: s.studentId,
      name: s.name,
      course: s.course,
      section: s.section,
      status: s.status,
      cleared: getStatus(s.studentId).cleared ? "Yes" : "No",
    };
    items.forEach((item) => {
      row[item] = isPaid(s.studentId, item) ? "PAID" : "UNPAID";
    });
    sheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeLabel = (label || "all_students").replace(/[^a-z0-9]+/gi, "_");
  link.download = `oasis_payments_${safeLabel}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

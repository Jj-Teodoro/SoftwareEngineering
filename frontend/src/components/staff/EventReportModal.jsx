import { useEffect, useState } from "react";
import { FiDownload, FiLoader, FiPrinter } from "react-icons/fi";
import Modal from "../common/Modal.jsx";
import { api } from "../../api/client.js";
import { downloadReportXlsx, printReport, reportSummary } from "../../utils/eventReport.js";

// The attendance report of one event (SRS FR-47): a summary, then Excel or a printable PDF.
export default function EventReportModal({ event, onClose }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.events
      .report(event.id)
      .then((data) => alive && setReport(data))
      .catch((e) => alive && setError(e.message || "Could not load the report."));
    return () => {
      alive = false;
    };
  }, [event.id]);

  const excel = async () => {
    setBusy(true);
    try {
      await downloadReportXlsx(report);
    } catch {
      setError("Could not create the Excel file.");
    } finally {
      setBusy(false);
    }
  };

  const pdf = () => {
    if (!printReport(report)) setError("Allow pop-ups for this site to print or save the report as PDF.");
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <h2 className="page-title pr-8">Attendance report</h2>
      <p className="mt-1 text-sm muted">{event.title}</p>

      {!report && !error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
          <FiLoader className="animate-spin" /> Preparing the report...
        </p>
      )}
      {error && <p className="mt-4 text-sm text-neon-pink">{error}</p>}

      {report && (
        <>
          {report.provisional && (
            <p className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
              The event is not closed yet, so this report is marked <b>Provisional</b>. Close the event for the final report.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {reportSummary(report).map(([label, value]) => (
              <div key={label} className="surface-inset p-3">
                <p className="font-mono text-lg font-bold">{value}</p>
                <p className="label mt-1 leading-snug">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs muted">
            One row per eligible student with time in, time out, points and status (Completed, Timed in only, Absent).
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={pdf} className="btn-ghost">
              <FiPrinter size={14} /> Print / Save as PDF
            </button>
            <button type="button" onClick={excel} disabled={busy} className="btn-primary">
              <FiDownload size={14} /> {busy ? "Creating..." : "Download Excel"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

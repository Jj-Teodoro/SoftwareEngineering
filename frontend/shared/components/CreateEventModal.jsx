import { useRef, useState } from "react";
import { FiImage, FiTrash2 } from "react-icons/fi";
import Modal from "./Modal.jsx";
import { resizeImageToDataUrl } from "../utils/image.js";
import { todayLocal } from "../utils/events.js";

const inputClass = "input";
const labelClass = "label mb-1.5 block";

/**
 * Create-event form shared by the Admin and Scanner sites. An event needs a
 * description or a background picture (or both) because that is what students
 * receive in their notification.
 */
export default function CreateEventModal({
  programs,
  createEvent,
  updateEvent,
  event,
  onClose,
  onCreated,
}) {
  const editing = Boolean(event);
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    title: event?.title ?? "",
    date: event?.date ?? todayLocal(),
    pointValue: event?.pointValue ?? 10,
    programFilter: event?.programFilter ?? "ALL",
    description: event?.description ?? "",
  });
  const [image, setImage] = useState(event?.image ?? "");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError("");
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImage(await resizeImageToDataUrl(file, { width: 960, height: 540 }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Event name is required.");
    if (!form.date) return setError("Date is required.");
    if (!form.description.trim() && !image) {
      return setError(
        "Add a description or a background picture. Students receive it in their notification."
      );
    }

    setSubmitting(true);
    const result = editing
      ? await updateEvent(event.id, { ...form, image, notify })
      : await createEvent({ ...form, image });
    setSubmitting(false);

    if (!result.ok) return setError(result.message);
    if (!result.notified) {
      setWarning(
        editing
          ? "The changes were saved, but students could not be notified."
          : "The event was created, but students could not be notified."
      );
      return;
    }
    onCreated?.(result.event);
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <h2 className="page-title pr-8 mb-1">
        {editing ? "Edit Event" : "New Event"}
      </h2>
      <p className="mb-5 text-xs text-white/55">
        {editing
          ? "Update the details, and choose whether to tell students about the change."
          : "Students in the chosen program are notified as soon as the event is created."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className={labelClass}>Event Name</label>
          <input
            className={inputClass}
            placeholder="General Assembly"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" className={inputClass} value={form.date} onChange={set("date")} />
            <p className="mt-1 text-[10px] text-white/45">Scanning opens on this date.</p>
          </div>
          <div>
            <label className={labelClass}>Points</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.pointValue}
              onChange={set("pointValue")}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Program</label>
          <select className={inputClass} value={form.programFilter} onChange={set("programFilter")}>
            <option className="text-black" value="ALL">
              All Programs
            </option>
            {programs.map((p) => (
              <option key={p} className="text-black" value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-white/15 bg-black/20 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-gold">
            What students will see — add at least one
          </p>

          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            maxLength={400}
            className="input py-2"
            placeholder="Venue, time, what to bring, what the event is about..."
            value={form.description}
            onChange={set("description")}
          />

          <label className={`${labelClass} mt-4`}>Background picture</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {image ? (
            <div className="relative overflow-hidden rounded-lg border border-white/20">
              <img src={image} alt="Event background preview" className="h-36 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage("")}
                aria-label="Remove picture"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-700"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/30 text-xs font-semibold text-white/60 transition-all hover:border-white/60 hover:text-white"
            >
              <FiImage size={20} />
              Choose a picture
            </button>
          )}
        </div>

        {editing && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/15 bg-black/20 px-4 py-3">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#f2b400]"
            />
            <span className="text-xs text-white/80">
              <span className="font-bold uppercase tracking-[1px] text-white">
                Notify students about this update
              </span>
              <br />
              Sends a new notification to the students in the event's program.
            </span>
          </label>
        )}

        {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
        {warning && <p className="text-xs font-semibold text-yellow-300">{warning}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-11"
          >
            {warning ? "Close" : "Cancel"}
          </button>
          {!warning && (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary h-11"
            >
              {submitting ? "Saving..." : editing ? "Save Changes" : "Create Event"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

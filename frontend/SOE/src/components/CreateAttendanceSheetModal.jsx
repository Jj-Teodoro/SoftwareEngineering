import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { useAttendance } from "../context/AttendanceContext";

const inputClass =
  "h-11 w-full rounded-lg border border-white/30 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/60";

const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-white/70";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateAttendanceSheetModal({ onClose, onCreated }) {
  const { createSheet } = useAttendance();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      date: today(),
      description: "",
    },
  });

  const onSubmit = (data) => {
    const result = createSheet(data);
    if (!result.ok) {
      setError("title", { type: "manual", message: result.message });
      return;
    }
    onCreated?.(result.sheet);
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <h2 className="mb-6 text-lg font-bold uppercase tracking-[2px] text-white">
        New Attendance Sheet
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className={labelClass}>Activity / Event Name</label>
          <input
            className={inputClass}
            placeholder="General Assembly"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="mt-1 text-xs font-semibold text-red-300">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            className={inputClass}
            {...register("date", { required: "Date is required" })}
          />
        </div>

        <div>
          <label className={labelClass}>Description (optional)</label>
          <input
            className={inputClass}
            placeholder="e.g. Venue, time, notes"
            {...register("description")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-white/30 px-6 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-full bg-[#97191d] px-8 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Sheet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

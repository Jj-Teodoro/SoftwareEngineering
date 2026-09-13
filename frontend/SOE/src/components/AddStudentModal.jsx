import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { useStudents } from "../context/StudentsContext";

const inputClass =
  "h-11 w-full rounded-lg border border-white/30 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/60";

const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-white/70";

export default function AddStudentModal({ onClose }) {
  const { addStudent } = useStudents();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      studentId: "",
      password: "",
      name: "",
      course: "",
      yearLevel: "1st Year",
      section: "",
      status: "ACTIVE",
      email: "",
      contactNumber: "",
      address: "",
    },
  });

  const onSubmit = (data) => {
    const result = addStudent(data);
    if (!result.ok) {
      setError("studentId", { type: "manual", message: result.message });
      return;
    }
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <h2 className="mb-6 text-lg font-bold uppercase tracking-[2px] text-white">
        Add Student Account
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Student ID</label>
            <input
              className={inputClass}
              placeholder="2024-00000"
              {...register("studentId", { required: "Student ID is required" })}
            />
            {errors.studentId && (
              <p className="mt-1 text-xs font-semibold text-red-300">
                {errors.studentId.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              placeholder="Temporary password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs font-semibold text-red-300">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Full Name</label>
          <input
            className={inputClass}
            placeholder="LASTNAME, FIRSTNAME M."
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="mt-1 text-xs font-semibold text-red-300">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Course</label>
            <input
              className={inputClass}
              placeholder="BS Computer Engineering"
              {...register("course", { required: "Course is required" })}
            />
            {errors.course && (
              <p className="mt-1 text-xs font-semibold text-red-300">
                {errors.course.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Year Level</label>
            <select className={inputClass} {...register("yearLevel")}>
              <option className="text-black">1st Year</option>
              <option className="text-black">2nd Year</option>
              <option className="text-black">3rd Year</option>
              <option className="text-black">4th Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Section</label>
            <input
              className={inputClass}
              placeholder="BSCPE-3A"
              {...register("section", { required: "Section is required" })}
            />
            {errors.section && (
              <p className="mt-1 text-xs font-semibold text-red-300">
                {errors.section.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} {...register("status")}>
              <option className="text-black">ACTIVE</option>
              <option className="text-black">INACTIVE</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={inputClass}
            placeholder="student@dyci.edu.ph"
            {...register("email", {
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-semibold text-red-300">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Contact Number</label>
            <input
              className={inputClass}
              placeholder="0900-000-0000"
              {...register("contactNumber")}
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={inputClass} placeholder="City, Province" {...register("address")} />
          </div>
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
            {isSubmitting ? "Adding..." : "Add Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

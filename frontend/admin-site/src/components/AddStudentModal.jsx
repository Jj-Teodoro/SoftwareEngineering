import { useForm } from "react-hook-form";
import Modal from "@oasis/shared/components/Modal.jsx";
import { useStudents } from "../context/StudentsContext";

const inputClass = "input";

const labelClass = "label mb-1.5 block";

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

  const onSubmit = async (data) => {
    const result = await addStudent(data);
    if (!result.ok) {
      setError("studentId", { type: "manual", message: result.message });
      return;
    }
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <h2 className="page-title pr-8 mb-6">
        Add Student Record
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

        <div className="grid grid-cols-1 gap-4">
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
            className="btn-ghost h-11"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary h-11"
          >
            {isSubmitting ? "Adding..." : "Add Student"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

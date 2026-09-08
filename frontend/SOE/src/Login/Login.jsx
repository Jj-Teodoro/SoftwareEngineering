import React from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      studentId: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    console.log("Form Submitted:", data);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f4f4] font-['Montserrat',sans-serif]">
      {/* Background Dot Pattern & Fade Mask */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d7a0a0_1.2px,transparent_1.2px)] [background-size:10px_10px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0.08))]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:px-24">
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-12 lg:flex-row lg:gap-24">
          {/* LEFT SIDE: Brand & Institutions */}
          <div className="flex w-full max-w-[420px] flex-col items-center text-center">
            <img
              src="/aces-logo.png"
              alt="ACES Logo"
              className="mb-6 h-auto w-40 max-w-full object-contain"
            />

            <h2 className="text-base font-bold tracking-[3px] text-gray-900">
              DR. YANGA'S COLLEGES, INC.
            </h2>

            <p className="mt-2 text-sm uppercase tracking-[3px] text-gray-700">
              COLLEGE OF COMPUTER STUDIES
            </p>

            <p className="mt-1 text-sm uppercase tracking-[3px] text-gray-700">
              ASSOCIATION OF COMPUTER ENTHUSIAST STUDENTS
            </p>
          </div>

          {/* RIGHT SIDE: Login Card */}
          <div className="w-full max-w-[620px] rounded-[30px] bg-[#f9f9f9] px-8 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)] sm:px-10">
            {/* OASIS Logo */}
            <div className="mb-8 text-center">
              <h1 className="text-[80px] font-black leading-none tracking-tight lg:text-[100px]">
                <span className="text-[#8d151a]">oa</span>
                <span className="text-black">sis</span>
              </h1>

              <p className="mt-2 text-[11px] tracking-[3px] text-gray-700">
                Officer &amp; Admin System for Involvement &amp; Students
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Student ID */}
              <div className="mb-6">
                <div
                  className={`relative h-[90px] rounded-xl border bg-transparent transition-colors ${
                    errors.studentId ? "border-red-500" : "border-[#9d4c52]"
                  }`}
                >
                  <label
                    htmlFor="studentId"
                    className="absolute left-4 top-3 text-[14px] font-bold uppercase tracking-[3px] text-black"
                  >
                    Student ID
                  </label>

                  <input
                    id="studentId"
                    type="text"
                    {...register("studentId", {
                      required: "Student ID is required",
                      minLength: {
                        value: 4,
                        message: "Student ID must be at least 4 characters",
                      },
                    })}
                    className="h-full w-full bg-transparent px-4 pb-2 pt-8 text-base text-black outline-none"
                  />
                </div>
                {errors.studentId && (
                  <p className="mt-1 pl-2 text-xs font-semibold text-red-600">
                    {errors.studentId.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-8">
                <div
                  className={`relative h-[90px] rounded-xl border bg-transparent transition-colors ${
                    errors.password ? "border-red-500" : "border-[#9d4c52]"
                  }`}
                >
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-3 text-[14px] font-bold uppercase tracking-[3px] text-black"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="h-full w-full bg-transparent px-4 pb-2 pt-8 text-base text-black outline-none"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 pl-2 text-xs font-semibold text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-full bg-[#97191d] px-16 py-3 text-sm font-bold tracking-[3px] text-white transition-all duration-300 hover:bg-[#7d1417] disabled:opacity-50"
                >
                  {isSubmitting ? "LOGGING IN..." : "LOG IN"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mx-auto mt-10 w-[90%] border-t border-[#9d4c52]" />

            {/* Forgot Password */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="cursor-pointer text-sm tracking-[2px] text-gray-700 transition-colors hover:text-[#97191d]"
              >
                Forgot Password
              </button>
            </div>

            {/* Google Login */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#9d4c52] px-8 py-3 transition-all hover:bg-white"
              >
                <FcGoogle size={28} />
                <span className="text-sm tracking-[2px] text-gray-700">
                  Sign in with Google
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
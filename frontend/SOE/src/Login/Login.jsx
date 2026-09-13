import React from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import PageBackground from "../components/PageBackground";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif"; // Imported the OASIS GIF logo
import { useStudents } from "../context/StudentsContext";

export default function LoginPage({ onLoginSuccess }) {
  const { authenticate } = useStudents();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      studentId: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    const result = authenticate(data.studentId, data.password);
    if (!result.ok) {
      setError("root", { type: "manual", message: result.message });
      return;
    }
    onLoginSuccess?.(result.student);
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-24">
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-12 lg:flex-row lg:gap-44">
          {/* LEFT SIDE: Brand & Institutions */}
          <div className="flex w-full max-w-[420px] flex-col items-center text-center">
            <img
              src={aces_logo}
              alt="ACES Logo"
              className="mb-6 h-auto w-90 max-w-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
            />

            <h2 className="text-base font-bold tracking-[3px] text-white">
              DR. YANGA'S COLLEGES, INC.
            </h2>

            <p className="mt-2 text-sm uppercase tracking-[3px] text-gray-300">
              COLLEGE OF COMPUTER STUDIES
            </p>

            <p className="mt-1 text-sm uppercase tracking-[3px] text-gray-300">
              ASSOCIATION OF COMPUTER ENTHUSIAST STUDENTS
            </p>
          </div>

          {/* RIGHT SIDE: Glassmorphism Translucent Login Card */}
          <div className="w-full max-w-[720px] rounded-[30px] border border-white/20 bg-white/10 px-8 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-10">
            {/* OASIS GIF Logo Container */}
            <div className="mb-8 flex flex-col items-center text-center">
              <img
                src={oasis_logo}
                alt="OASIS Logo"
                className="h-auto max-w-[280px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:max-w-[470px] mb-[-40px]"
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Student ID */}
              <div className="mb-6">
                <div
                  className={`relative h-[90px] rounded-xl border bg-black/20 backdrop-blur-sm transition-colors ${
                    errors.studentId ? "border-red-400" : "border-white/40"
                  }`}
                >
                  <label
                    htmlFor="studentId"
                    className="absolute left-4 top-3 text-[14px] font-bold uppercase tracking-[3px] text-white"
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
                    className="h-full w-full bg-transparent px-4 pb-2 pt-8 text-base text-white placeholder-gray-300 outline-none"
                  />
                </div>
                {errors.studentId && (
                  <p className="mt-1 pl-2 text-xs font-semibold text-red-300">
                    {errors.studentId.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-8">
                <div
                  className={`relative h-[90px] rounded-xl border bg-black/20 backdrop-blur-sm transition-colors ${
                    errors.password ? "border-red-400" : "border-white/40"
                  }`}
                >
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-3 text-[14px] font-bold uppercase tracking-[3px] text-white"
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
                    className="h-full w-full bg-transparent px-4 pb-2 pt-8 text-base text-white outline-none"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 pl-2 text-xs font-semibold text-red-300">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Root / auth error */}
              {errors.root && (
                <p className="mb-4 text-center text-xs font-semibold text-red-300">
                  {errors.root.message}
                </p>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-full bg-[#97191d] px-16 py-3 text-sm font-bold tracking-[3px] text-white transition-all duration-300 hover:bg-[#b81f25] hover:shadow-[0_0_20px_rgba(184,31,37,0.6)] disabled:opacity-50"
                >
                  {isSubmitting ? "LOGGING IN..." : "LOG IN"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mx-auto mt-10 w-[90%] border-t border-white/20" />

            {/* Forgot Password */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="cursor-pointer text-sm tracking-[2px] text-gray-200 transition-colors hover:text-white"
              >
                Forgot Password
              </button>
            </div>

            {/* Google Login */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/30 bg-black/20 px-8 py-3 transition-all hover:bg-white/20"
              >
                <FcGoogle size={28} />
                <span className="text-sm tracking-[2px] text-white">
                  Sign in with Google
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
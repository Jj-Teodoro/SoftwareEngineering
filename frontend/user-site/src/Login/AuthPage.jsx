import { useState } from "react";
import { useForm } from "react-hook-form";
import PageBackground from "../components/PageBackground";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useAuth } from "../context/AuthContext";

const inputWrapClass =
  "relative h-[74px] rounded-xl border bg-[var(--surface-2)] backdrop-blur-sm transition-colors";
const labelClass =
  "absolute left-4 top-3 text-[13px] font-bold uppercase tracking-[2px] text-[var(--text-primary)]";
const inputClass =
  "h-full w-full bg-transparent px-4 pb-2 pt-7 text-base text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [resetSent, setResetSent] = useState(false);
  const { login, forgotPassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const switchMode = (next) => {
    setMode(next);
    setResetSent(false);
    reset();
  };

  const onSubmit = async (data) => {
    if (mode === "login") {
      const result = await login(data.email, data.password);
      if (!result.ok) {
        setError("root", { type: "manual", message: result.message });
        return;
      }
      onAuthSuccess?.(result.student);
      return;
    }

    if (mode === "forgot") {
      const result = await forgotPassword(data.email);
      if (!result.ok) {
        setError("root", { type: "manual", message: result.message });
        return;
      }
      setResetSent(true);
    }
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-24">
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-12 lg:flex-row lg:gap-44">
          <div className="flex w-full max-w-[420px] flex-col items-center text-center">
            <img
              src={aces_logo}
              alt="ACES Logo"
              className="mb-6 h-auto w-90 max-w-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
            />
            <h2 className="text-base font-bold tracking-[3px] text-[var(--text-primary)]">
              DR. YANGA'S COLLEGES, INC.
            </h2>
            <p className="mt-2 text-sm uppercase tracking-[3px] text-[var(--text-muted)]">
              COLLEGE OF COMPUTER STUDIES
            </p>
            <p className="mt-1 text-sm uppercase tracking-[3px] text-[var(--text-muted)]">
              ASSOCIATION OF COMPUTER ENTHUSIAST STUDENTS
            </p>
          </div>

          <div className="w-full max-w-[720px] rounded-[30px] border border-[var(--surface-border)] bg-[var(--surface)] px-8 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md sm:px-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <img
                src={oasis_logo}
                alt="OASIS Logo"
                className="mb-[-40px] h-auto max-w-[280px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:max-w-[470px]"
              />
              <p className="text-xs font-bold uppercase tracking-[3px] text-[var(--text-muted)]">
                {mode === "login" && "Student Login"}
                {mode === "forgot" && "Reset Password"}
              </p>
            </div>

            {mode === "forgot" && resetSent ? (
              <div className="text-center">
                <p className="text-sm text-[var(--text-primary)]">
                  If that email is registered, a password reset link is on its way. Check your
                  inbox.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="mt-6 text-sm font-bold uppercase tracking-[2px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Back to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <div
                    className={`${inputWrapClass} ${
                      errors.email ? "border-red-400" : "border-[var(--surface-border)]"
                    }`}
                  >
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      className={inputClass}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 pl-2 text-xs font-semibold text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div
                      className={`${inputWrapClass} ${
                        errors.password ? "border-red-400" : "border-[var(--surface-border)]"
                      }`}
                    >
                      <label htmlFor="password" className={labelClass}>
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: { value: 6, message: "At least 6 characters" },
                        })}
                        className={inputClass}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 pl-2 text-xs font-semibold text-red-400">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                {errors.root && (
                  <p className="text-center text-xs font-semibold text-red-400">
                    {errors.root.message}
                  </p>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-full bg-[#97191d] px-16 py-3 text-sm font-bold tracking-[3px] text-white transition-all duration-300 hover:bg-[#b81f25] hover:shadow-[0_0_20px_rgba(184,31,37,0.6)] disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "PLEASE WAIT..."
                      : mode === "login"
                      ? "LOG IN"
                      : "SEND RESET LINK"}
                  </button>
                </div>
              </form>
            )}

            {mode === "login" && (
              <p className="mt-6 text-center text-xs leading-relaxed text-[var(--text-muted)]">
                First time here? Log in with the email and temporary password your admin gave
                you. You'll be asked to set your own password.
              </p>
            )}

            {!(mode === "forgot" && resetSent) && (
              <>
                <div className="mx-auto mt-10 w-[90%] border-t border-[var(--surface-border)]" />
                <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm text-[var(--text-muted)]">
                  {mode === "login" && (
                    <>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="hover:text-[var(--text-primary)]"
                      >
                        Forgot Password
                      </button>
                    </>
                  )}
                  {mode === "forgot" && (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="hover:text-[var(--text-primary)]"
                    >
                      Back to Log In
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

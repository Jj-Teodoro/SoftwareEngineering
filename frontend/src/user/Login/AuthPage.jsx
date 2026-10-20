import { useState } from "react";
import { useForm } from "react-hook-form";
import PageBackground from "../components/PageBackground";
import CyberFrame from "../components/CyberFrame";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useAuth } from "../context/AuthContext";

const labelClass =
  "absolute left-4 top-2.5 font-mono text-[11px] font-bold uppercase tracking-[3px] text-[var(--gold)]";
const inputClass =
  "h-[68px] w-full bg-transparent px-4 pb-2 pt-7 font-mono text-base tracking-wide text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none";

function Field({ id, label, error, type = "text", register, rules }) {
  return (
    <div>
      <div className={`cp-field ${error ? "cp-error" : ""}`}>
        <label htmlFor={id} className={labelClass}>
          &gt; {label}
        </label>
        <input id={id} type={type} {...register(id, rules)} className={inputClass} />
      </div>
      {error && (
        <p className="mt-1.5 pl-1 font-mono text-xs font-bold uppercase tracking-[1px] text-[var(--neon-pink)]">
          ! {error.message}
        </p>
      )}
    </div>
  );
}

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [resetSent, setResetSent] = useState(false);
  const { login, requestTempPassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "", studentId: "" },
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
      const result = await requestTempPassword(data.studentId);
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
        <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-12 lg:flex-row lg:gap-32">
          <div className="flex w-full max-w-[420px] flex-col items-center text-center">
            <img
              src={aces_logo}
              alt="ACES Logo"
              className="mb-6 h-auto w-90 max-w-full object-contain drop-shadow-[0_0_22px_rgba(242,180,0,0.35)]"
            />
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[4px] text-[var(--neon-cyan)]">
              // access terminal
            </p>
            <h2 className="cp-glitch font-display text-sm tracking-[3px] text-[var(--text-primary)]">
              DR. YANGA'S COLLEGES, INC.
            </h2>
            <p className="mt-3 font-mono text-xs uppercase tracking-[3px] text-[var(--text-muted)]">
              College of Computer Studies
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[3px] text-[var(--text-muted)]">
              Association of Computer Enthusiast Students
            </p>
            <div className="mt-6 flex w-full items-center gap-2" aria-hidden="true">
              <span className="h-[2px] w-12 bg-[var(--gold)] shadow-[0_0_8px_var(--glow)]" />
              <span className="h-px flex-1 bg-[var(--surface-border)]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[var(--neon-pink)] shadow-[0_0_8px_var(--neon-pink)]" />
            </div>
          </div>

          <CyberFrame
            className="w-full max-w-[640px]"
            innerClassName="px-8 pb-10 pt-8 sm:px-12"
            cut={30}
            tag={mode === "login" ? "sys://login" : "sys://recover"}
          >
            <div className="mb-8 flex flex-col items-center text-center">
              <img
                src={oasis_logo}
                alt="OASIS Logo"
                className="mb-[-36px] h-auto max-w-[260px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] lg:max-w-[400px]"
              />
              <p className="cp-glitch mt-1 font-display text-xs uppercase tracking-[4px] text-[var(--text-primary)]">
                {mode === "login" && "Student Login"}
                {mode === "forgot" && "Forgot Password"}
              </p>
            </div>

            {mode === "forgot" && resetSent ? (
              <div className="text-center">
                <p className="font-mono text-sm leading-relaxed text-[var(--neon-cyan)]">
                  &gt; REQUEST SENT<span className="cursor-blink">_</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-primary)]">
                  Your admin will give you a new temporary password. Log in with your usual email
                  and that password, then choose a new one.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="cp-btn-ghost mt-6 px-8 py-2.5 text-xs"
                >
                  Back to Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {mode === "forgot" ? (
                  <>
                    <p className="font-mono text-xs leading-relaxed text-[var(--text-muted)]">
                      Enter your Student ID to ask your admin for a new temporary password.
                    </p>
                    <Field
                      id="studentId"
                      label="Student ID"
                      error={errors.studentId}
                      register={register}
                      rules={{ required: "Student ID is required" }}
                    />
                  </>
                ) : (
                  <>
                    <Field
                      id="email"
                      label="Email"
                      type="email"
                      error={errors.email}
                      register={register}
                      rules={{ required: "Email is required" }}
                    />
                    <Field
                      id="password"
                      label="Password"
                      type="password"
                      error={errors.password}
                      register={register}
                      rules={{
                        required: "Password is required",
                        minLength: { value: 6, message: "At least 6 characters" },
                      }}
                    />
                  </>
                )}

                {errors.root && (
                  <p className="text-center font-mono text-xs font-bold uppercase tracking-[1px] text-[var(--neon-pink)]">
                    ! {errors.root.message}
                  </p>
                )}

                <div className="flex justify-center pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cp-btn px-14 py-3.5 text-sm"
                  >
                    {isSubmitting
                      ? "PLEASE WAIT..."
                      : mode === "login"
                      ? "LOG IN"
                      : "REQUEST PASSWORD"}
                  </button>
                </div>
              </form>
            )}

            {mode === "login" && (
              <p className="mt-6 text-center font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
                First time here? Log in with the email and temporary password your admin gave
                you. You'll be asked to set your own password.
              </p>
            )}

            {!(mode === "forgot" && resetSent) && (
              <>
                <div className="mx-auto mt-8 h-px w-[90%] bg-[var(--surface-border)]" />
                <div className="mt-4 flex flex-col items-center gap-2 text-center font-mono text-xs uppercase tracking-[2px]">
                  {mode === "login" ? (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[var(--text-muted)] transition-colors hover:text-[var(--neon-cyan)]"
                    >
                      [ Forgot Password ]
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-[var(--text-muted)] transition-colors hover:text-[var(--neon-cyan)]"
                    >
                      [ Back to Log In ]
                    </button>
                  )}
                </div>
              </>
            )}
          </CyberFrame>
        </div>
      </div>
    </PageBackground>
  );
}

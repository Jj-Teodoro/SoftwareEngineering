import { useState } from "react";
import { useForm } from "react-hook-form";
import PageBackground from "../../../components/student/PageBackground";
import AuthHero, { TypedLines } from "../../../components/student/AuthHero";
import { useAuth } from "../../../context/student/AuthContext";

function Field({ id, label, error, type = "text", register, rules, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        <span className="st-mono text-[var(--gold)]">&gt;</span> {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        {...register(id, rules)}
        className={`st-input ${error ? "st-error" : ""}`}
      />
      {error && <p className="mt-1.5 text-sm font-medium text-[var(--danger)]">! {error.message}</p>}
    </div>
  );
}

const WELCOME_LINES = [
  "> checking your points...",
  "> syncing attended events...",
  "> loading requirements...",
  "> ready when you are",
];

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
    defaultValues: { studentNumber: "", password: "", studentId: "" },
  });

  const switchMode = (next) => {
    setMode(next);
    setResetSent(false);
    reset();
  };

  const onSubmit = async (data) => {
    if (mode === "login") {
      const result = await login(data.studentNumber, data.password);
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
      <div className="flex min-h-dvh flex-col">
        <AuthHero />
        <div className="mx-auto -mt-10 w-full max-w-md flex-1 px-4 pb-10">
        <div className="st-card overflow-hidden">
          {/* terminal title bar */}
          <div
            className="flex items-center gap-2 border-b bg-gradient-to-r from-[var(--header-from)] to-[var(--header-to)] px-4 py-2.5"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="st-mono ml-2 truncate text-[11px] text-white/80">
              oasis://student/{mode === "login" ? "login" : "recover"}
            </span>
          </div>

          <div className="p-6 sm:p-7">
            <TypedLines lines={WELCOME_LINES} className="mb-3 text-[var(--series-b)]" />
            <h1 className="text-lg font-bold">
              {mode === "login" ? "Student login" : "Forgot your password?"}
            </h1>
            <p className="st-muted mt-1 text-sm">
              {mode === "login"
                ? "Log in with your student number."
                : "Ask your admin for a new temporary password."}
            </p>

            {mode === "forgot" && resetSent ? (
              <div className="mt-6">
                <p className="rounded-lg border border-[var(--ok)] p-4 text-sm leading-relaxed text-[var(--ok)]">
                  Request sent. Your admin will give you a new temporary password. Log in with your student
                  number and that password, then choose a new one.
                </p>
                <button type="button" onClick={() => switchMode("login")} className="st-btn-ghost mt-5 w-full">
                  Back to log in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                {mode === "forgot" ? (
                  <Field
                    id="studentId"
                    label="Student ID"
                    error={errors.studentId}
                    register={register}
                    rules={{ required: "Student ID is required" }}
                  />
                ) : (
                  <>
                    <Field
                      id="studentNumber"
                      label="Student number"
                      autoComplete="username"
                      error={errors.studentNumber}
                      register={register}
                      rules={{ required: "Student number is required" }}
                    />
                    <Field
                      id="password"
                      label="Password"
                      type="password"
                      autoComplete="current-password"
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
                  <p className="rounded-lg border border-[var(--danger)] p-3 text-center text-sm font-medium text-[var(--danger)]">
                    ! {errors.root.message}
                  </p>
                )}

                <button type="submit" disabled={isSubmitting} className="st-btn w-full">
                  {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Request password"}
                </button>
              </form>
            )}

            {mode === "login" && (
              <p className="st-muted mt-5 text-center text-xs leading-relaxed">
                First time here? Use the temporary password your admin gave you. You'll be asked to set your
                own.
              </p>
            )}

            {!(mode === "forgot" && resetSent) && (
              <div className="mt-5 border-t pt-4 text-center" style={{ borderColor: "var(--line)" }}>
                <button
                  type="button"
                  onClick={() => switchMode(mode === "login" ? "forgot" : "login")}
                  className="st-mono text-sm font-bold text-[var(--accent-text)] hover:underline"
                >
                  {mode === "login" ? "[ Forgot password? ]" : "[ Back to log in ]"}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PageBackground>
  );
}

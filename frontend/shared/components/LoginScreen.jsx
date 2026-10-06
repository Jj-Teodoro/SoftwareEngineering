import { useForm } from "react-hook-form";
import PageBackground from "./PageBackground.jsx";

/**
 * Staff sign-in used by both the admin and scanner sites.
 * onLogin(username, password) must resolve to { ok, message }.
 */
export default function LoginScreen({ title, logoSrc, acesSrc, onLogin }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { username: "", password: "" } });

  const onSubmit = async ({ username, password }) => {
    const result = await onLogin(username, password);
    if (!result.ok) setError("root", { type: "manual", message: result.message });
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          {acesSrc && <img src={acesSrc} alt="ACES" className="mb-5 h-24 w-24 object-contain sm:h-28 sm:w-28" />}
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Dr. Yanga's Colleges, Inc.</h2>
          <p className="label mt-2">College of Computer Studies · ACES</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="surface-accent w-full max-w-md space-y-5 p-6 sm:p-8"
        >
          <div className="flex flex-col items-center">
            <img src={logoSrc} alt="OASIS" className="h-auto w-44 object-contain" />
            <p className="label mt-1 text-gold">{title}</p>
          </div>

          <div>
            <label htmlFor="username" className="label mb-1.5 block">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className={`input h-11 ${errors.username ? "border-neon-pink" : ""}`}
              {...register("username", {
                required: "Username is required",
                minLength: { value: 4, message: "At least 4 characters" },
              })}
            />
            {errors.username && <p className="mt-1 text-xs text-neon-pink">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label mb-1.5 block">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`input h-11 ${errors.password ? "border-neon-pink" : ""}`}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
            />
            {errors.password && <p className="mt-1 text-xs text-neon-pink">{errors.password.message}</p>}
          </div>

          {errors.root && <p className="text-center text-sm font-semibold text-neon-pink">{errors.root.message}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary h-11 w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </PageBackground>
  );
}

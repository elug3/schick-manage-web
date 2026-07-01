import { useState } from "react";
import { useNavigate } from "react-router";
import { login } from "~/lib/auth";
import { useNotify } from "~/lib/notifications";

export function meta() {
  return [{ title: "Sign in | Dupli1 Admin" }];
}

export default function Login() {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate("/", { replace: true, state: { user } });
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Something went wrong",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F4F3F8] px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6D4AFF]">
            <svg className="size-6 text-white" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h10M4 17h7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1C1B1F]">
            Dupli1 Admin
          </h1>
          <p className="mt-1 text-sm text-[#6B6480]">
            Sign in to your admin account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5E3EE] bg-white p-7 shadow-[0_2px_12px_rgba(28,27,31,0.06)]"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wide text-[#6B6480]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-3 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wide text-[#6B6480]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-3 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6D4AFF] py-3 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[#9D98B3]">
          Dupli1 Management Console · Admin access only
        </p>
      </div>
    </div>
  );
}

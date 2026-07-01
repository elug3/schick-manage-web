import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ALL_ROLES,
  type AuthUser,
  formatRoles,
  getUserById,
  setUserPassword,
  setUserRoles,
  setUserStatus,
} from "~/lib/api";
import { useNotify } from "~/lib/notifications";

export function meta() {
  return [{ title: "User | Dupli1 Admin" }];
}

type DetailTab = "state" | "credentials" | "role";

const DETAIL_TABS: { label: string; value: DetailTab }[] = [
  { label: "State", value: "state" },
  { label: "Credentials", value: "credentials" },
  { label: "Role", value: "role" },
];

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("state");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getUserById(id)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setError("User not found");
          setUser(null);
          return;
        }
        setUser(found);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load user");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link to="/users" className="text-sm text-[#6D4AFF] hover:underline">
          ← Back to users
        </Link>
        <div className="rounded-2xl border border-[#E5E3EE] bg-white p-10 text-center text-[#6B6480]">
          {error ?? "User not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/users" className="text-sm text-[#6D4AFF] hover:underline">
        ← Back to users
      </Link>

      <div className="rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)] sm:p-8">
        <h1 className="text-2xl font-bold text-[#1C1B1F]">{user.email}</h1>
        <p className="mt-1 font-mono text-sm text-[#6B6480]">{user.user_id}</p>
        <p className="mt-2 text-sm text-[#6B6480]">
          Roles: {formatRoles(user.roles)}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-[#F0EEF8] pb-4">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                activeTab === tab.value
                  ? "bg-[#6D4AFF] text-white"
                  : "border border-[#E5E3EE] bg-white text-[#6B6480] hover:border-[#6D4AFF]/40",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "state" && (
            <StateTab user={user} onUpdated={setUser} />
          )}
          {activeTab === "credentials" && <CredentialsTab userId={user.user_id} />}
          {activeTab === "role" && (
            <RoleTab user={user} onUpdated={setUser} />
          )}
        </div>
      </div>
    </div>
  );
}

function StateTab({
  user,
  onUpdated,
}: {
  user: AuthUser;
  onUpdated: (user: AuthUser) => void;
}) {
  const { notify } = useNotify();
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    try {
      const updated = await setUserStatus(user.user_id, !user.is_active);
      onUpdated(updated);
      notify(updated.is_active ? "User activated" : "User deactivated");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to update status",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        {[
          ["Active", user.is_active ? "Yes" : "No"],
          ["Locked at", user.locked_at ? formatDate(user.locked_at) : "—"],
          ["Failed login attempts", String(user.failed_login_attempts)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
              {label}
            </dt>
            <dd className="mt-1 text-sm text-[#1C1B1F]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] p-4">
        <p className="text-sm text-[#6B6480]">
          Activate or deactivate this account via{" "}
          <code className="text-xs">
            PATCH /auth/api/v1/auth/users/{"{id}"}/status
          </code>
          .
        </p>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={[
            "mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60",
            user.is_active
              ? "bg-red-500 hover:bg-red-600"
              : "bg-emerald-600 hover:bg-emerald-700",
          ].join(" ")}
        >
          {saving
            ? "Saving…"
            : user.is_active
              ? "Deactivate user"
              : "Activate user"}
        </button>
      </div>
    </div>
  );
}

function CredentialsTab({ userId }: { userId: string }) {
  const { notify } = useNotify();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      notify("Passwords do not match", "error");
      return;
    }

    setSaving(true);
    try {
      await setUserPassword(userId, password);
      setPassword("");
      setConfirmPassword("");
      notify("Password updated");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to update password",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <p className="text-sm text-[#6B6480]">
        Set a new password via{" "}
        <code className="text-xs">
          PATCH /auth/api/v1/auth/users/{"{id}"}/password
        </code>
        .
      </p>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm-password"
          className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

function RoleTab({
  user,
  onUpdated,
}: {
  user: AuthUser;
  onUpdated: (user: AuthUser) => void;
}) {
  const { notify } = useNotify();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedRoles(user.roles);
  }, [user.roles]);

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      notify("Select at least one role", "error");
      return;
    }

    setSaving(true);
    try {
      const updated = await setUserRoles(user.user_id, selectedRoles);
      onUpdated(updated);
      notify("Roles updated");
    } catch (err) {
      notify(
        err instanceof Error ? err.message : "Failed to update roles",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[#6B6480]">
        Replace role assignments via{" "}
        <code className="text-xs">
          PATCH /auth/api/v1/auth/users/{"{id}"}/roles
        </code>
        .
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {ALL_ROLES.map((role) => (
          <label
            key={role}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] px-4 py-3 text-sm text-[#1C1B1F]"
          >
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
              className="size-4 rounded border-[#C8C4D8] text-[#6D4AFF] focus:ring-[#6D4AFF]/20"
            />
            <span className="font-medium">{role}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save roles"}
      </button>
    </form>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

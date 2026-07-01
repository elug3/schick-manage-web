import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  type AuthUser,
  formatRoles,
  isCustomerUser,
  isManagerUser,
  listUsers,
} from "~/lib/api";

export function meta() {
  return [{ title: "Users | Dupli1 Admin" }];
}

type UserTab = "customers" | "managers";

const TABS: { label: string; value: UserTab }[] = [
  { label: "Customers", value: "customers" },
  { label: "Managers", value: "managers" },
];

export default function Users() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserTab>("customers");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    listUsers()
      .then(setUsers)
      .catch((err) => {
        setUsers([]);
        setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      customers: users.filter(isCustomerUser).length,
      managers: users.filter(isManagerUser).length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return users.filter((user) => {
      const inTab =
        activeTab === "customers"
          ? isCustomerUser(user)
          : isManagerUser(user);
      if (!inTab) return false;
      if (!needle) return true;
      return (
        user.email.toLowerCase().includes(needle) ||
        user.user_id.toLowerCase().includes(needle) ||
        user.roles.some((role) => role.toLowerCase().includes(needle))
      );
    });
  }, [users, activeTab, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1C1B1F] sm:text-2xl">Users</h1>
          <p className="mt-0.5 text-sm text-[#6B6480]">
            Manage accounts via{" "}
            <code className="text-xs">GET /auth/api/v1/auth/users</code>
          </p>
        </div>
        <Link
          to="/users/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A38E8] active:scale-[0.98] sm:w-auto"
        >
          <PlusIcon />
          New user
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
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
            <span className="ml-1.5 opacity-70">
              ({counts[tab.value]})
            </span>
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Filter by email, ID, or role…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-xl border border-[#E5E3EE] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20"
      />

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-[#9D98B3]">
            No users found
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#F0EEF8] md:hidden">
              {filtered.map((user) => (
                <UserCard key={user.user_id} user={user} />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0EEF8] bg-[#FAFAFA] text-left">
                    {["Email", "Roles", "Status", ""].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.user_id}
                      className="border-b border-[#F0EEF8] last:border-0 hover:bg-[#FAFAFA]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#1C1B1F]">{user.email}</p>
                        <p className="mt-0.5 font-mono text-xs text-[#6B6480]">
                          {user.user_id}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6480]">
                        {formatRoles(user.roles)}
                      </td>
                      <td className="px-5 py-3.5">
                        <UserStatusBadge user={user} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/users/${encodeURIComponent(user.user_id)}`}
                          className="text-xs font-semibold text-[#6D4AFF] hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UserCard({ user }: { user: AuthUser }) {
  return (
    <div className="space-y-3 p-4">
      <div>
        <p className="font-medium text-[#1C1B1F]">{user.email}</p>
        <p className="mt-1 font-mono text-xs text-[#6B6480]">{user.user_id}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6480]">
        <span className="rounded-full bg-[#F4F3F8] px-2.5 py-1">
          {formatRoles(user.roles)}
        </span>
        <UserStatusBadge user={user} />
      </div>
      <Link
        to={`/users/${encodeURIComponent(user.user_id)}`}
        className="inline-flex text-xs font-semibold text-[#6D4AFF] hover:underline"
      >
        Details →
      </Link>
    </div>
  );
}

function UserStatusBadge({ user }: { user: AuthUser }) {
  if (user.locked_at) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Locked
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        user.is_active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600",
      ].join(" ")}
    >
      {user.is_active ? "Active" : "Inactive"}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

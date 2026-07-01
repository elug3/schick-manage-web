import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ALL_ROLES, formatRoles, getUserById, setUserPassword, setUserRoles, setUserStatus, } from "~/lib/api";
import { useNotify } from "~/lib/notifications";
export function meta() {
    return [{ title: "User | Dupli1 Admin" }];
}
const DETAIL_TABS = [
    { label: "State", value: "state" },
    { label: "Credentials", value: "credentials" },
    { label: "Role", value: "role" },
];
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";
export default function UserDetail() {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("state");
    useEffect(() => {
        if (!id)
            return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        getUserById(id)
            .then((found) => {
            if (cancelled)
                return;
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
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [id]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-32", children: _jsx("div", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) }));
    }
    if (error || !user) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { to: "/users", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to users" }), _jsx("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-10 text-center text-[#6B6480]", children: error ?? "User not found" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Link, { to: "/users", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to users" }), _jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)] sm:p-8", children: [_jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: user.email }), _jsx("p", { className: "mt-1 font-mono text-sm text-[#6B6480]", children: user.user_id }), _jsxs("p", { className: "mt-2 text-sm text-[#6B6480]", children: ["Roles: ", formatRoles(user.roles)] }), _jsx("div", { className: "mt-6 flex flex-wrap gap-2 border-b border-[#F0EEF8] pb-4", children: DETAIL_TABS.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.value), className: [
                                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                                activeTab === tab.value
                                    ? "bg-[#6D4AFF] text-white"
                                    : "border border-[#E5E3EE] bg-white text-[#6B6480] hover:border-[#6D4AFF]/40",
                            ].join(" "), children: tab.label }, tab.value))) }), _jsxs("div", { className: "mt-6", children: [activeTab === "state" && (_jsx(StateTab, { user: user, onUpdated: setUser })), activeTab === "credentials" && _jsx(CredentialsTab, { userId: user.user_id }), activeTab === "role" && (_jsx(RoleTab, { user: user, onUpdated: setUser }))] })] })] }));
}
function StateTab({ user, onUpdated, }) {
    const { notify } = useNotify();
    const [saving, setSaving] = useState(false);
    async function handleToggle() {
        setSaving(true);
        try {
            const updated = await setUserStatus(user.user_id, !user.is_active);
            onUpdated(updated);
            notify(updated.is_active ? "User activated" : "User deactivated");
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Failed to update status", "error");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("dl", { className: "grid gap-4 sm:grid-cols-2", children: [
                    ["Active", user.is_active ? "Yes" : "No"],
                    ["Locked at", user.locked_at ? formatDate(user.locked_at) : "—"],
                    ["Failed login attempts", String(user.failed_login_attempts)],
                ].map(([label, value]) => (_jsxs("div", { children: [_jsx("dt", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: label }), _jsx("dd", { className: "mt-1 text-sm text-[#1C1B1F]", children: value })] }, label))) }), _jsxs("div", { className: "rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] p-4", children: [_jsxs("p", { className: "text-sm text-[#6B6480]", children: ["Activate or deactivate this account via", " ", _jsxs("code", { className: "text-xs", children: ["PATCH /auth/api/v1/auth/users/", "{id}", "/status"] }), "."] }), _jsx("button", { type: "button", onClick: handleToggle, disabled: saving, className: [
                            "mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60",
                            user.is_active
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-emerald-600 hover:bg-emerald-700",
                        ].join(" "), children: saving
                            ? "Saving…"
                            : user.is_active
                                ? "Deactivate user"
                                : "Activate user" })] })] }));
}
function CredentialsTab({ userId }) {
    const { notify } = useNotify();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    async function handleSubmit(e) {
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
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Failed to update password", "error");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-md space-y-4", children: [_jsxs("p", { className: "text-sm text-[#6B6480]", children: ["Set a new password via", " ", _jsxs("code", { className: "text-xs", children: ["PATCH /auth/api/v1/auth/users/", "{id}", "/password"] }), "."] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "password", className: "text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: "New password" }), _jsx("input", { id: "password", type: "password", required: true, minLength: 8, value: password, onChange: (e) => setPassword(e.target.value), className: inputCls })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "confirm-password", className: "text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: "Confirm password" }), _jsx("input", { id: "confirm-password", type: "password", required: true, minLength: 8, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: inputCls })] }), _jsx("button", { type: "submit", disabled: saving, className: "rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: saving ? "Saving…" : "Update password" })] }));
}
function RoleTab({ user, onUpdated, }) {
    const { notify } = useNotify();
    const [selectedRoles, setSelectedRoles] = useState(user.roles);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setSelectedRoles(user.roles);
    }, [user.roles]);
    function toggleRole(role) {
        setSelectedRoles((current) => current.includes(role)
            ? current.filter((value) => value !== role)
            : [...current, role]);
    }
    async function handleSubmit(e) {
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
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Failed to update roles", "error");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-[#6B6480]", children: ["Replace role assignments via", " ", _jsxs("code", { className: "text-xs", children: ["PATCH /auth/api/v1/auth/users/", "{id}", "/roles"] }), "."] }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: ALL_ROLES.map((role) => (_jsxs("label", { className: "flex cursor-pointer items-center gap-3 rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] px-4 py-3 text-sm text-[#1C1B1F]", children: [_jsx("input", { type: "checkbox", checked: selectedRoles.includes(role), onChange: () => toggleRole(role), className: "size-4 rounded border-[#C8C4D8] text-[#6D4AFF] focus:ring-[#6D4AFF]/20" }), _jsx("span", { className: "font-medium", children: role })] }, role))) }), _jsx("button", { type: "submit", disabled: saving, className: "rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: saving ? "Saving…" : "Save roles" })] }));
}
function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

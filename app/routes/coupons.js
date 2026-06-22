import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { createCoupon, deleteCoupon, getCoupons, updateCoupon, } from "~/lib/api";
export function meta() {
    return [{ title: "Coupons | Schick Admin" }];
}
const EMPTY_FORM = {
    code: "",
    discount: 0.1,
    description: "",
    expires: "",
    active: true,
};
export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    useEffect(() => {
        load();
    }, []);
    function load() {
        setLoading(true);
        getCoupons()
            .then(setCoupons)
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
            .finally(() => setLoading(false));
    }
    function openCreate() {
        setEditing(null);
        setDrawerOpen(true);
    }
    function openEdit(coupon) {
        setEditing(coupon);
        setDrawerOpen(true);
    }
    async function handleSave(data) {
        if (editing) {
            const updated = await updateCoupon(editing.code, {
                discount: data.discount,
                description: data.description,
                expires: data.expires,
                active: data.active,
            });
            setCoupons((prev) => prev.map((c) => (c.code === editing.code ? updated : c)));
        }
        else {
            const created = await createCoupon({ ...data, code: data.code.trim().toUpperCase() });
            setCoupons((prev) => [created, ...prev]);
        }
        setDrawerOpen(false);
    }
    async function handleDelete(coupon) {
        await deleteCoupon(coupon.code);
        setCoupons((prev) => prev.filter((c) => c.code !== coupon.code));
        setDeleteTarget(null);
    }
    const filtered = coupons.filter((c) => !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()));
    const activeCount = coupons.filter((c) => c.active).length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: "Coupons" }), _jsx("p", { className: "mt-0.5 text-sm text-[#6B6480]", children: loading ? "Loading…" : `${activeCount} active · ${coupons.length} total` })] }), _jsxs("button", { onClick: openCreate, className: "flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A38E8] active:scale-[0.98]", children: [_jsx(PlusIcon, {}), "New Coupon"] })] }), error && (_jsx("div", { className: "rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600", children: error })), _jsxs("div", { className: "relative max-w-sm", children: [_jsx(SearchIcon, {}), _jsx("input", { type: "search", placeholder: "Search coupons\u2026", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-xl border border-[#E5E3EE] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 shadow-[0_1px_3px_rgba(28,27,31,0.04)]" })] }), _jsx("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)] overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#F0EEF8] bg-[#FAFAFA]", children: [_jsx("th", { className: "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Code" }), _jsx("th", { className: "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Discount" }), _jsx("th", { className: "hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3] md:table-cell", children: "Description" }), _jsx("th", { className: "hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3] sm:table-cell", children: "Expires" }), _jsx("th", { className: "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Status" }), _jsx("th", { className: "px-5 py-3" })] }) }), _jsx("tbody", { children: filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-5 py-16 text-center", children: _jsxs("div", { className: "flex flex-col items-center gap-2 text-[#9D98B3]", children: [_jsx(TagIcon, { className: "size-8 opacity-40" }), _jsx("p", { className: "text-sm font-medium", children: search ? "No coupons match your search" : "No coupons yet" }), !search && (_jsx("p", { className: "text-xs", children: "Create your first coupon to get started." }))] }) }) })) : ([...filtered.filter((c) => c.active), ...filtered.filter((c) => !c.active)].map((coupon) => (_jsx(CouponRow, { coupon: coupon, onEdit: () => openEdit(coupon), onDelete: () => setDeleteTarget(coupon) }, coupon.code)))) })] }) })) }), drawerOpen && (_jsx(CouponDrawer, { coupon: editing, onSave: handleSave, onClose: () => setDrawerOpen(false) })), deleteTarget && (_jsx(DeleteModal, { coupon: deleteTarget, onConfirm: () => handleDelete(deleteTarget), onCancel: () => setDeleteTarget(null) }))] }));
}
// ── Row ────────────────────────────────────────────────────────────────────────
function CouponRow({ coupon, onEdit, onDelete, }) {
    return (_jsxs("tr", { className: "border-b border-[#F0EEF8] last:border-0 hover:bg-[#FAFAFA]", children: [_jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F3F8]", children: _jsx(TagIcon, { className: "size-4 text-[#6D4AFF]" }) }), _jsx("span", { className: "font-mono text-sm font-semibold tracking-wider text-[#1C1B1F]", children: coupon.code })] }) }), _jsx("td", { className: "px-5 py-4", children: _jsxs("span", { className: "font-semibold text-[#6D4AFF]", children: [Math.round(coupon.discount * 100), "% off"] }) }), _jsx("td", { className: "hidden px-5 py-4 text-[#6B6480] md:table-cell", children: coupon.description || _jsx("span", { className: "text-[#C4C1D4]", children: "\u2014" }) }), _jsx("td", { className: "hidden px-5 py-4 sm:table-cell", children: coupon.expires ? (_jsx("span", { className: "text-[#6B6480]", children: coupon.expires })) : (_jsx("span", { className: "text-[#C4C1D4]", children: "No expiry" })) }), _jsx("td", { className: "px-5 py-4", children: _jsx(StatusBadge, { active: coupon.active }) }), _jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: onEdit, className: "rounded-lg p-2 text-[#6B6480] transition hover:bg-[#F4F3F8] hover:text-[#1C1B1F]", title: "Edit coupon", children: _jsx(EditIcon, {}) }), _jsx("button", { onClick: onDelete, className: "rounded-lg p-2 text-[#6B6480] transition hover:bg-red-50 hover:text-red-600", title: "Delete coupon", children: _jsx(TrashIcon, {}) })] }) })] }));
}
// ── Drawer ─────────────────────────────────────────────────────────────────────
function CouponDrawer({ coupon, onSave, onClose, }) {
    const [form, setForm] = useState(coupon ?? { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(null);
    const codeRef = useRef(null);
    useEffect(() => {
        codeRef.current?.focus();
    }, []);
    function set(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setErr(null);
        setSaving(true);
        try {
            await onSave(form);
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : "Something went wrong");
        }
        finally {
            setSaving(false);
        }
    }
    const isEditing = coupon !== null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[#E5E3EE] px-6 py-4", children: [_jsx("h2", { className: "text-base font-bold text-[#1C1B1F]", children: isEditing ? "Edit Coupon" : "New Coupon" }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1.5 text-[#6B6480] hover:bg-[#F4F3F8]", children: _jsx(CloseIcon, {}) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-1 flex-col overflow-y-auto", children: [_jsxs("div", { className: "flex-1 space-y-5 px-6 py-5", children: [_jsxs(Field, { label: "Coupon Code", required: true, children: [_jsx("input", { ref: codeRef, value: form.code, onChange: (e) => set("code", e.target.value), placeholder: "e.g. SUMMER30", required: true, disabled: isEditing, className: inputCls + " font-mono uppercase tracking-wider" + (isEditing ? " cursor-not-allowed opacity-60" : "") }), isEditing && (_jsx("p", { className: "mt-1 text-xs text-[#9D98B3]", children: "Code cannot be changed after creation." }))] }), _jsx(Field, { label: "Discount (%)", required: true, children: _jsx("input", { type: "number", min: 1, max: 100, step: 1, value: Math.round(form.discount * 100), onChange: (e) => set("discount", Number(e.target.value) / 100), required: true, className: inputCls }) }), _jsx(Field, { label: "Description", children: _jsx("input", { value: form.description, onChange: (e) => set("description", e.target.value), placeholder: "e.g. Summer sale \u2014 all items", className: inputCls }) }), _jsx(Field, { label: "Expires", children: _jsx("input", { value: form.expires, onChange: (e) => set("expires", e.target.value), placeholder: "e.g. Aug 31, 2026", className: inputCls }) }), _jsxs("div", { className: "flex items-center justify-between rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] px-4 py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-[#1C1B1F]", children: "Active" }), _jsx("p", { className: "text-xs text-[#6B6480]", children: "Customers can redeem this code" })] }), _jsx(Toggle, { enabled: form.active, onChange: (v) => set("active", v) })] }), err && (_jsx("div", { className: "rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600", children: err }))] }), _jsxs("div", { className: "flex gap-3 border-t border-[#E5E3EE] px-6 py-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl bg-[#6D4AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-50", children: saving ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save Changes" : "Create Coupon" })] })] })] })] }));
}
// ── Delete Modal ───────────────────────────────────────────────────────────────
function DeleteModal({ coupon, onConfirm, onCancel, }) {
    const [deleting, setDeleting] = useState(false);
    async function confirm() {
        setDeleting(true);
        onConfirm();
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl", children: [_jsx("div", { className: "mb-4 flex size-12 items-center justify-center rounded-full bg-red-100", children: _jsx(TrashIcon, { className: "size-5 text-red-600" }) }), _jsx("h3", { className: "text-base font-bold text-[#1C1B1F]", children: "Delete coupon?" }), _jsxs("p", { className: "mt-1.5 text-sm text-[#6B6480]", children: [_jsx("span", { className: "font-mono font-semibold tracking-wider text-[#1C1B1F]", children: coupon.code }), " ", "will be permanently removed. Customers holding this code will no longer be able to redeem it."] }), _jsxs("div", { className: "mt-5 flex gap-3", children: [_jsx("button", { onClick: onCancel, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { onClick: confirm, disabled: deleting, className: "flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50", children: deleting ? "Deleting…" : "Delete" })] })] }) }));
}
// ── Shared ─────────────────────────────────────────────────────────────────────
function Field({ label, required, children, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "ml-0.5 text-[#6D4AFF]", children: "*" })] }), children] }));
}
function Toggle({ enabled, onChange }) {
    return (_jsx("button", { type: "button", onClick: () => onChange(!enabled), className: [
            "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
            enabled ? "bg-[#6D4AFF]" : "bg-[#D9D6E8]",
        ].join(" "), children: _jsx("span", { className: [
                "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                enabled ? "translate-x-5" : "translate-x-0.5",
            ].join(" ") }) }));
}
function StatusBadge({ active }) {
    return active ? (_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800", children: [_jsx("span", { className: "size-1.5 rounded-full bg-emerald-500" }), "Active"] })) : (_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-[#F4F3F8] px-2.5 py-0.5 text-xs font-medium text-[#6B6480]", children: [_jsx("span", { className: "size-1.5 rounded-full bg-[#C4C1D4]" }), "Inactive"] }));
}
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";
// ── Icons ──────────────────────────────────────────────────────────────────────
function PlusIcon() {
    return (_jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M12 5v14M5 12h14", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round" }) }));
}
function TagIcon({ className }) {
    return (_jsxs("svg", { className: className ?? "size-[18px]", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M12.5 3H7a2 2 0 0 0-2 2v5.5l9.5 9.5a2 2 0 0 0 2.83 0l4.17-4.17a2 2 0 0 0 0-2.83L12.5 3Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinejoin: "round" }), _jsx("circle", { cx: "9", cy: "9", r: "1", fill: "currentColor" })] }));
}
function EditIcon() {
    return (_jsxs("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
function TrashIcon({ className }) {
    return (_jsx("svg", { className: className ?? "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}
function CloseIcon() {
    return (_jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6 6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }));
}
function SearchIcon() {
    return (_jsx("svg", { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9D98B3]", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "m20 20-4.35-4.35M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }));
}

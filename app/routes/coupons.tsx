import { useEffect, useRef, useState } from "react";
import {
  type AdminCoupon,
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "~/lib/api";

export function meta() {
  return [{ title: "Coupons | Schick Admin" }];
}

const EMPTY_FORM: AdminCoupon = {
  code: "",
  discount: 0.1,
  description: "",
  expires: "",
  active: true,
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    getCoupons()
      .then(setCoupons)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(coupon: AdminCoupon) {
    setEditing(coupon);
    setDrawerOpen(true);
  }

  async function handleSave(data: AdminCoupon) {
    if (editing) {
      const updated = await updateCoupon(editing.code, {
        discount: data.discount,
        description: data.description,
        expires: data.expires,
        active: data.active,
      });
      setCoupons((prev) => prev.map((c) => (c.code === editing.code ? updated : c)));
    } else {
      const created = await createCoupon({ ...data, code: data.code.trim().toUpperCase() });
      setCoupons((prev) => [created, ...prev]);
    }
    setDrawerOpen(false);
  }

  async function handleDelete(coupon: AdminCoupon) {
    await deleteCoupon(coupon.code);
    setCoupons((prev) => prev.filter((c) => c.code !== coupon.code));
    setDeleteTarget(null);
  }

  const filtered = coupons.filter(
    (c) =>
      !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = coupons.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1B1F]">Coupons</h1>
          <p className="mt-0.5 text-sm text-[#6B6480]">
            {loading ? "Loading…" : `${activeCount} active · ${coupons.length} total`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A38E8] active:scale-[0.98]"
        >
          <PlusIcon />
          New Coupon
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search coupons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#E5E3EE] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 shadow-[0_1px_3px_rgba(28,27,31,0.04)]"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEF8] bg-[#FAFAFA]">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">Code</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">Discount</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3] md:table-cell">Description</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3] sm:table-cell">Expires</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[#9D98B3]">
                        <TagIcon className="size-8 opacity-40" />
                        <p className="text-sm font-medium">
                          {search ? "No coupons match your search" : "No coupons yet"}
                        </p>
                        {!search && (
                          <p className="text-xs">Create your first coupon to get started.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  [...filtered.filter((c) => c.active), ...filtered.filter((c) => !c.active)].map((coupon) => (
                    <CouponRow
                      key={coupon.code}
                      coupon={coupon}
                      onEdit={() => openEdit(coupon)}
                      onDelete={() => setDeleteTarget(coupon)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawerOpen && (
        <CouponDrawer
          coupon={editing}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          coupon={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────────

function CouponRow({
  coupon,
  onEdit,
  onDelete,
}: {
  coupon: AdminCoupon;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[#F0EEF8] last:border-0 hover:bg-[#FAFAFA]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F3F8]">
            <TagIcon className="size-4 text-[#6D4AFF]" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wider text-[#1C1B1F]">
            {coupon.code}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="font-semibold text-[#6D4AFF]">
          {Math.round(coupon.discount * 100)}% off
        </span>
      </td>
      <td className="hidden px-5 py-4 text-[#6B6480] md:table-cell">
        {coupon.description || <span className="text-[#C4C1D4]">—</span>}
      </td>
      <td className="hidden px-5 py-4 sm:table-cell">
        {coupon.expires ? (
          <span className="text-[#6B6480]">{coupon.expires}</span>
        ) : (
          <span className="text-[#C4C1D4]">No expiry</span>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusBadge active={coupon.active} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-[#6B6480] transition hover:bg-[#F4F3F8] hover:text-[#1C1B1F]"
            title="Edit coupon"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-[#6B6480] transition hover:bg-red-50 hover:text-red-600"
            title="Delete coupon"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

function CouponDrawer({
  coupon,
  onSave,
  onClose,
}: {
  coupon: AdminCoupon | null;
  onSave: (data: AdminCoupon) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AdminCoupon>(
    coupon ?? { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  function set<K extends keyof AdminCoupon>(key: K, value: AdminCoupon[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await onSave(form);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isEditing = coupon !== null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E3EE] px-6 py-4">
          <h2 className="text-base font-bold text-[#1C1B1F]">
            {isEditing ? "Edit Coupon" : "New Coupon"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B6480] hover:bg-[#F4F3F8]"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-5">
            <Field label="Coupon Code" required>
              <input
                ref={codeRef}
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="e.g. SUMMER30"
                required
                disabled={isEditing}
                className={inputCls + " font-mono uppercase tracking-wider" + (isEditing ? " cursor-not-allowed opacity-60" : "")}
              />
              {isEditing && (
                <p className="mt-1 text-xs text-[#9D98B3]">Code cannot be changed after creation.</p>
              )}
            </Field>

            <Field label="Discount (%)" required>
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={Math.round(form.discount * 100)}
                onChange={(e) => set("discount", Number(e.target.value) / 100)}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="e.g. Summer sale — all items"
                className={inputCls}
              />
            </Field>

            <Field label="Expires">
              <input
                value={form.expires}
                onChange={(e) => set("expires", e.target.value)}
                placeholder="e.g. Aug 31, 2026"
                className={inputCls}
              />
            </Field>

            <div className="flex items-center justify-between rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#1C1B1F]">Active</p>
                <p className="text-xs text-[#6B6480]">Customers can redeem this code</p>
              </div>
              <Toggle enabled={form.active} onChange={(v) => set("active", v)} />
            </div>

            {err && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</div>
            )}
          </div>

          <div className="flex gap-3 border-t border-[#E5E3EE] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#6D4AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-50"
            >
              {saving ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────────────────

function DeleteModal({
  coupon,
  onConfirm,
  onCancel,
}: {
  coupon: AdminCoupon;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
          <TrashIcon className="size-5 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-[#1C1B1F]">Delete coupon?</h3>
        <p className="mt-1.5 text-sm text-[#6B6480]">
          <span className="font-mono font-semibold tracking-wider text-[#1C1B1F]">{coupon.code}</span>
          {" "}will be permanently removed. Customers holding this code will no longer be able to redeem it.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8]"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
        {label}
        {required && <span className="ml-0.5 text-[#6D4AFF]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
        enabled ? "bg-[#6D4AFF]" : "bg-[#D9D6E8]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F3F8] px-2.5 py-0.5 text-xs font-medium text-[#6B6480]">
      <span className="size-1.5 rounded-full bg-[#C4C1D4]" />
      Inactive
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

// ── Icons ──────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "size-[18px]"} viewBox="0 0 24 24" fill="none">
      <path d="M12.5 3H7a2 2 0 0 0-2 2v5.5l9.5 9.5a2 2 0 0 0 2.83 0l4.17-4.17a2 2 0 0 0 0-2.83L12.5 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "size-4"} viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9D98B3]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m20 20-4.35-4.35M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

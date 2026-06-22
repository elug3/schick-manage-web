import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  type Product,
  type ProductStatus,
  deleteProduct,
  getProducts,
  updateProduct,
  uploadProductImage,
} from "~/lib/api";

// ── types ─────────────────────────────────────────────────────────────────────

type EditSlot =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; preview: string };

export function meta() {
  return [{ title: "Products | Schick Admin" }];
}

const CATEGORIES = ["All", "bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];

type EditFormData = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  brand: string;
  color: string;
  material: string;
  status: ProductStatus;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const catMatch = activeCategory === "All" || p.category === activeCategory;
    const searchMatch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  function handleSaved(updated: Product) {
    setProducts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
  }

  async function handleDelete(product: Product) {
    await deleteProduct(product.id).catch(() => {});
    setProducts((ps) => ps.filter((p) => p.id !== product.id));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1B1F]">Products</h1>
          <p className="mt-0.5 text-sm text-[#6B6480]">
            {products.length} products total
          </p>
        </div>
        <Link
          to="/products/new"
          className="flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A38E8] active:scale-[0.98]"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Add product
        </Link>
      </div>

      {/* Category tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-[#E5E3EE] bg-white p-1 shadow-[0_1px_3px_rgba(28,27,31,0.04)]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                activeCategory === cat
                  ? "bg-[#6D4AFF] text-white shadow-sm"
                  : "text-[#6B6480] hover:bg-[#F4F3F8] hover:text-[#1C1B1F]",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative min-w-48 flex-1">
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
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E5E3EE] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 shadow-[0_1px_3px_rgba(28,27,31,0.04)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EEF8] bg-[#FAFAFA]">
                  {["Product", "Category", "Price", "Stock", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[#9D98B3]">
                      No products match your search
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={() => setEditTarget(product)}
                      onDelete={() => setDeleteTarget(product)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <ProductDrawer
          product={editTarget}
          onSaved={handleSaved}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── ProductRow ──────────────────────────────────────────────────────────────

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[#F0EEF8] last:border-0 hover:bg-[#FAFAFA]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {product.imageUrls?.[0] ? (
            <img
              src={product.imageUrls[0]}
              alt={product.name}
              className="size-10 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F3F8] text-xs font-bold text-[#6D4AFF]">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <Link
              to={`/products/${product.id}`}
              className="font-medium text-[#1C1B1F] hover:text-[#6D4AFF] hover:underline"
            >
              {product.name}
            </Link>
            {product.brand && (
              <div className="text-xs text-[#9D98B3]">{product.brand}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="capitalize text-[#6B6480]">{product.category}</span>
      </td>
      <td className="px-5 py-4 font-semibold text-[#1C1B1F]">
        ${product.price.toFixed(0)}
      </td>
      <td className="px-5 py-4">
        {product.stock === 0 ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Out of stock
          </span>
        ) : product.stock <= 5 ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Low · {product.stock}
          </span>
        ) : (
          <span className="text-[#1C1B1F]">{product.stock}</span>
        )}
      </td>
      <td className="px-5 py-4">
        <ProductStatusBadge status={product.status} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-[#6B6480] transition hover:bg-[#F4F3F8] hover:text-[#1C1B1F]"
            title="Edit"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-[#6B6480] transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── ProductDrawer ───────────────────────────────────────────────────────────

function ProductDrawer({
  product,
  onSaved,
  onClose,
}: {
  product: Product;
  onSaved: (updated: Product) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.cost ?? 0,
    stock: product.stock,
    description: product.description,
    brand: product.brand ?? "",
    color: product.color ?? "",
    material: product.material ?? "",
    status: product.status,
  });

  // Image carousel state
  const [slots, setSlots] = useState<EditSlot[]>(() =>
    (product.imageUrls ?? []).map((url) => ({ kind: "existing" as const, url }))
  );
  const [activeIdx, setActiveIdx] = useState(0);

  // Submit state
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading">("idle");
  const [uploadStep, setUploadStep] = useState({ current: 0, total: 0, pct: 0 });
  const [error, setError] = useState<string | null>(null);
  const saving = phase !== "idle";

  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInput.current?.focus(); }, []);

  function set<K extends keyof EditFormData>(key: K, value: EditFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newSlots: EditSlot[] = arr.map((file) => ({
      kind: "new" as const,
      file,
      preview: URL.createObjectURL(file),
    }));
    setSlots((prev) => {
      const next = [...prev, ...newSlots];
      setActiveIdx(next.length - 1);
      return next;
    });
  }

  function removeSlot(idx: number) {
    setSlots((prev) => {
      const s = prev[idx];
      if (s.kind === "new") URL.revokeObjectURL(s.preview);
      const next = prev.filter((_, i) => i !== idx);
      setActiveIdx((ai) => Math.min(ai, Math.max(0, next.length - 1)));
      return next;
    });
  }

  const goPrev = () => setActiveIdx((i) => (i - 1 + slots.length) % slots.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % slots.length);

  const activeSlot = slots[activeIdx] ?? null;
  const activePreview = activeSlot
    ? activeSlot.kind === "existing" ? activeSlot.url : activeSlot.preview
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("saving");
    try {
      const keepUrls = slots
        .filter((s): s is { kind: "existing"; url: string } => s.kind === "existing")
        .map((s) => s.url);
      let updated = await updateProduct(product.id, { ...form, imageUrls: keepUrls });

      const newSlots = slots.filter(
        (s): s is { kind: "new"; file: File; preview: string } => s.kind === "new"
      );
      if (newSlots.length > 0) {
        setPhase("uploading");
        for (let i = 0; i < newSlots.length; i++) {
          setUploadStep({ current: i + 1, total: newSlots.length, pct: 0 });
          updated = await uploadProductImage(product.id, newSlots[i].file, (pct) =>
            setUploadStep((s) => ({ ...s, pct }))
          );
        }
      }
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      setPhase("idle");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E3EE] px-6 py-4">
          <h2 className="text-base font-bold text-[#1C1B1F]">Edit product</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#6B6480] hover:bg-[#F4F3F8]">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-5 px-6 py-5">

            {/* ── Image carousel ─────────────────────────────────────── */}
            <Field label="Product images">
              <div className="overflow-hidden rounded-xl border border-[#E5E3EE]">
                {activePreview ? (
                  <>
                    {/* Preview */}
                    <div className="relative bg-[#F4F3F8]">
                      <img
                        key={activePreview}
                        src={activePreview}
                        alt={`Image ${activeIdx + 1}`}
                        className="max-h-52 w-full object-contain"
                      />

                      {/* Upload overlay */}
                      {phase === "uploading" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
                          <p className="text-xs font-semibold text-white">
                            Uploading {uploadStep.current}/{uploadStep.total}… {uploadStep.pct}%
                          </p>
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/30">
                            <div
                              className="h-full rounded-full bg-white transition-all"
                              style={{ width: `${uploadStep.pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Left / Right arrows */}
                      {slots.length > 1 && (
                        <>
                          <button type="button" onClick={goPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
                            <svg className="size-4" viewBox="0 0 24 24" fill="none">
                              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button type="button" onClick={goNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60">
                            <svg className="size-4" viewBox="0 0 24 24" fill="none">
                              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Remove */}
                      {phase === "idle" && (
                        <button type="button" onClick={() => removeSlot(activeIdx)}
                          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-600/80">
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}

                      {/* Dots */}
                      {slots.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                          {slots.map((_, i) => (
                            <button key={i} type="button" onClick={() => setActiveIdx(i)}
                              className={[
                                "rounded-full transition-all duration-200",
                                i === activeIdx ? "size-2 bg-white shadow" : "size-1.5 bg-white/50 hover:bg-white/75",
                              ].join(" ")}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bar */}
                    <div className="flex items-center gap-2 border-t border-[#E5E3EE] bg-white px-3 py-2">
                      <p className="min-w-0 flex-1 truncate text-xs text-[#9D98B3]">
                        {activeSlot?.kind === "new" ? activeSlot.file.name : "Saved image"}
                        {slots.length > 1 && ` · ${activeIdx + 1}/${slots.length}`}
                      </p>
                      <label className="shrink-0 cursor-pointer rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6D4AFF] hover:bg-[#EAE7F8]">
                        + Add
                        <input type="file" multiple accept="image/*" className="sr-only"
                          onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />
                      </label>
                    </div>
                  </>
                ) : (
                  /* Empty */
                  <label className="flex cursor-pointer flex-col items-center gap-2 bg-[#FAFAFA] py-8">
                    <svg className="size-8 text-[#C4C1D4]" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-medium text-[#6D4AFF]">Upload images</p>
                    <p className="text-xs text-[#9D98B3]">JPEG · PNG · WebP · TIFF</p>
                    <input type="file" multiple accept="image/*" className="sr-only"
                      onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />
                  </label>
                )}
              </div>
            </Field>

            <Field label="Product name" required>
              <input
                ref={firstInput}
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Milanese Leather Tote"
                className={inputCls}
              />
            </Field>

            <Field label="Category" required>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.slice(1).map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProductStatus)}
                className={inputCls}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Price (USD)" required>
                <input
                  type="number" min={0} step={1} required
                  value={form.price || ""}
                  onChange={(e) => set("price", Number(e.target.value))}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="First Cost (USD)">
                <input
                  type="number" min={0} step={1}
                  value={form.cost || ""}
                  onChange={(e) => set("cost", Number(e.target.value))}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Stock" required>
                <input
                  type="number" min={0} step={1} required
                  value={form.stock || ""}
                  onChange={(e) => set("stock", Number(e.target.value))}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Brand">
              <input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="e.g. Schick"
                className={inputCls}
              />
            </Field>

            <Field label="Color">
              <input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="e.g. Cognac"
                className={inputCls}
              />
            </Field>

            <Field label="Material">
              <input
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
                placeholder="e.g. Leather"
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short product description…"
                className={inputCls + " resize-none"}
              />
            </Field>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
          </div>

          <div className="flex gap-3 border-t border-[#E5E3EE] px-6 py-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl bg-[#6D4AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {phase === "uploading"
                    ? `Uploading ${uploadStep.current}/${uploadStep.total} (${uploadStep.pct}%)…`
                    : "Saving…"}
                </span>
              ) : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── DeleteModal ─────────────────────────────────────────────────────────────

function DeleteModal({
  product,
  onConfirm,
  onCancel,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <TrashIcon className="size-5 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-[#1C1B1F]">Delete product</h3>
        <p className="mt-1.5 text-sm text-[#6B6480]">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#1C1B1F]">{product.name}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared ──────────────────────────────────────────────────────────────────

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

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-emerald-100 text-emerald-800" },
    draft: { label: "Draft", class: "bg-amber-100 text-amber-800" },
    archived: { label: "Archived", class: "bg-slate-100 text-slate-600" },
  };
  const { label, class: cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

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

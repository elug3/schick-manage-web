import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  type Product,
  type ProductStatus,
  deleteProduct,
  getProduct,
  updateProduct,
  uploadProductImage,
} from "~/lib/api";

export function meta() {
  return [{ title: "Product Detail | Schick Admin" }];
}

// ── types shared with edit drawer ────────────────────────────────────────────

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

type EditSlot =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; preview: string };

const CATEGORIES = ["bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];

// ── page ─────────────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [carouselIdx, setCarouselIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then((p) => { setProduct(p); setCarouselIdx(0); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    await deleteProduct(product.id).catch(() => {});
    navigate("/products");
  }

  function handleSaved(updated: Product) {
    setProduct(updated);
    setEditing(false);
  }

  // ── carousel ───────────────────────────────────────────────────────────────

  const images = product?.imageUrls ?? [];
  const hasImages = images.length > 0;
  const goPrev = () => setCarouselIdx((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setCarouselIdx((i) => (i + 1) % images.length);

  // ── loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="size-8 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-40 text-center">
        <p className="text-lg font-semibold text-[#1C1B1F]">Product not found</p>
        <Link to="/products" className="text-sm text-[#6D4AFF] hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const statusMap: Record<ProductStatus, { label: string; cls: string }> = {
    active:   { label: "Active",   cls: "bg-emerald-100 text-emerald-800" },
    draft:    { label: "Draft",    cls: "bg-amber-100 text-amber-800" },
    archived: { label: "Archived", cls: "bg-slate-100 text-slate-600" },
  };
  const status = statusMap[product.status as ProductStatus] ?? statusMap.draft;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#9D98B3]">
          <Link to="/products" className="flex items-center gap-1.5 transition hover:text-[#6D4AFF]">
            <svg className="size-4" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Products
          </Link>
          <span>/</span>
          <span className="max-w-xs truncate text-[#1C1B1F]">{product.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-xl border border-[#E5E3EE] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B1F] shadow-sm transition hover:bg-[#F4F3F8]"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Left: image carousel ───────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
          {hasImages ? (
            <>
              {/* Main image */}
              <div className="relative bg-[#F4F3F8]">
                <img
                  key={images[carouselIdx]}
                  src={images[carouselIdx]}
                  alt={`${product.name} — image ${carouselIdx + 1}`}
                  className="aspect-[3/4] w-full object-contain"
                />

                {/* Left arrow */}
                {images.length > 1 && (
                  <button
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  >
                    <svg className="size-5" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}

                {/* Right arrow */}
                {images.length > 1 && (
                  <button
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                  >
                    <svg className="size-5" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}

                {/* Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        className={[
                          "rounded-full transition-all duration-200",
                          i === carouselIdx
                            ? "size-2.5 bg-white shadow"
                            : "size-1.5 bg-white/50 hover:bg-white/80",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute right-3 bottom-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {carouselIdx + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setCarouselIdx(i)}
                      className={[
                        "shrink-0 size-16 overflow-hidden rounded-xl border-2 transition",
                        i === carouselIdx
                          ? "border-[#6D4AFF]"
                          : "border-transparent opacity-60 hover:opacity-100",
                      ].join(" ")}
                    >
                      <img src={url} alt={`Thumbnail ${i + 1}`} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* No image placeholder */
            <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 bg-[#F4F3F8]">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                <svg className="size-8 text-[#C4C1D4]" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-[#9D98B3]">No images yet</p>
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-[#6D4AFF] hover:underline"
              >
                Add images via Edit
              </button>
            </div>
          )}
        </div>

        {/* ── Right: product details ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Header card */}
          <div className="rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>
                <span className="size-1.5 rounded-full bg-current" />
                {status.label}
              </span>
              <span className="font-mono text-xs text-[#B4B0C8]">{product.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1C1B1F]">{product.name}</h1>
            {product.brand && (
              <p className="mt-1 text-sm text-[#6B6480]">{product.brand}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {product.category && (
                <span className="rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold capitalize text-[#6B6480]">
                  {product.category}
                </span>
              )}
              {product.color && (
                <span className="rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6B6480]">
                  {product.color}
                </span>
              )}
              {product.material && (
                <span className="rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6B6480]">
                  {product.material}
                </span>
              )}
            </div>
          </div>

          {/* Pricing & stock */}
          <div className="rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
              Pricing & inventory
            </p>
            <div className="grid grid-cols-3 gap-4">
              <StatBox label="Price" value={`$${product.price.toLocaleString()}`} />
              <StatBox
                label="First Cost"
                value={product.cost ? `$${product.cost.toLocaleString()}` : "—"}
              />
              <StatBox
                label="Stock"
                value={String(product.stock)}
                highlight={
                  product.stock === 0
                    ? "red"
                    : product.stock <= 5
                    ? "amber"
                    : undefined
                }
              />
            </div>
            {product.cost != null && product.cost > 0 && product.price > 0 && (
              <div className="mt-4 border-t border-[#F0EEF8] pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9D98B3]">Margin</span>
                  <span className="font-semibold text-[#1C1B1F]">
                    {(((product.price - product.cost) / product.price) * 100).toFixed(1)}%
                    <span className="ml-1.5 text-xs font-normal text-[#9D98B3]">
                      (${(product.price - product.cost).toLocaleString()} per unit)
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
                Description
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C1B1F]">
                {product.description}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
              Details
            </p>
            <dl className="space-y-2.5 text-sm">
              <MetaRow label="ID" value={product.id} mono />
              <MetaRow label="Created" value={new Date(product.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              {product.brand    && <MetaRow label="Brand"    value={product.brand} />}
              {product.color    && <MetaRow label="Color"    value={product.color} />}
              {product.material && <MetaRow label="Material" value={product.material} />}
              {product.category && <MetaRow label="Category" value={product.category} />}
              <MetaRow label="Images" value={`${(product.imageUrls ?? []).length} image${(product.imageUrls ?? []).length !== 1 ? "s" : ""}`} />
            </dl>
          </div>
        </div>
      </div>

      {/* Edit drawer */}
      {editing && (
        <ProductEditDrawer
          product={product}
          onSaved={handleSaved}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <DeleteModal
          productName={product.name}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

// ── StatBox ───────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "red" | "amber";
}) {
  const valueColor =
    highlight === "red"
      ? "text-red-600"
      : highlight === "amber"
      ? "text-amber-700"
      : "text-[#1C1B1F]";
  return (
    <div className="rounded-xl bg-[#F8F7FC] px-4 py-3">
      <p className="text-xs text-[#9D98B3]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

// ── MetaRow ───────────────────────────────────────────────────────────────────

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[#9D98B3]">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-[#1C1B1F] ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

// ── ProductEditDrawer ─────────────────────────────────────────────────────────

function ProductEditDrawer({
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

  const [slots, setSlots] = useState<EditSlot[]>(() =>
    (product.imageUrls ?? []).map((url) => ({ kind: "existing" as const, url }))
  );
  const [activeIdx, setActiveIdx] = useState(0);

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
      kind: "new" as const, file,
      preview: URL.createObjectURL(file),
    }));
    setSlots((prev) => { const next = [...prev, ...newSlots]; setActiveIdx(next.length - 1); return next; });
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
      setError(err instanceof Error ? err.message : "Failed to save");
      setPhase("idle");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
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

            {/* Images carousel */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
                Product images
              </label>
              <div className="overflow-hidden rounded-xl border border-[#E5E3EE]">
                {activePreview ? (
                  <>
                    <div className="relative bg-[#F4F3F8]">
                      <img key={activePreview} src={activePreview} alt={`Image ${activeIdx + 1}`}
                        className="max-h-52 w-full object-contain" />
                      {phase === "uploading" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm">
                          <p className="text-xs font-semibold text-white">
                            Uploading {uploadStep.current}/{uploadStep.total}… {uploadStep.pct}%
                          </p>
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/30">
                            <div className="h-full rounded-full bg-white transition-all"
                              style={{ width: `${uploadStep.pct}%` }} />
                          </div>
                        </div>
                      )}
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
                      {phase === "idle" && (
                        <button type="button" onClick={() => removeSlot(activeIdx)}
                          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-600/80">
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                      {slots.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                          {slots.map((_, i) => (
                            <button key={i} type="button" onClick={() => setActiveIdx(i)}
                              className={["rounded-full transition-all duration-200",
                                i === activeIdx ? "size-2 bg-white shadow" : "size-1.5 bg-white/50 hover:bg-white/75"].join(" ")} />
                          ))}
                        </div>
                      )}
                    </div>
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
                  <label className="flex cursor-pointer flex-col items-center gap-2 bg-[#FAFAFA] py-8">
                    <svg className="size-8 text-[#C4C1D4]" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm font-medium text-[#6D4AFF]">Upload images</p>
                    <input type="file" multiple accept="image/*" className="sr-only"
                      onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ""; } }} />
                  </label>
                )}
              </div>
            </div>

            {/* Form fields */}
            <Field label="Product name" required>
              <input ref={firstInput} required value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Milanese Leather Tote" className={inputCls} />
            </Field>

            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value as ProductStatus)} className={inputCls}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Price (USD)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]">$</span>
                  <input type="number" min={0} step={1} required value={form.price || ""}
                    onChange={(e) => set("price", Number(e.target.value))} placeholder="0" className={inputCls + " pl-6"} />
                </div>
              </Field>
              <Field label="First Cost">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]">$</span>
                  <input type="number" min={0} step={1} value={form.cost || ""}
                    onChange={(e) => set("cost", Number(e.target.value))} placeholder="0" className={inputCls + " pl-6"} />
                </div>
              </Field>
              <Field label="Stock" required>
                <input type="number" min={0} step={1} required value={form.stock || ""}
                  onChange={(e) => set("stock", Number(e.target.value))} placeholder="0" className={inputCls} />
              </Field>
            </div>

            <Field label="Brand">
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Schick" className={inputCls} />
            </Field>
            <Field label="Color">
              <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Cognac" className={inputCls} />
            </Field>
            <Field label="Material">
              <input value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Leather" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea rows={3} value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short product description…" className={inputCls + " resize-none"} />
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
                    ? `Uploading ${uploadStep.current}/${uploadStep.total}…`
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

// ── DeleteModal ───────────────────────────────────────────────────────────────

function DeleteModal({
  productName,
  deleting,
  onConfirm,
  onCancel,
}: {
  productName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
          <svg className="size-5 text-red-600" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-[#1C1B1F]">Delete product</h3>
        <p className="mt-1.5 text-sm text-[#6B6480]">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#1C1B1F]">{productName}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── shared ────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
        {label}{required && <span className="ml-0.5 text-[#6D4AFF]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

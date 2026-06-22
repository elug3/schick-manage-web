import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { type ProductStatus, createProduct, uploadProductImage } from "~/lib/api";

export function meta() {
  return [{ title: "New Product | Schick Admin" }];
}

const CATEGORIES = ["bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];

type FormData = {
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

const EMPTY: FormData = {
  name: "",
  category: "bags",
  price: 0,
  cost: 0,
  stock: 0,
  description: "",
  brand: "",
  color: "",
  material: "",
  status: "active",
};

type ImageEntry = {
  file: File;
  preview: string;
  dims: { w: number; h: number } | null;
};

function readDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export default function NewProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(EMPTY);

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const emptyInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"idle" | "creating" | "uploading">("idle");
  const [uploadStep, setUploadStep] = useState({ current: 0, total: 0, pct: 0 });
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const saving = phase !== "idle";

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const entries: ImageEntry[] = arr.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      dims: null,
    }));
    setImages((prev) => {
      const next = [...prev, ...entries];
      setActiveIdx(next.length - 1);
      return next;
    });
    for (let i = 0; i < entries.length; i++) {
      const dims = await readDims(entries[i].file);
      const capturedI = i;
      setImages((prev) => {
        const next = [...prev];
        const slot = prev.length - arr.length + capturedI;
        if (next[slot]) next[slot] = { ...next[slot], dims };
        return next;
      });
    }
  }, []);

  function removeImage(idx: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      const next = prev.filter((_, i) => i !== idx);
      setActiveIdx((ai) => Math.min(ai, Math.max(0, next.length - 1)));
      return next;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function handleDragLeave(e: React.DragEvent) {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  const goPrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveIdx((i) => (i + 1) % images.length);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUploadWarning(null);
    setPhase("creating");

    // Step 1 — POST /api/products
    let createdId: string;
    try {
      const created = await createProduct(form);
      createdId = created.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      setPhase("idle");
      return;
    }

    // Step 2 — PUT /api/products/{id}/image (once per selected image)
    if (images.length > 0) {
      setPhase("uploading");
      for (let i = 0; i < images.length; i++) {
        setUploadStep({ current: i + 1, total: images.length, pct: 0 });
        try {
          await uploadProductImage(createdId, images[i].file, (pct) =>
            setUploadStep((s) => ({ ...s, pct }))
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          const hint = msg.includes("502") || msg.includes("Network")
            ? "The server timed out — restart schick-product and try again."
            : msg;
          // Product was created; warn but still navigate so it's not lost.
          setUploadWarning(
            `Image ${i + 1}/${images.length} failed: ${hint} The product was saved without that image.`
          );
          setPhase("idle");
          setTimeout(() => navigate("/products"), 3500);
          return;
        }
      }
    }

    navigate("/products");
  }

  const submitLabel =
    phase === "creating" ? "Creating…"
    : phase === "uploading"
      ? `Uploading ${uploadStep.current}/${uploadStep.total} (${uploadStep.pct}%)`
    : "Create product";

  const active = images[activeIdx] ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#9D98B3]">
        <Link to="/products" className="flex items-center gap-1.5 transition hover:text-[#6D4AFF]">
          <svg className="size-4" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Products
        </Link>
        <span>/</span>
        <span className="text-[#1C1B1F]">New product</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#1C1B1F]">New product</h1>
        <p className="mt-0.5 text-sm text-[#6B6480]">Fill in the details below to add a product to your catalog.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]">

          {/* ── Images ──────────────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">Product images</p>
          </div>

          <div
            ref={dropZoneRef}
            className="mx-6 mb-5 overflow-hidden rounded-2xl border-2 transition"
            style={{ borderColor: dragOver ? "#6D4AFF" : "#E5E3EE" }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {images.length === 0 ? (
              /* Empty state */
              <div
                className="flex cursor-pointer flex-col items-center gap-3 bg-[#FAFAFA] px-6 py-14"
                style={{ background: dragOver ? "rgba(109,74,255,0.04)" : undefined }}
                onClick={() => emptyInputRef.current?.click()}
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <UploadIcon className="size-7 text-[#9D98B3]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#1C1B1F]">
                    Drag & drop or <span className="text-[#6D4AFF]">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-[#9D98B3]">JPEG · PNG · WebP · TIFF</p>
                  <p className="mt-0.5 text-xs text-[#B4B0C8]">Recommended: 3000 × 4000 px · up to 50 MB</p>
                </div>
                <input ref={emptyInputRef} type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
              </div>
            ) : (
              <>
                {/* Main preview */}
                <div className="relative bg-[#F4F3F8]">
                  <img
                    key={active.preview}
                    src={active.preview}
                    alt={`Image ${activeIdx + 1}`}
                    className="max-h-[480px] w-full object-contain"
                  />

                  {/* Upload progress overlay */}
                  {phase === "uploading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm">
                      <p className="text-sm font-semibold text-white">
                        Uploading {uploadStep.current} / {uploadStep.total}… {uploadStep.pct}%
                      </p>
                      <div className="h-1.5 w-52 overflow-hidden rounded-full bg-white/30">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-200"
                          style={{ width: `${uploadStep.pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Left / Right arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button" onClick={goPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65"
                      >
                        <svg className="size-5" viewBox="0 0 24 24" fill="none">
                          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        type="button" onClick={goNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65"
                      >
                        <svg className="size-5" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Remove button */}
                  {phase === "idle" && (
                    <button
                      type="button" onClick={() => removeImage(activeIdx)}
                      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-red-600/80"
                      title="Remove this image"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}

                  {/* Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i} type="button" onClick={() => setActiveIdx(i)}
                          className={[
                            "rounded-full transition-all duration-200",
                            i === activeIdx
                              ? "size-2 bg-white shadow"
                              : "size-1.5 bg-white/50 hover:bg-white/75",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Info bar */}
                <div className="flex items-center gap-3 border-t border-[#E5E3EE] bg-white px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1C1B1F]">{active.file.name}</p>
                    <p className="text-xs text-[#9D98B3]">
                      {active.dims && active.dims.w > 0
                        ? `${active.dims.w.toLocaleString()} × ${active.dims.h.toLocaleString()} px · `
                        : ""}
                      {(active.file.size / 1_000_000).toFixed(1)} MB
                      {images.length > 1 && ` · ${activeIdx + 1} of ${images.length}`}
                    </p>
                  </div>
                  {active.dims && active.dims.w >= 3000 && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      High res ✓
                    </span>
                  )}
                  {active.dims && active.dims.w > 0 && active.dims.w < 3000 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                      Recommended 3000+ px
                    </span>
                  )}
                  <label className="shrink-0 cursor-pointer rounded-lg bg-[#F4F3F8] px-3 py-1.5 text-xs font-semibold text-[#6D4AFF] transition hover:bg-[#EAE7F8]">
                    + Add more
                    <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                  </label>
                </div>
              </>
            )}
          </div>

          <Divider />

          {/* ── Basic info ───────────────────────────────────────────────── */}
          <Section title="Basic info">
            <Field label="Product name" required>
              <input
                autoFocus required
                value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Milanese Leather Tote" className={inputCls}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Short product description…" className={inputCls + " resize-none"}
              />
            </Field>
          </Section>

          <Divider />

          {/* ── Classification ───────────────────────────────────────────── */}
          <Section title="Classification">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
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
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Brand">
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Schick" className={inputCls} />
              </Field>
              <Field label="Color">
                <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Cognac" className={inputCls} />
              </Field>
              <Field label="Material">
                <input value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Leather" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Divider />

          {/* ── Pricing & inventory ──────────────────────────────────────── */}
          <Section title="Pricing & inventory">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Price (USD)" required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]">$</span>
                  <input type="number" min={0} step={1} required value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="0" className={inputCls + " pl-7"} />
                </div>
              </Field>
              <Field label="First Cost (USD)">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]">$</span>
                  <input type="number" min={0} step={1} value={form.cost || ""} onChange={(e) => set("cost", Number(e.target.value))} placeholder="0" className={inputCls + " pl-7"} />
                </div>
              </Field>
              <Field label="Stock" required>
                <input type="number" min={0} step={1} required value={form.stock || ""} onChange={(e) => set("stock", Number(e.target.value))} placeholder="0" className={inputCls} />
              </Field>
            </div>
          </Section>

          {error && (
            <div className="mx-6 mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {uploadWarning && (
            <div className="mx-6 mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Image upload failed.</span> {uploadWarning}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#E5E3EE] px-6 py-4">
            <Link
              to="/products"
              className="rounded-xl border border-[#E5E3EE] px-5 py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]"
            >
              Cancel
            </Link>
            <button
              type="submit" disabled={saving}
              className="min-w-[160px] rounded-xl bg-[#6D4AFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60 active:scale-[0.98]"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {submitLabel}
                </span>
              ) : "Create product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── shared helpers ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Divider() { return <div className="border-t border-[#F0EEF8]" />; }

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

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

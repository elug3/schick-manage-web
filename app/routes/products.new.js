import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createProduct, uploadProductImage } from "~/lib/api";
export function meta() {
    return [{ title: "New Product | Schick Admin" }];
}
const CATEGORIES = ["bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];
const EMPTY = {
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
function readDims(file) {
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
    const [form, setForm] = useState(EMPTY);
    const [images, setImages] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const dropZoneRef = useRef(null);
    const emptyInputRef = useRef(null);
    const [phase, setPhase] = useState("idle");
    const [uploadStep, setUploadStep] = useState({ current: 0, total: 0, pct: 0 });
    const [error, setError] = useState(null);
    const [uploadWarning, setUploadWarning] = useState(null);
    const saving = phase !== "idle";
    function set(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }
    const addFiles = useCallback(async (files) => {
        const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!arr.length)
            return;
        const entries = arr.map((file) => ({
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
                if (next[slot])
                    next[slot] = { ...next[slot], dims };
                return next;
            });
        }
    }, []);
    function removeImage(idx) {
        setImages((prev) => {
            URL.revokeObjectURL(prev[idx].preview);
            const next = prev.filter((_, i) => i !== idx);
            setActiveIdx((ai) => Math.min(ai, Math.max(0, next.length - 1)));
            return next;
        });
    }
    function handleFileChange(e) {
        if (e.target.files?.length)
            addFiles(e.target.files);
        e.target.value = "";
    }
    function handleDragOver(e) { e.preventDefault(); setDragOver(true); }
    function handleDragLeave(e) {
        if (!dropZoneRef.current?.contains(e.relatedTarget))
            setDragOver(false);
    }
    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length)
            addFiles(e.dataTransfer.files);
    }
    const goPrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
    const goNext = () => setActiveIdx((i) => (i + 1) % images.length);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setUploadWarning(null);
        setPhase("creating");
        // Step 1 — POST /api/products
        let createdId;
        try {
            const created = await createProduct(form);
            createdId = created.id;
        }
        catch (err) {
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
                    await uploadProductImage(createdId, images[i].file, (pct) => setUploadStep((s) => ({ ...s, pct })));
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : "Upload failed";
                    const hint = msg.includes("502") || msg.includes("Network")
                        ? "The server timed out — restart schick-product and try again."
                        : msg;
                    // Product was created; warn but still navigate so it's not lost.
                    setUploadWarning(`Image ${i + 1}/${images.length} failed: ${hint} The product was saved without that image.`);
                    setPhase("idle");
                    setTimeout(() => navigate("/products"), 3500);
                    return;
                }
            }
        }
        navigate("/products");
    }
    const submitLabel = phase === "creating" ? "Creating…"
        : phase === "uploading"
            ? `Uploading ${uploadStep.current}/${uploadStep.total} (${uploadStep.pct}%)`
            : "Create product";
    const active = images[activeIdx] ?? null;
    return (_jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-[#9D98B3]", children: [_jsxs(Link, { to: "/products", className: "flex items-center gap-1.5 transition hover:text-[#6D4AFF]", children: [_jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Products"] }), _jsx("span", { children: "/" }), _jsx("span", { className: "text-[#1C1B1F]", children: "New product" })] }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: "New product" }), _jsx("p", { className: "mt-0.5 text-sm text-[#6B6480]", children: "Fill in the details below to add a product to your catalog." })] }), _jsx("form", { onSubmit: handleSubmit, children: _jsxs("div", { className: "overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsx("div", { className: "px-6 pt-5 pb-2", children: _jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Product images" }) }), _jsx("div", { ref: dropZoneRef, className: "mx-6 mb-5 overflow-hidden rounded-2xl border-2 transition", style: { borderColor: dragOver ? "#6D4AFF" : "#E5E3EE" }, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: images.length === 0 ? (
                            /* Empty state */
                            _jsxs("div", { className: "flex cursor-pointer flex-col items-center gap-3 bg-[#FAFAFA] px-6 py-14", style: { background: dragOver ? "rgba(109,74,255,0.04)" : undefined }, onClick: () => emptyInputRef.current?.click(), children: [_jsx("div", { className: "flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm", children: _jsx(UploadIcon, { className: "size-7 text-[#9D98B3]" }) }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-sm font-semibold text-[#1C1B1F]", children: ["Drag & drop or ", _jsx("span", { className: "text-[#6D4AFF]", children: "browse" })] }), _jsx("p", { className: "mt-1 text-xs text-[#9D98B3]", children: "JPEG \u00B7 PNG \u00B7 WebP \u00B7 TIFF" }), _jsx("p", { className: "mt-0.5 text-xs text-[#B4B0C8]", children: "Recommended: 3000 \u00D7 4000 px \u00B7 up to 50 MB" })] }), _jsx("input", { ref: emptyInputRef, type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: handleFileChange })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative bg-[#F4F3F8]", children: [_jsx("img", { src: active.preview, alt: `Image ${activeIdx + 1}`, className: "max-h-[480px] w-full object-contain" }, active.preview), phase === "uploading" && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-sm", children: [_jsxs("p", { className: "text-sm font-semibold text-white", children: ["Uploading ", uploadStep.current, " / ", uploadStep.total, "\u2026 ", uploadStep.pct, "%"] }), _jsx("div", { className: "h-1.5 w-52 overflow-hidden rounded-full bg-white/30", children: _jsx("div", { className: "h-full rounded-full bg-white transition-all duration-200", style: { width: `${uploadStep.pct}%` } }) })] })), images.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: goPrev, className: "absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "button", onClick: goNext, className: "absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/65", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })), phase === "idle" && (_jsx("button", { type: "button", onClick: () => removeImage(activeIdx), className: "absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-red-600/80", title: "Remove this image", children: _jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })), images.length > 1 && (_jsx("div", { className: "absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5", children: images.map((_, i) => (_jsx("button", { type: "button", onClick: () => setActiveIdx(i), className: [
                                                        "rounded-full transition-all duration-200",
                                                        i === activeIdx
                                                            ? "size-2 bg-white shadow"
                                                            : "size-1.5 bg-white/50 hover:bg-white/75",
                                                    ].join(" ") }, i))) }))] }), _jsxs("div", { className: "flex items-center gap-3 border-t border-[#E5E3EE] bg-white px-4 py-2.5", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm font-medium text-[#1C1B1F]", children: active.file.name }), _jsxs("p", { className: "text-xs text-[#9D98B3]", children: [active.dims && active.dims.w > 0
                                                                ? `${active.dims.w.toLocaleString()} × ${active.dims.h.toLocaleString()} px · `
                                                                : "", (active.file.size / 1_000_000).toFixed(1), " MB", images.length > 1 && ` · ${activeIdx + 1} of ${images.length}`] })] }), active.dims && active.dims.w >= 3000 && (_jsx("span", { className: "shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700", children: "High res \u2713" })), active.dims && active.dims.w > 0 && active.dims.w < 3000 && (_jsx("span", { className: "shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700", children: "Recommended 3000+ px" })), _jsxs("label", { className: "shrink-0 cursor-pointer rounded-lg bg-[#F4F3F8] px-3 py-1.5 text-xs font-semibold text-[#6D4AFF] transition hover:bg-[#EAE7F8]", children: ["+ Add more", _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: handleFileChange })] })] })] })) }), _jsx(Divider, {}), _jsxs(Section, { title: "Basic info", children: [_jsx(Field, { label: "Product name", required: true, children: _jsx("input", { autoFocus: true, required: true, value: form.name, onChange: (e) => set("name", e.target.value), placeholder: "e.g. Milanese Leather Tote", className: inputCls }) }), _jsx(Field, { label: "Description", children: _jsx("textarea", { rows: 3, value: form.description, onChange: (e) => set("description", e.target.value), placeholder: "Short product description\u2026", className: inputCls + " resize-none" }) })] }), _jsx(Divider, {}), _jsxs(Section, { title: "Classification", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Field, { label: "Category", required: true, children: _jsx("select", { value: form.category, onChange: (e) => set("category", e.target.value), className: inputCls, children: CATEGORIES.map((c) => (_jsx("option", { value: c, children: c.charAt(0).toUpperCase() + c.slice(1) }, c))) }) }), _jsx(Field, { label: "Status", children: _jsxs("select", { value: form.status, onChange: (e) => set("status", e.target.value), className: inputCls, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] }) })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Field, { label: "Brand", children: _jsx("input", { value: form.brand, onChange: (e) => set("brand", e.target.value), placeholder: "e.g. Schick", className: inputCls }) }), _jsx(Field, { label: "Color", children: _jsx("input", { value: form.color, onChange: (e) => set("color", e.target.value), placeholder: "e.g. Cognac", className: inputCls }) }), _jsx(Field, { label: "Material", children: _jsx("input", { value: form.material, onChange: (e) => set("material", e.target.value), placeholder: "e.g. Leather", className: inputCls }) })] })] }), _jsx(Divider, {}), _jsx(Section, { title: "Pricing & inventory", children: _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Field, { label: "Price (USD)", required: true, children: _jsxs("div", { className: "relative", children: [_jsx("span", { className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]", children: "$" }), _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.price || "", onChange: (e) => set("price", Number(e.target.value)), placeholder: "0", className: inputCls + " pl-7" })] }) }), _jsx(Field, { label: "First Cost (USD)", children: _jsxs("div", { className: "relative", children: [_jsx("span", { className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]", children: "$" }), _jsx("input", { type: "number", min: 0, step: 1, value: form.cost || "", onChange: (e) => set("cost", Number(e.target.value)), placeholder: "0", className: inputCls + " pl-7" })] }) }), _jsx(Field, { label: "Stock", required: true, children: _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.stock || "", onChange: (e) => set("stock", Number(e.target.value)), placeholder: "0", className: inputCls }) })] }) }), error && (_jsx("div", { className: "mx-6 mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600", children: error })), uploadWarning && (_jsxs("div", { className: "mx-6 mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: [_jsx("span", { className: "font-semibold", children: "Image upload failed." }), " ", uploadWarning] })), _jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-[#E5E3EE] px-6 py-4", children: [_jsx(Link, { to: "/products", className: "rounded-xl border border-[#E5E3EE] px-5 py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "min-w-[160px] rounded-xl bg-[#6D4AFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60 active:scale-[0.98]", children: saving ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" }), submitLabel] })) : "Create product" })] })] }) })] }));
}
// ── shared helpers ────────────────────────────────────────────────────────────
function Section({ title, children }) {
    return (_jsxs("div", { className: "px-6 py-5", children: [_jsx("h2", { className: "mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: title }), _jsx("div", { className: "space-y-4", children: children })] }));
}
function Divider() { return _jsx("div", { className: "border-t border-[#F0EEF8]" }); }
function Field({ label, required, children }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "ml-0.5 text-[#6D4AFF]", children: "*" })] }), children] }));
}
function UploadIcon({ className }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("polyline", { points: "17 8 12 3 7 8", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }));
}
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

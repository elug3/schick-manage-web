import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { deleteProduct, getProduct, updateProduct, uploadProductImage, } from "~/lib/api";
export function meta() {
    return [{ title: "Product Detail | Schick Admin" }];
}
const CATEGORIES = ["bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];
// ── page ─────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [editing, setEditing] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        setLoading(true);
        getProduct(id)
            .then((p) => { setProduct(p); setCarouselIdx(0); })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);
    async function handleDelete() {
        if (!product)
            return;
        setDeleting(true);
        await deleteProduct(product.id).catch(() => { });
        navigate("/products");
    }
    function handleSaved(updated) {
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
        return (_jsx("div", { className: "flex items-center justify-center py-40", children: _jsx("div", { className: "size-8 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) }));
    }
    if (notFound || !product) {
        return (_jsxs("div", { className: "flex flex-col items-center gap-4 py-40 text-center", children: [_jsx("p", { className: "text-lg font-semibold text-[#1C1B1F]", children: "Product not found" }), _jsx(Link, { to: "/products", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to products" })] }));
    }
    // ── render ─────────────────────────────────────────────────────────────────
    const statusMap = {
        active: { label: "Active", cls: "bg-emerald-100 text-emerald-800" },
        draft: { label: "Draft", cls: "bg-amber-100 text-amber-800" },
        archived: { label: "Archived", cls: "bg-slate-100 text-slate-600" },
    };
    const status = statusMap[product.status] ?? statusMap.draft;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-[#9D98B3]", children: [_jsxs(Link, { to: "/products", className: "flex items-center gap-1.5 transition hover:text-[#6D4AFF]", children: [_jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Products"] }), _jsx("span", { children: "/" }), _jsx("span", { className: "max-w-xs truncate text-[#1C1B1F]", children: product.name })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setEditing(true), className: "flex items-center gap-2 rounded-xl border border-[#E5E3EE] bg-white px-4 py-2 text-sm font-semibold text-[#1C1B1F] shadow-sm transition hover:bg-[#F4F3F8]", children: [_jsxs("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] }), "Edit"] }), _jsxs("button", { onClick: () => setDeleteOpen(true), className: "flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50", children: [_jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Delete"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsx("div", { className: "overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: hasImages ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative bg-[#F4F3F8]", children: [_jsx("img", { src: images[carouselIdx], alt: `${product.name} — image ${carouselIdx + 1}`, className: "aspect-[3/4] w-full object-contain" }, images[carouselIdx]), images.length > 1 && (_jsx("button", { onClick: goPrev, className: "absolute left-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })), images.length > 1 && (_jsx("button", { onClick: goNext, className: "absolute right-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })), images.length > 1 && (_jsx("div", { className: "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2", children: images.map((_, i) => (_jsx("button", { onClick: () => setCarouselIdx(i), className: [
                                                    "rounded-full transition-all duration-200",
                                                    i === carouselIdx
                                                        ? "size-2.5 bg-white shadow"
                                                        : "size-1.5 bg-white/50 hover:bg-white/80",
                                                ].join(" ") }, i))) })), images.length > 1 && (_jsxs("div", { className: "absolute right-3 bottom-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm", children: [carouselIdx + 1, " / ", images.length] }))] }), images.length > 1 && (_jsx("div", { className: "flex gap-2 overflow-x-auto p-3", children: images.map((url, i) => (_jsx("button", { onClick: () => setCarouselIdx(i), className: [
                                            "shrink-0 size-16 overflow-hidden rounded-xl border-2 transition",
                                            i === carouselIdx
                                                ? "border-[#6D4AFF]"
                                                : "border-transparent opacity-60 hover:opacity-100",
                                        ].join(" "), children: _jsx("img", { src: url, alt: `Thumbnail ${i + 1}`, className: "size-full object-cover" }) }, i))) }))] })) : (
                        /* No image placeholder */
                        _jsxs("div", { className: "flex aspect-[3/4] flex-col items-center justify-center gap-3 bg-[#F4F3F8]", children: [_jsx("div", { className: "flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm", children: _jsxs("svg", { className: "size-8 text-[#C4C1D4]", viewBox: "0 0 24 24", fill: "none", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3", stroke: "currentColor", strokeWidth: "1.5" }), _jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5", fill: "currentColor" }), _jsx("path", { d: "M21 15l-5-5L5 21", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })] }) }), _jsx("p", { className: "text-sm text-[#9D98B3]", children: "No images yet" }), _jsx("button", { onClick: () => setEditing(true), className: "text-xs font-semibold text-[#6D4AFF] hover:underline", children: "Add images via Edit" })] })) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [_jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`, children: [_jsx("span", { className: "size-1.5 rounded-full bg-current" }), status.label] }), _jsx("span", { className: "font-mono text-xs text-[#B4B0C8]", children: product.id })] }), _jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: product.name }), product.brand && (_jsx("p", { className: "mt-1 text-sm text-[#6B6480]", children: product.brand })), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [product.category && (_jsx("span", { className: "rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold capitalize text-[#6B6480]", children: product.category })), product.color && (_jsx("span", { className: "rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6B6480]", children: product.color })), product.material && (_jsx("span", { className: "rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6B6480]", children: product.material }))] })] }), _jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsx("p", { className: "mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Pricing & inventory" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(StatBox, { label: "Price", value: `$${product.price.toLocaleString()}` }), _jsx(StatBox, { label: "First Cost", value: product.cost ? `$${product.cost.toLocaleString()}` : "—" }), _jsx(StatBox, { label: "Stock", value: String(product.stock), highlight: product.stock === 0
                                                    ? "red"
                                                    : product.stock <= 5
                                                        ? "amber"
                                                        : undefined })] }), product.cost != null && product.cost > 0 && product.price > 0 && (_jsx("div", { className: "mt-4 border-t border-[#F0EEF8] pt-4", children: _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-[#9D98B3]", children: "Margin" }), _jsxs("span", { className: "font-semibold text-[#1C1B1F]", children: [(((product.price - product.cost) / product.price) * 100).toFixed(1), "%", _jsxs("span", { className: "ml-1.5 text-xs font-normal text-[#9D98B3]", children: ["($", (product.price - product.cost).toLocaleString(), " per unit)"] })] })] }) }))] }), product.description && (_jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Description" }), _jsx("p", { className: "whitespace-pre-line text-sm leading-relaxed text-[#1C1B1F]", children: product.description })] })), _jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsx("p", { className: "mb-4 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Details" }), _jsxs("dl", { className: "space-y-2.5 text-sm", children: [_jsx(MetaRow, { label: "ID", value: product.id, mono: true }), _jsx(MetaRow, { label: "Created", value: new Date(product.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }), product.brand && _jsx(MetaRow, { label: "Brand", value: product.brand }), product.color && _jsx(MetaRow, { label: "Color", value: product.color }), product.material && _jsx(MetaRow, { label: "Material", value: product.material }), product.category && _jsx(MetaRow, { label: "Category", value: product.category }), _jsx(MetaRow, { label: "Images", value: `${(product.imageUrls ?? []).length} image${(product.imageUrls ?? []).length !== 1 ? "s" : ""}` })] })] })] })] }), editing && (_jsx(ProductEditDrawer, { product: product, onSaved: handleSaved, onClose: () => setEditing(false) })), deleteOpen && (_jsx(DeleteModal, { productName: product.name, deleting: deleting, onConfirm: handleDelete, onCancel: () => setDeleteOpen(false) }))] }));
}
// ── StatBox ───────────────────────────────────────────────────────────────────
function StatBox({ label, value, highlight, }) {
    const valueColor = highlight === "red"
        ? "text-red-600"
        : highlight === "amber"
            ? "text-amber-700"
            : "text-[#1C1B1F]";
    return (_jsxs("div", { className: "rounded-xl bg-[#F8F7FC] px-4 py-3", children: [_jsx("p", { className: "text-xs text-[#9D98B3]", children: label }), _jsx("p", { className: `mt-1 text-xl font-bold ${valueColor}`, children: value })] }));
}
// ── MetaRow ───────────────────────────────────────────────────────────────────
function MetaRow({ label, value, mono }) {
    return (_jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [_jsx("dt", { className: "shrink-0 text-[#9D98B3]", children: label }), _jsx("dd", { className: `min-w-0 truncate text-right text-[#1C1B1F] ${mono ? "font-mono text-xs" : ""}`, children: value })] }));
}
// ── ProductEditDrawer ─────────────────────────────────────────────────────────
function ProductEditDrawer({ product, onSaved, onClose, }) {
    const [form, setForm] = useState({
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
    const [slots, setSlots] = useState(() => (product.imageUrls ?? []).map((url) => ({ kind: "existing", url })));
    const [activeIdx, setActiveIdx] = useState(0);
    const [phase, setPhase] = useState("idle");
    const [uploadStep, setUploadStep] = useState({ current: 0, total: 0, pct: 0 });
    const [error, setError] = useState(null);
    const saving = phase !== "idle";
    const firstInput = useRef(null);
    useEffect(() => { firstInput.current?.focus(); }, []);
    function set(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }
    function addFiles(files) {
        const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!arr.length)
            return;
        const newSlots = arr.map((file) => ({
            kind: "new", file,
            preview: URL.createObjectURL(file),
        }));
        setSlots((prev) => { const next = [...prev, ...newSlots]; setActiveIdx(next.length - 1); return next; });
    }
    function removeSlot(idx) {
        setSlots((prev) => {
            const s = prev[idx];
            if (s.kind === "new")
                URL.revokeObjectURL(s.preview);
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
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setPhase("saving");
        try {
            const keepUrls = slots
                .filter((s) => s.kind === "existing")
                .map((s) => s.url);
            let updated = await updateProduct(product.id, { ...form, imageUrls: keepUrls });
            const newSlots = slots.filter((s) => s.kind === "new");
            if (newSlots.length > 0) {
                setPhase("uploading");
                for (let i = 0; i < newSlots.length; i++) {
                    setUploadStep({ current: i + 1, total: newSlots.length, pct: 0 });
                    updated = await uploadProductImage(product.id, newSlots[i].file, (pct) => setUploadStep((s) => ({ ...s, pct })));
                }
            }
            onSaved(updated);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setPhase("idle");
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[#E5E3EE] px-6 py-4", children: [_jsx("h2", { className: "text-base font-bold text-[#1C1B1F]", children: "Edit product" }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1.5 text-[#6B6480] hover:bg-[#F4F3F8]", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-1 flex-col overflow-y-auto", children: [_jsxs("div", { className: "flex-1 space-y-5 px-6 py-5", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: "Product images" }), _jsx("div", { className: "overflow-hidden rounded-xl border border-[#E5E3EE]", children: activePreview ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative bg-[#F4F3F8]", children: [_jsx("img", { src: activePreview, alt: `Image ${activeIdx + 1}`, className: "max-h-52 w-full object-contain" }, activePreview), phase === "uploading" && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm", children: [_jsxs("p", { className: "text-xs font-semibold text-white", children: ["Uploading ", uploadStep.current, "/", uploadStep.total, "\u2026 ", uploadStep.pct, "%"] }), _jsx("div", { className: "h-1.5 w-32 overflow-hidden rounded-full bg-white/30", children: _jsx("div", { className: "h-full rounded-full bg-white transition-all", style: { width: `${uploadStep.pct}%` } }) })] })), slots.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: goPrev, className: "absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60", children: _jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "button", onClick: goNext, className: "absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60", children: _jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })), phase === "idle" && (_jsx("button", { type: "button", onClick: () => removeSlot(activeIdx), className: "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-600/80", children: _jsx("svg", { className: "size-3.5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })), slots.length > 1 && (_jsx("div", { className: "absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5", children: slots.map((_, i) => (_jsx("button", { type: "button", onClick: () => setActiveIdx(i), className: ["rounded-full transition-all duration-200",
                                                                            i === activeIdx ? "size-2 bg-white shadow" : "size-1.5 bg-white/50 hover:bg-white/75"].join(" ") }, i))) }))] }), _jsxs("div", { className: "flex items-center gap-2 border-t border-[#E5E3EE] bg-white px-3 py-2", children: [_jsxs("p", { className: "min-w-0 flex-1 truncate text-xs text-[#9D98B3]", children: [activeSlot?.kind === "new" ? activeSlot.file.name : "Saved image", slots.length > 1 && ` · ${activeIdx + 1}/${slots.length}`] }), _jsxs("label", { className: "shrink-0 cursor-pointer rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6D4AFF] hover:bg-[#EAE7F8]", children: ["+ Add", _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: (e) => { if (e.target.files?.length) {
                                                                                addFiles(e.target.files);
                                                                                e.target.value = "";
                                                                            } } })] })] })] })) : (_jsxs("label", { className: "flex cursor-pointer flex-col items-center gap-2 bg-[#FAFAFA] py-8", children: [_jsxs("svg", { className: "size-8 text-[#C4C1D4]", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("polyline", { points: "17 8 12 3 7 8", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }), _jsx("p", { className: "text-sm font-medium text-[#6D4AFF]", children: "Upload images" }), _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: (e) => { if (e.target.files?.length) {
                                                                addFiles(e.target.files);
                                                                e.target.value = "";
                                                            } } })] })) })] }), _jsx(Field, { label: "Product name", required: true, children: _jsx("input", { ref: firstInput, required: true, value: form.name, onChange: (e) => set("name", e.target.value), placeholder: "e.g. Milanese Leather Tote", className: inputCls }) }), _jsx(Field, { label: "Category", children: _jsx("select", { value: form.category, onChange: (e) => set("category", e.target.value), className: inputCls, children: CATEGORIES.map((c) => (_jsx("option", { value: c, children: c.charAt(0).toUpperCase() + c.slice(1) }, c))) }) }), _jsx(Field, { label: "Status", children: _jsxs("select", { value: form.status, onChange: (e) => set("status", e.target.value), className: inputCls, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Field, { label: "Price (USD)", required: true, children: _jsxs("div", { className: "relative", children: [_jsx("span", { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]", children: "$" }), _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.price || "", onChange: (e) => set("price", Number(e.target.value)), placeholder: "0", className: inputCls + " pl-6" })] }) }), _jsx(Field, { label: "First Cost", children: _jsxs("div", { className: "relative", children: [_jsx("span", { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9D98B3]", children: "$" }), _jsx("input", { type: "number", min: 0, step: 1, value: form.cost || "", onChange: (e) => set("cost", Number(e.target.value)), placeholder: "0", className: inputCls + " pl-6" })] }) }), _jsx(Field, { label: "Stock", required: true, children: _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.stock || "", onChange: (e) => set("stock", Number(e.target.value)), placeholder: "0", className: inputCls }) })] }), _jsx(Field, { label: "Brand", children: _jsx("input", { value: form.brand, onChange: (e) => set("brand", e.target.value), placeholder: "e.g. Schick", className: inputCls }) }), _jsx(Field, { label: "Color", children: _jsx("input", { value: form.color, onChange: (e) => set("color", e.target.value), placeholder: "e.g. Cognac", className: inputCls }) }), _jsx(Field, { label: "Material", children: _jsx("input", { value: form.material, onChange: (e) => set("material", e.target.value), placeholder: "e.g. Leather", className: inputCls }) }), _jsx(Field, { label: "Description", children: _jsx("textarea", { rows: 3, value: form.description, onChange: (e) => set("description", e.target.value), placeholder: "Short product description\u2026", className: inputCls + " resize-none" }) }), error && (_jsx("div", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600", children: error }))] }), _jsxs("div", { className: "flex gap-3 border-t border-[#E5E3EE] px-6 py-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl bg-[#6D4AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: saving ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" }), phase === "uploading"
                                                    ? `Uploading ${uploadStep.current}/${uploadStep.total}…`
                                                    : "Saving…"] })) : "Save changes" })] })] })] })] }));
}
// ── DeleteModal ───────────────────────────────────────────────────────────────
function DeleteModal({ productName, deleting, onConfirm, onCancel, }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl", children: [_jsx("div", { className: "mb-4 flex size-12 items-center justify-center rounded-full bg-red-100", children: _jsx("svg", { className: "size-5 text-red-600", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("h3", { className: "text-base font-bold text-[#1C1B1F]", children: "Delete product" }), _jsxs("p", { className: "mt-1.5 text-sm text-[#6B6480]", children: ["Are you sure you want to delete", " ", _jsx("span", { className: "font-semibold text-[#1C1B1F]", children: productName }), "? This action cannot be undone."] }), _jsxs("div", { className: "mt-5 flex gap-3", children: [_jsx("button", { onClick: onCancel, disabled: deleting, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8] disabled:opacity-50", children: "Cancel" }), _jsx("button", { onClick: onConfirm, disabled: deleting, className: "flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50", children: deleting ? "Deleting…" : "Delete" })] })] }) }));
}
// ── shared ────────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "ml-0.5 text-[#6D4AFF]", children: "*" })] }), children] }));
}
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

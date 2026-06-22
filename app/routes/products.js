import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { deleteProduct, getProducts, updateProduct, uploadProductImage, } from "~/lib/api";
export function meta() {
    return [{ title: "Products | Schick Admin" }];
}
const CATEGORIES = ["All", "bags", "shoes", "outerwear", "bottoms", "tops", "dresses"];
export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    useEffect(() => {
        getProducts()
            .then(setProducts)
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);
    const filtered = products.filter((p) => {
        const catMatch = activeCategory === "All" || p.category === activeCategory;
        const searchMatch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand?.toLowerCase().includes(search.toLowerCase());
        return catMatch && searchMatch;
    });
    function handleSaved(updated) {
        setProducts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
        setEditTarget(null);
    }
    async function handleDelete(product) {
        await deleteProduct(product.id).catch(() => { });
        setProducts((ps) => ps.filter((p) => p.id !== product.id));
        setDeleteTarget(null);
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: "Products" }), _jsxs("p", { className: "mt-0.5 text-sm text-[#6B6480]", children: [products.length, " products total"] })] }), _jsxs(Link, { to: "/products/new", className: "flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5A38E8] active:scale-[0.98]", children: [_jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M12 5v14M5 12h14", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round" }) }), "Add product"] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("div", { className: "flex flex-wrap gap-1 rounded-xl border border-[#E5E3EE] bg-white p-1 shadow-[0_1px_3px_rgba(28,27,31,0.04)]", children: CATEGORIES.map((cat) => (_jsx("button", { onClick: () => setActiveCategory(cat), className: [
                                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                                activeCategory === cat
                                    ? "bg-[#6D4AFF] text-white shadow-sm"
                                    : "text-[#6B6480] hover:bg-[#F4F3F8] hover:text-[#1C1B1F]",
                            ].join(" "), children: cat }, cat))) }), _jsxs("div", { className: "relative min-w-48 flex-1", children: [_jsx("svg", { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9D98B3]", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "m20 20-4.35-4.35M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }), _jsx("input", { type: "search", placeholder: "Search products\u2026", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full rounded-xl border border-[#E5E3EE] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20 shadow-[0_1px_3px_rgba(28,27,31,0.04)]" })] })] }), _jsx("div", { className: "overflow-hidden rounded-2xl border border-[#E5E3EE] bg-white shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#F0EEF8] bg-[#FAFAFA]", children: ["Product", "Category", "Price", "Stock", "Status", ""].map((h) => (_jsx("th", { className: "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: h }, h))) }) }), _jsx("tbody", { children: filtered.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-5 py-16 text-center text-[#9D98B3]", children: "No products match your search" }) })) : (filtered.map((product) => (_jsx(ProductRow, { product: product, onEdit: () => setEditTarget(product), onDelete: () => setDeleteTarget(product) }, product.id)))) })] }) })) }), editTarget && (_jsx(ProductDrawer, { product: editTarget, onSaved: handleSaved, onClose: () => setEditTarget(null) })), deleteTarget && (_jsx(DeleteModal, { product: deleteTarget, onConfirm: () => handleDelete(deleteTarget), onCancel: () => setDeleteTarget(null) }))] }));
}
// ── ProductRow ──────────────────────────────────────────────────────────────
function ProductRow({ product, onEdit, onDelete, }) {
    return (_jsxs("tr", { className: "border-b border-[#F0EEF8] last:border-0 hover:bg-[#FAFAFA]", children: [_jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [product.imageUrls?.[0] ? (_jsx("img", { src: product.imageUrls[0], alt: product.name, className: "size-10 shrink-0 rounded-xl object-cover" })) : (_jsx("div", { className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F3F8] text-xs font-bold text-[#6D4AFF]", children: product.name.slice(0, 2).toUpperCase() })), _jsxs("div", { children: [_jsx(Link, { to: `/products/${product.id}`, className: "font-medium text-[#1C1B1F] hover:text-[#6D4AFF] hover:underline", children: product.name }), product.brand && (_jsx("div", { className: "text-xs text-[#9D98B3]", children: product.brand }))] })] }) }), _jsx("td", { className: "px-5 py-4", children: _jsx("span", { className: "capitalize text-[#6B6480]", children: product.category }) }), _jsxs("td", { className: "px-5 py-4 font-semibold text-[#1C1B1F]", children: ["$", product.price.toFixed(0)] }), _jsx("td", { className: "px-5 py-4", children: product.stock === 0 ? (_jsx("span", { className: "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700", children: "Out of stock" })) : product.stock <= 5 ? (_jsxs("span", { className: "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800", children: ["Low \u00B7 ", product.stock] })) : (_jsx("span", { className: "text-[#1C1B1F]", children: product.stock })) }), _jsx("td", { className: "px-5 py-4", children: _jsx(ProductStatusBadge, { status: product.status }) }), _jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [_jsx("button", { onClick: onEdit, className: "rounded-lg p-2 text-[#6B6480] transition hover:bg-[#F4F3F8] hover:text-[#1C1B1F]", title: "Edit", children: _jsx(EditIcon, {}) }), _jsx("button", { onClick: onDelete, className: "rounded-lg p-2 text-[#6B6480] transition hover:bg-red-50 hover:text-red-600", title: "Delete", children: _jsx(TrashIcon, {}) })] }) })] }));
}
// ── ProductDrawer ───────────────────────────────────────────────────────────
function ProductDrawer({ product, onSaved, onClose, }) {
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
    // Image carousel state
    const [slots, setSlots] = useState(() => (product.imageUrls ?? []).map((url) => ({ kind: "existing", url })));
    const [activeIdx, setActiveIdx] = useState(0);
    // Submit state
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
            kind: "new",
            file,
            preview: URL.createObjectURL(file),
        }));
        setSlots((prev) => {
            const next = [...prev, ...newSlots];
            setActiveIdx(next.length - 1);
            return next;
        });
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
            setError(err instanceof Error ? err.message : "Failed to save product");
            setPhase("idle");
        }
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm", onClick: onClose }), _jsxs("div", { className: "fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[#E5E3EE] px-6 py-4", children: [_jsx("h2", { className: "text-base font-bold text-[#1C1B1F]", children: "Edit product" }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1.5 text-[#6B6480] hover:bg-[#F4F3F8]", children: _jsx("svg", { className: "size-5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }) }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-1 flex-col overflow-y-auto", children: [_jsxs("div", { className: "flex-1 space-y-5 px-6 py-5", children: [_jsx(Field, { label: "Product images", children: _jsx("div", { className: "overflow-hidden rounded-xl border border-[#E5E3EE]", children: activePreview ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative bg-[#F4F3F8]", children: [_jsx("img", { src: activePreview, alt: `Image ${activeIdx + 1}`, className: "max-h-52 w-full object-contain" }, activePreview), phase === "uploading" && (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 backdrop-blur-sm", children: [_jsxs("p", { className: "text-xs font-semibold text-white", children: ["Uploading ", uploadStep.current, "/", uploadStep.total, "\u2026 ", uploadStep.pct, "%"] }), _jsx("div", { className: "h-1.5 w-32 overflow-hidden rounded-full bg-white/30", children: _jsx("div", { className: "h-full rounded-full bg-white transition-all", style: { width: `${uploadStep.pct}%` } }) })] })), slots.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: goPrev, className: "absolute left-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60", children: _jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M15 18l-6-6 6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "button", onClick: goNext, className: "absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60", children: _jsx("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M9 18l6-6-6-6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })), phase === "idle" && (_jsx("button", { type: "button", onClick: () => removeSlot(activeIdx), className: "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-600/80", children: _jsx("svg", { className: "size-3.5", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M18 6L6 18M6 6l12 12", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })), slots.length > 1 && (_jsx("div", { className: "absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5", children: slots.map((_, i) => (_jsx("button", { type: "button", onClick: () => setActiveIdx(i), className: [
                                                                        "rounded-full transition-all duration-200",
                                                                        i === activeIdx ? "size-2 bg-white shadow" : "size-1.5 bg-white/50 hover:bg-white/75",
                                                                    ].join(" ") }, i))) }))] }), _jsxs("div", { className: "flex items-center gap-2 border-t border-[#E5E3EE] bg-white px-3 py-2", children: [_jsxs("p", { className: "min-w-0 flex-1 truncate text-xs text-[#9D98B3]", children: [activeSlot?.kind === "new" ? activeSlot.file.name : "Saved image", slots.length > 1 && ` · ${activeIdx + 1}/${slots.length}`] }), _jsxs("label", { className: "shrink-0 cursor-pointer rounded-lg bg-[#F4F3F8] px-2.5 py-1 text-xs font-semibold text-[#6D4AFF] hover:bg-[#EAE7F8]", children: ["+ Add", _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: (e) => { if (e.target.files?.length) {
                                                                            addFiles(e.target.files);
                                                                            e.target.value = "";
                                                                        } } })] })] })] })) : (
                                            /* Empty */
                                            _jsxs("label", { className: "flex cursor-pointer flex-col items-center gap-2 bg-[#FAFAFA] py-8", children: [_jsxs("svg", { className: "size-8 text-[#C4C1D4]", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("polyline", { points: "17 8 12 3 7 8", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })] }), _jsx("p", { className: "text-sm font-medium text-[#6D4AFF]", children: "Upload images" }), _jsx("p", { className: "text-xs text-[#9D98B3]", children: "JPEG \u00B7 PNG \u00B7 WebP \u00B7 TIFF" }), _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "sr-only", onChange: (e) => { if (e.target.files?.length) {
                                                            addFiles(e.target.files);
                                                            e.target.value = "";
                                                        } } })] })) }) }), _jsx(Field, { label: "Product name", required: true, children: _jsx("input", { ref: firstInput, required: true, value: form.name, onChange: (e) => set("name", e.target.value), placeholder: "e.g. Milanese Leather Tote", className: inputCls }) }), _jsx(Field, { label: "Category", required: true, children: _jsx("select", { value: form.category, onChange: (e) => set("category", e.target.value), className: inputCls, children: CATEGORIES.slice(1).map((c) => (_jsx("option", { value: c, children: c.charAt(0).toUpperCase() + c.slice(1) }, c))) }) }), _jsx(Field, { label: "Status", children: _jsxs("select", { value: form.status, onChange: (e) => set("status", e.target.value), className: inputCls, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] }) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Field, { label: "Price (USD)", required: true, children: _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.price || "", onChange: (e) => set("price", Number(e.target.value)), placeholder: "0", className: inputCls }) }), _jsx(Field, { label: "First Cost (USD)", children: _jsx("input", { type: "number", min: 0, step: 1, value: form.cost || "", onChange: (e) => set("cost", Number(e.target.value)), placeholder: "0", className: inputCls }) }), _jsx(Field, { label: "Stock", required: true, children: _jsx("input", { type: "number", min: 0, step: 1, required: true, value: form.stock || "", onChange: (e) => set("stock", Number(e.target.value)), placeholder: "0", className: inputCls }) })] }), _jsx(Field, { label: "Brand", children: _jsx("input", { value: form.brand, onChange: (e) => set("brand", e.target.value), placeholder: "e.g. Schick", className: inputCls }) }), _jsx(Field, { label: "Color", children: _jsx("input", { value: form.color, onChange: (e) => set("color", e.target.value), placeholder: "e.g. Cognac", className: inputCls }) }), _jsx(Field, { label: "Material", children: _jsx("input", { value: form.material, onChange: (e) => set("material", e.target.value), placeholder: "e.g. Leather", className: inputCls }) }), _jsx(Field, { label: "Description", children: _jsx("textarea", { rows: 3, value: form.description, onChange: (e) => set("description", e.target.value), placeholder: "Short product description\u2026", className: inputCls + " resize-none" }) }), error && (_jsx("div", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600", children: error }))] }), _jsxs("div", { className: "flex gap-3 border-t border-[#E5E3EE] px-6 py-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] transition hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl bg-[#6D4AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: saving ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" }), phase === "uploading"
                                                    ? `Uploading ${uploadStep.current}/${uploadStep.total} (${uploadStep.pct}%)…`
                                                    : "Saving…"] })) : "Save changes" })] })] })] })] }));
}
// ── DeleteModal ─────────────────────────────────────────────────────────────
function DeleteModal({ product, onConfirm, onCancel, }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm", children: _jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl", children: [_jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100", children: _jsx(TrashIcon, { className: "size-5 text-red-600" }) }), _jsx("h3", { className: "text-base font-bold text-[#1C1B1F]", children: "Delete product" }), _jsxs("p", { className: "mt-1.5 text-sm text-[#6B6480]", children: ["Are you sure you want to delete", " ", _jsx("span", { className: "font-semibold text-[#1C1B1F]", children: product.name }), "? This action cannot be undone."] }), _jsxs("div", { className: "mt-5 flex gap-3", children: [_jsx("button", { onClick: onCancel, className: "flex-1 rounded-xl border border-[#E5E3EE] py-2.5 text-sm font-semibold text-[#6B6480] hover:bg-[#F4F3F8]", children: "Cancel" }), _jsx("button", { onClick: onConfirm, className: "flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700", children: "Delete" })] })] }) }));
}
// ── Shared ──────────────────────────────────────────────────────────────────
function Field({ label, required, children, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "ml-0.5 text-[#6D4AFF]", children: "*" })] }), children] }));
}
function ProductStatusBadge({ status }) {
    const map = {
        active: { label: "Active", class: "bg-emerald-100 text-emerald-800" },
        draft: { label: "Draft", class: "bg-amber-100 text-amber-800" },
        archived: { label: "Archived", class: "bg-slate-100 text-slate-600" },
    };
    const { label, class: cls } = map[status];
    return (_jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`, children: label }));
}
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";
function EditIcon() {
    return (_jsxs("svg", { className: "size-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("path", { d: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }), _jsx("path", { d: "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })] }));
}
function TrashIcon({ className }) {
    return (_jsx("svg", { className: className ?? "size-4", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) }));
}

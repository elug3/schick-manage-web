import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { formatVariantOption, getInventory, getManageProduct, getProduct, productVariants, setInventory, uploadProductImage, uploadVariantImage, } from "~/lib/api";
import { useNotify } from "~/lib/notifications";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const LOW_STOCK_THRESHOLD = 5;
export function meta() {
    return [{ title: "Product | Dupli1 Admin" }];
}
export default function ProductDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category") ?? "bags";
    const [product, setProduct] = useState(null);
    const [variantRows, setVariantRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!id)
            return;
        const productId = id;
        let cancelled = false;
        setLoading(true);
        setError(null);
        async function load() {
            try {
                let p;
                try {
                    p = await getManageProduct(productId);
                }
                catch {
                    const fallback = await getProduct(category, productId);
                    if (!fallback)
                        throw new Error("Product not found");
                    p = fallback;
                }
                const variants = productVariants(p);
                const rows = await Promise.all(variants.map(async (variant) => {
                    try {
                        const stock = await getInventory(variant.sku);
                        return {
                            ...variant,
                            quantity: stock.quantity,
                            reserved: stock.reserved,
                        };
                    }
                    catch {
                        return { ...variant, quantity: null, reserved: null };
                    }
                }));
                if (!cancelled) {
                    setProduct(p);
                    setVariantRows(rows);
                }
            }
            catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Product not found");
                }
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [id, category]);
    async function refreshVariantStock(sku) {
        try {
            const stock = await getInventory(sku);
            setVariantRows((rows) => rows.map((row) => row.sku === sku
                ? { ...row, quantity: stock.quantity, reserved: stock.reserved }
                : row));
        }
        catch {
            setVariantRows((rows) => rows.map((row) => row.sku === sku ? { ...row, quantity: null, reserved: null } : row));
        }
    }
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-32", children: _jsx("div", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) }));
    }
    if (error || !product) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { to: "/products", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to products" }), _jsx("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-10 text-center text-[#6B6480]", children: error ?? "Product not found" })] }));
    }
    const hasMultipleVariants = (product.variants?.length ?? 0) > 1 ||
        variantRows.length > 1 ||
        Boolean(product.availableColors?.length);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Link, { to: "/products", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to products" }), _jsxs("div", { className: "rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)] sm:p-8", children: [_jsx("h1", { className: "text-2xl font-bold text-[#1C1B1F]", children: product.name }), _jsx("p", { className: "mt-1 text-sm capitalize text-[#6B6480]", children: product.category }), _jsx("dl", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: [
                            ["ID", product.id],
                            ["Brand", product.brand],
                            ["Material", product.material],
                            ["Status", product.status],
                            [
                                "Colors",
                                product.availableColors?.join(", ") ?? product.color ?? "—",
                            ],
                            [
                                "Price from",
                                product.priceFrom != null
                                    ? formatCurrency(product.priceFrom)
                                    : product.price != null
                                        ? formatCurrency(product.price)
                                        : "—",
                            ],
                        ].map(([label, value]) => (_jsxs("div", { children: [_jsx("dt", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: label }), _jsx("dd", { className: "mt-1 text-sm text-[#1C1B1F]", children: value ?? "—" })] }, label))) }), _jsx(VariantsSection, { product: product, rows: variantRows, onStockUpdated: refreshVariantStock, onProductUpdated: setProduct }), !hasMultipleVariants && variantRows[0] && (_jsx(LegacyProductImages, { productId: product.id, variant: variantRows[0], onUploaded: setProduct }))] })] }));
}
function VariantsSection({ product, rows, onStockUpdated, onProductUpdated, }) {
    const { notify } = useNotify();
    async function handleSetStock(sku, quantity) {
        try {
            await setInventory(sku, quantity);
            await onStockUpdated(sku);
            notify(`Stock updated for ${sku}`);
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Failed to update stock", "error");
        }
    }
    return (_jsxs("div", { className: "mt-8 border-t border-[#F0EEF8] pt-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Variants" }), _jsxs("p", { className: "mt-1 text-sm text-[#6B6480]", children: ["Sellable SKUs with inventory keyed by", " ", _jsxs("code", { className: "text-xs", children: ["/inventory/api/v1/inventory/", "{sku}"] })] })] }), _jsx("div", { className: "overflow-x-auto rounded-xl border border-[#E5E3EE]", children: _jsxs("table", { className: "w-full min-w-[640px] text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#F0EEF8] bg-[#FAFAFA] text-left", children: ["SKU", "Option", "Price", "Status", "Stock", "Images", ""].map((heading) => (_jsx("th", { className: "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: heading }, heading))) }) }), _jsx("tbody", { children: rows.map((row) => (_jsxs("tr", { className: "border-b border-[#F0EEF8] last:border-0 align-top", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-[#1C1B1F]", children: row.sku }), _jsx("td", { className: "px-4 py-3 text-[#6B6480]", children: formatVariantOption(row) }), _jsx("td", { className: "px-4 py-3 text-[#1C1B1F]", children: formatCurrency(row.price) }), _jsx("td", { className: "px-4 py-3 capitalize text-[#6B6480]", children: row.status }), _jsx("td", { className: "px-4 py-3", children: _jsx(StockEditor, { sku: row.sku, quantity: row.quantity, reserved: row.reserved, onSave: handleSetStock }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(VariantImageUpload, { productId: product.id, variant: row, onUploaded: (updated) => {
                                                onProductUpdated({
                                                    ...product,
                                                    variants: productVariants(product).map((v) => v.sku === updated.sku ? updated : v),
                                                });
                                            } }) }), _jsxs("td", { className: "px-4 py-3", children: [row.quantity === 0 && (_jsx("span", { className: "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600", children: "Out" })), row.quantity != null &&
                                                row.quantity > 0 &&
                                                row.quantity <= LOW_STOCK_THRESHOLD && (_jsx("span", { className: "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700", children: "Low" }))] })] }, row.sku))) })] }) })] }));
}
function StockEditor({ sku, quantity, reserved, onSave, }) {
    const [value, setValue] = useState(quantity != null ? String(quantity) : "");
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setValue(quantity != null ? String(quantity) : "");
    }, [quantity]);
    async function handleSubmit(e) {
        e.preventDefault();
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 0)
            return;
        setSaving(true);
        try {
            await onSave(sku, parsed);
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex items-center gap-2", children: [_jsx("input", { type: "number", min: 0, value: value, onChange: (e) => setValue(e.target.value), placeholder: "\u2014", className: "w-20 rounded-lg border border-[#E5E3EE] px-2 py-1 text-sm outline-none focus:border-[#6D4AFF]" }), _jsx("button", { type: "submit", disabled: saving, className: "rounded-lg bg-[#F4F3F8] px-2 py-1 text-xs font-semibold text-[#6D4AFF] hover:bg-[#E5E3EE] disabled:opacity-60", children: saving ? "…" : "Set" }), reserved != null && reserved > 0 && (_jsxs("span", { className: "text-xs text-[#9D98B3]", children: [reserved, " reserved"] }))] }));
}
function VariantImageUpload({ productId, variant, onUploaded, }) {
    const { notify } = useNotify();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            notify("Please choose an image file", "error");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            notify("Image must be 10 MB or smaller", "error");
            e.target.value = "";
            return;
        }
        setUploading(true);
        try {
            const updated = await uploadVariantImage(productId, variant.sku, file);
            onUploaded(updated);
            notify("Variant image uploaded");
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Upload failed", "error");
        }
        finally {
            setUploading(false);
            e.target.value = "";
        }
    }
    return (_jsxs("div", { children: [_jsx("input", { ref: inputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFileChange, disabled: uploading }), _jsx("button", { type: "button", onClick: () => inputRef.current?.click(), disabled: uploading, className: "text-xs font-semibold text-[#6D4AFF] hover:underline disabled:opacity-60", children: uploading ? "Uploading…" : `Upload (${variant.imageUrls.length})` })] }));
}
function LegacyProductImages({ productId, variant, onUploaded, }) {
    const { notify } = useNotify();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            notify("Please choose an image file", "error");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            notify("Image must be 10 MB or smaller", "error");
            e.target.value = "";
            return;
        }
        setUploading(true);
        try {
            const updated = await uploadProductImage(productId, file);
            onUploaded(updated);
            notify("Image uploaded");
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Upload failed", "error");
        }
        finally {
            setUploading(false);
            e.target.value = "";
        }
    }
    const imageUrls = variant.imageUrls;
    return (_jsxs("div", { className: "mt-6 border-t border-[#F0EEF8] pt-6", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Images" }), _jsx("p", { className: "mt-1 text-sm text-[#6B6480]", children: "Legacy parent upload or variant upload when multi-SKU is enabled" })] }), _jsxs("div", { children: [_jsx("input", { ref: inputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFileChange, disabled: uploading }), _jsx("button", { type: "button", onClick: () => inputRef.current?.click(), disabled: uploading, className: "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60 sm:w-auto", children: uploading ? "Uploading…" : "Upload image" })] })] }), imageUrls.length > 0 ? (_jsx("div", { className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", children: imageUrls.map((url) => (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "group overflow-hidden rounded-xl border border-[#E5E3EE] bg-[#FAFAFA]", children: _jsx("img", { src: url, alt: "", className: "aspect-square w-full object-cover transition group-hover:scale-105" }) }, url))) })) : (_jsx("div", { className: "mt-4 rounded-xl border border-dashed border-[#E5E3EE] bg-[#FAFAFA] px-4 py-10 text-center text-sm text-[#9D98B3]", children: "No images yet." }))] }));
}
function formatCurrency(n) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(n);
}

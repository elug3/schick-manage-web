import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createBagProduct, createProductParent, createVariant, setInventory, } from "~/lib/api";
import { useNotify } from "~/lib/notifications";
export function meta() {
    return [{ title: "New Product | Dupli1 Admin" }];
}
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";
export default function NewProduct() {
    const navigate = useNavigate();
    const { notify } = useNotify();
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [brand, setBrand] = useState("");
    const [material, setMaterial] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [sku, setSku] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState("active");
    const [initialStock, setInitialStock] = useState("");
    const [loading, setLoading] = useState(false);
    async function applyInitialStock(variantSku) {
        const stockQty = Number.parseInt(initialStock, 10);
        if (!Number.isNaN(stockQty) && stockQty >= 0 && variantSku) {
            await setInventory(variantSku, stockQty).catch(() => { });
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const parsedPrice = Number.parseFloat(price);
            if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                throw new Error("Enter a valid price for the first variant");
            }
            let parent;
            try {
                parent = await createProductParent({
                    name: name.trim(),
                    id: id.trim(),
                    brand: brand.trim(),
                    material: material.trim(),
                    description: description.trim() || undefined,
                });
            }
            catch {
                // Parent+variant API unavailable — fall back to the legacy flat create.
                const legacy = await createBagProduct({
                    name: name.trim(),
                    id: id.trim(),
                    brand: brand.trim(),
                    color: color.trim(),
                    material: material.trim(),
                });
                await applyInitialStock(legacy.sku ?? legacy.id);
                notify(`Product created: ${name.trim()}`);
                navigate(`/products/${encodeURIComponent(legacy.id)}?category=bags`);
                return;
            }
            // Parent exists now — don't retry via the legacy endpoint below, it'd collide on this ID.
            try {
                const variant = await createVariant(parent.id, {
                    color: color.trim(),
                    size: size.trim(),
                    price: parsedPrice,
                    sku: sku.trim() || undefined,
                    status,
                });
                await applyInitialStock(variant.sku);
            }
            catch (err) {
                notify(`Style "${name.trim()}" was created, but the first variant failed: ${err instanceof Error ? err.message : "unknown error"}. Add a variant from the product page to finish setup.`, "error");
                navigate(`/products/${encodeURIComponent(parent.id)}?category=bags`);
                return;
            }
            notify(`Product created: ${name.trim()}`);
            navigate(`/products/${encodeURIComponent(parent.id)}?category=bags`);
        }
        catch (err) {
            notify(friendlyCreateError(err), "error");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "mx-auto max-w-lg space-y-6", children: [_jsx(Link, { to: "/products", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to products" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-[#1C1B1F] sm:text-2xl", children: "New product" }), _jsx("p", { className: "mt-0.5 text-sm text-[#6B6480]", children: "Create a parent style, then the first sellable variant (SKU)." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Style (parent)" }), _jsx(Field, { label: "Name", id: "name", required: true, children: _jsx("input", { id: "name", type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), className: inputCls, placeholder: "Cassette Bag" }) }), _jsx(Field, { label: "Product ID", id: "id", children: _jsx("input", { id: "id", type: "text", value: id, onChange: (e) => setId(e.target.value), className: inputCls, placeholder: "Auto-generated if empty" }) }), _jsx(Field, { label: "Brand", id: "brand", required: true, children: _jsx("input", { id: "brand", type: "text", required: true, value: brand, onChange: (e) => setBrand(e.target.value), className: inputCls }) }), _jsx(Field, { label: "Material", id: "material", required: true, children: _jsx("input", { id: "material", type: "text", required: true, value: material, onChange: (e) => setMaterial(e.target.value), className: inputCls }) }), _jsx(Field, { label: "Description", id: "description", children: _jsx("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), rows: 3, className: inputCls, placeholder: "Optional" }) })] }), _jsxs("section", { className: "space-y-4 border-t border-[#F0EEF8] pt-6", children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "First variant (SKU)" }), _jsx(Field, { label: "Color", id: "color", required: true, children: _jsx("input", { id: "color", type: "text", required: true, value: color, onChange: (e) => setColor(e.target.value), className: inputCls, placeholder: "Green" }) }), _jsx(Field, { label: "Size", id: "size", children: _jsx("input", { id: "size", type: "text", value: size, onChange: (e) => setSize(e.target.value), className: inputCls, placeholder: "Optional for bags" }) }), _jsx(Field, { label: "SKU", id: "sku", children: _jsx("input", { id: "sku", type: "text", value: sku, onChange: (e) => setSku(e.target.value), className: inputCls, placeholder: "Auto-generated if empty" }) }), _jsx(Field, { label: "Price (USD)", id: "price", required: true, children: _jsx("input", { id: "price", type: "number", required: true, min: 0, step: "0.01", value: price, onChange: (e) => setPrice(e.target.value), className: inputCls, placeholder: "2500" }) }), _jsx(Field, { label: "Status", id: "status", children: _jsxs("select", { id: "status", value: status, onChange: (e) => setStatus(e.target.value), className: inputCls, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "draft", children: "Draft" })] }) }), _jsx(Field, { label: "Initial stock", id: "stock", children: _jsx("input", { id: "stock", type: "number", min: 0, value: initialStock, onChange: (e) => setInitialStock(e.target.value), className: inputCls, placeholder: "Inventory quantity for this SKU" }) })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-xl bg-[#6D4AFF] py-3 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: loading ? "Creating…" : "Create product" })] })] }));
}
// Backend returns a raw Postgres error string for ID collisions instead of a 409.
function friendlyCreateError(err) {
    const message = err instanceof Error ? err.message : "";
    if (/duplicate key|23505|already exists/i.test(message)) {
        return "A product with this ID already exists. Leave the ID blank to auto-generate one, or choose a different ID.";
    }
    return message || "Failed to create product";
}
function Field({ label, id, required, children, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { htmlFor: id, className: "text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "text-red-500", children: " *" })] }), children] }));
}

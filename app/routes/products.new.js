import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { DEFAULT_DISCOUNT_RATE, createProductParent, createStyle, createVariant, listBrands, listColors, listEditions, listSizes, listStyles, salePriceFromList, setInventory, uploadProductImage, uploadVariantImage, } from "~/lib/api";
import { useNotify } from "~/lib/notifications";
export function meta() {
    return [{ title: "New Product | Dupli1 Admin" }];
}
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const DEFAULT_DISCOUNT_PCT = String(Math.round(DEFAULT_DISCOUNT_RATE * 100));
const inputCls = "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";
export default function NewProduct() {
    const navigate = useNavigate();
    const { notify } = useNotify();
    const imageInputRef = useRef(null);
    const [brands, setBrands] = useState([]);
    const [styles, setStyles] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [editions, setEditions] = useState([]);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [name, setName] = useState("");
    const [brandCode, setBrandCode] = useState("");
    const [styleCode, setStyleCode] = useState("");
    const [newStyleCode, setNewStyleCode] = useState("");
    const [newStyleName, setNewStyleName] = useState("");
    const [creatingStyle, setCreatingStyle] = useState(false);
    const [material, setMaterial] = useState("");
    const [description, setDescription] = useState("");
    const [colorCode, setColorCode] = useState("");
    const [sizeCode, setSizeCode] = useState("OS");
    const [editionCode, setEditionCode] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [discountPct, setDiscountPct] = useState(DEFAULT_DISCOUNT_PCT);
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState("active");
    const [initialStock, setInitialStock] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let cancelled = false;
        Promise.all([listBrands(), listColors(), listSizes(), listEditions()])
            .then(([b, c, s, e]) => {
            if (cancelled)
                return;
            setBrands(b);
            setColors(c);
            setSizes(s);
            setEditions(e);
            if (b[0])
                setBrandCode(b[0].code);
            if (c[0])
                setColorCode(c[0].code);
            if (s.some((row) => row.code === "OS"))
                setSizeCode("OS");
            else if (s[0])
                setSizeCode(s[0].code);
        })
            .catch((err) => {
            if (!cancelled) {
                notify(err instanceof Error ? err.message : "Failed to load catalog masters", "error");
            }
        })
            .finally(() => {
            if (!cancelled)
                setMastersLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [notify]);
    useEffect(() => {
        if (!brandCode) {
            setStyles([]);
            setStyleCode("");
            return;
        }
        let cancelled = false;
        listStyles(brandCode)
            .then((rows) => {
            if (cancelled)
                return;
            setStyles(rows);
            setStyleCode((prev) => rows.some((r) => r.code === prev) ? prev : rows[0]?.code ?? "");
        })
            .catch((err) => {
            if (!cancelled) {
                notify(err instanceof Error ? err.message : "Failed to load styles", "error");
                setStyles([]);
                setStyleCode("");
            }
        });
        return () => {
            cancelled = true;
        };
    }, [brandCode, notify]);
    useEffect(() => {
        if (!imageFile) {
            setImagePreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setImagePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);
    function clearImage() {
        setImageFile(null);
        if (imageInputRef.current)
            imageInputRef.current.value = "";
    }
    function handleImageChange(e) {
        const file = e.target.files?.[0];
        if (!file) {
            setImageFile(null);
            return;
        }
        if (!file.type.startsWith("image/")) {
            notify("Please choose an image file", "error");
            e.target.value = "";
            setImageFile(null);
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            notify("Image must be 50 MiB or smaller", "error");
            e.target.value = "";
            setImageFile(null);
            return;
        }
        setImageFile(file);
    }
    async function applyInitialStock(variantSku) {
        const stockQty = Number.parseInt(initialStock, 10);
        if (!Number.isNaN(stockQty) && stockQty >= 0 && variantSku) {
            await setInventory(variantSku, stockQty).catch(() => { });
        }
    }
    async function uploadSelectedImage(opts) {
        if (!imageFile)
            return true;
        try {
            if (opts.variantSku) {
                await uploadVariantImage(opts.productId, opts.variantSku, imageFile);
            }
            else {
                await uploadProductImage(opts.productId, imageFile);
            }
            return true;
        }
        catch (err) {
            notify(`Product created, but image upload failed: ${err instanceof Error ? err.message : "unknown error"}. You can retry from the product page.`, "error");
            return false;
        }
    }
    async function handleCreateStyle(e) {
        e.preventDefault();
        if (!brandCode)
            return;
        const code = newStyleCode.trim().toUpperCase();
        const styleName = newStyleName.trim() || name.trim();
        if (!code || !styleName) {
            notify("Style code and name are required", "error");
            return;
        }
        setCreatingStyle(true);
        try {
            const created = await createStyle(brandCode, code, styleName);
            const rows = await listStyles(brandCode);
            setStyles(rows);
            setStyleCode(created.code);
            setNewStyleCode("");
            setNewStyleName("");
            notify(`Style ${created.code} created`);
        }
        catch (err) {
            notify(err instanceof Error ? err.message : "Failed to create style", "error");
        }
        finally {
            setCreatingStyle(false);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            if (!brandCode || !styleCode) {
                throw new Error("Select an existing brand and style (create them under Catalog if needed)");
            }
            if (!colorCode || !sizeCode) {
                throw new Error("Select color and size codes from catalog masters");
            }
            const parsedList = Number.parseFloat(sellingPrice);
            const parsedDiscount = Number.parseFloat(discountPct) / 100;
            const parsedPrice = Number.parseFloat(price);
            if (Number.isNaN(parsedList) || parsedList < 0) {
                throw new Error("Enter a valid list (selling) price");
            }
            if (Number.isNaN(parsedDiscount) ||
                parsedDiscount < 0 ||
                parsedDiscount >= 1) {
                throw new Error("Discount rate must be between 0 and 99%");
            }
            if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                throw new Error("Enter a valid sale price for the first variant");
            }
            const brandName = brands.find((b) => b.code === brandCode)?.name;
            const colorName = colors.find((c) => c.code === colorCode)?.name;
            const sizeName = sizes.find((s) => s.code === sizeCode)?.name;
            const parent = await createProductParent({
                name: name.trim(),
                brandCode,
                styleCode,
                brand: brandName,
                material: material.trim(),
                description: description.trim() || undefined,
                status,
            });
            let createdVariantSku;
            try {
                const variant = await createVariant(parent.id, {
                    colorCode,
                    sizeCode,
                    editionCode: editionCode || undefined,
                    color: colorName,
                    size: sizeName,
                    sellingPrice: parsedList,
                    price: parsedPrice,
                    status,
                });
                createdVariantSku = variant.sku;
                await applyInitialStock(variant.sku);
            }
            catch (err) {
                notify(`Style "${name.trim()}" was created, but the first variant failed: ${err instanceof Error ? err.message : "unknown error"}. Add a variant from the product page to finish setup.`, "error");
                navigate(`/products/${encodeURIComponent(parent.id)}`);
                return;
            }
            const uploaded = await uploadSelectedImage({
                productId: parent.id,
                variantSku: createdVariantSku,
            });
            if (uploaded)
                notify(`Product created: ${name.trim()}`);
            navigate(`/products/${encodeURIComponent(parent.id)}`);
        }
        catch (err) {
            notify(friendlyCreateError(err), "error");
        }
        finally {
            setLoading(false);
        }
    }
    if (mastersLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-32", children: _jsx("div", { className: "h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" }) }));
    }
    return (_jsxs("div", { className: "mx-auto max-w-lg space-y-6", children: [_jsx(Link, { to: "/products", className: "text-sm text-[#6D4AFF] hover:underline", children: "\u2190 Back to products" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-[#1C1B1F] sm:text-2xl", children: "New product" }), _jsxs("p", { className: "mt-0.5 text-sm text-[#6B6480]", children: ["Parent gets a ULID id; human identity is brand + style. Masters must exist first \u2014 manage them in", " ", _jsx(Link, { to: "/catalog", className: "text-[#6D4AFF] hover:underline", children: "Catalog" }), "."] })] }), brands.length === 0 && (_jsx("div", { className: "rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900", children: "No brands yet. Create brand and style codes under Catalog before adding products." })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]", children: [_jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "Style (parent)" }), _jsx(Field, { label: "Name", id: "name", required: true, children: _jsx("input", { id: "name", type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), className: inputCls, placeholder: "Cassette Bag" }) }), _jsx(Field, { label: "Brand code", id: "brandCode", required: true, children: _jsx("select", { id: "brandCode", required: true, value: brandCode, onChange: (e) => setBrandCode(e.target.value), className: inputCls, disabled: brands.length === 0, children: brands.length === 0 ? (_jsx("option", { value: "", children: "No brands" })) : (brands.map((b) => (_jsxs("option", { value: b.code, children: [b.code, " \u2014 ", b.name] }, b.code)))) }) }), _jsx(Field, { label: "Style code", id: "styleCode", required: true, children: _jsx("select", { id: "styleCode", required: true, value: styleCode, onChange: (e) => setStyleCode(e.target.value), className: inputCls, disabled: styles.length === 0, children: styles.length === 0 ? (_jsx("option", { value: "", children: "Create a style below" })) : (styles.map((s) => (_jsxs("option", { value: s.code, children: [s.code, " \u2014 ", s.name] }, s.code)))) }) }), _jsxs("div", { className: "rounded-xl border border-dashed border-[#E5E3EE] bg-[#FAFAFA] p-4 space-y-3", children: [_jsxs("p", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: ["Or create style under ", brandCode || "brand"] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsx("input", { value: newStyleCode, onChange: (e) => setNewStyleCode(e.target.value.toUpperCase()), className: inputCls, placeholder: "CAS001", disabled: !brandCode || creatingStyle }), _jsx("input", { value: newStyleName, onChange: (e) => setNewStyleName(e.target.value), className: inputCls, placeholder: name.trim() || "Cassette", disabled: !brandCode || creatingStyle })] }), _jsx("button", { type: "button", onClick: handleCreateStyle, disabled: !brandCode || creatingStyle, className: "rounded-xl border border-[#E5E3EE] px-3 py-2 text-xs font-semibold text-[#6D4AFF] hover:border-[#6D4AFF]/40 disabled:opacity-60", children: creatingStyle ? "Creating…" : "Create style" })] }), _jsx(Field, { label: "Material", id: "material", required: true, children: _jsx("input", { id: "material", type: "text", required: true, value: material, onChange: (e) => setMaterial(e.target.value), className: inputCls }) }), _jsx(Field, { label: "Description", id: "description", children: _jsx("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), rows: 3, className: inputCls, placeholder: "Optional" }) })] }), _jsxs("section", { className: "space-y-4 border-t border-[#F0EEF8] pt-6", children: [_jsx("h2", { className: "text-xs font-semibold uppercase tracking-wide text-[#9D98B3]", children: "First variant (SKU)" }), _jsx(Field, { label: "Color code", id: "colorCode", required: true, children: _jsx("select", { id: "colorCode", required: true, value: colorCode, onChange: (e) => setColorCode(e.target.value), className: inputCls, children: colors.map((c) => (_jsxs("option", { value: c.code, children: [c.code, " \u2014 ", c.name] }, c.code))) }) }), _jsx(Field, { label: "Size code", id: "sizeCode", required: true, children: _jsx("select", { id: "sizeCode", required: true, value: sizeCode, onChange: (e) => setSizeCode(e.target.value), className: inputCls, children: sizes.map((s) => (_jsxs("option", { value: s.code, children: [s.code, " \u2014 ", s.name] }, s.code))) }) }), _jsx(Field, { label: "Edition code", id: "editionCode", children: _jsxs("select", { id: "editionCode", value: editionCode, onChange: (e) => setEditionCode(e.target.value), className: inputCls, children: [_jsx("option", { value: "", children: "None" }), editions.map((ed) => (_jsxs("option", { value: ed.code, children: [ed.code, " \u2014 ", ed.name] }, ed.code)))] }) }), _jsx(Field, { label: "List price (USD)", id: "sellingPrice", required: true, children: _jsx("input", { id: "sellingPrice", type: "number", required: true, min: 0, step: "0.01", value: sellingPrice, onChange: (e) => {
                                        const next = e.target.value;
                                        setSellingPrice(next);
                                        const list = Number.parseFloat(next);
                                        const rate = Number.parseFloat(discountPct) / 100;
                                        if (!Number.isNaN(list) && list >= 0 && !Number.isNaN(rate)) {
                                            setPrice(String(salePriceFromList(list, rate)));
                                        }
                                    }, className: inputCls, placeholder: "Official / strikethrough price" }) }), _jsx(Field, { label: "Discount rate (%)", id: "discountPct", required: true, children: _jsx("input", { id: "discountPct", type: "number", required: true, min: 0, max: 99, step: "1", value: discountPct, onChange: (e) => {
                                        const next = e.target.value;
                                        setDiscountPct(next);
                                        const list = Number.parseFloat(sellingPrice);
                                        const rate = Number.parseFloat(next) / 100;
                                        if (!Number.isNaN(list) && list >= 0 && !Number.isNaN(rate)) {
                                            setPrice(String(salePriceFromList(list, rate)));
                                        }
                                    }, className: inputCls }) }), _jsx(Field, { label: "Sale price (USD)", id: "price", required: true, children: _jsx("input", { id: "price", type: "number", required: true, min: 0, step: "0.01", value: price, onChange: (e) => setPrice(e.target.value), className: inputCls, placeholder: "Charged at checkout" }) }), _jsxs("p", { className: "text-xs text-[#6B6480]", children: ["Default discount is ", DEFAULT_DISCOUNT_PCT, "%. Sale price updates when you change list price or discount; you can still override sale price."] }), _jsx(Field, { label: "Status", id: "status", children: _jsxs("select", { id: "status", value: status, onChange: (e) => setStatus(e.target.value), className: inputCls, children: [_jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] }) }), _jsx(Field, { label: "Initial stock", id: "stock", children: _jsx("input", { id: "stock", type: "number", min: 0, value: initialStock, onChange: (e) => setInitialStock(e.target.value), className: inputCls, placeholder: "Inventory quantity for this SKU" }) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: "Image" }), _jsx("p", { className: "text-sm text-[#6B6480]", children: "Optional. Uploaded to this variant after the product is created (max 50 MiB)." }), _jsx("input", { ref: imageInputRef, id: "image", type: "file", accept: "image/*", className: "hidden", onChange: handleImageChange, disabled: loading }), imageFile && imagePreviewUrl ? (_jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] p-3", children: [_jsx("img", { src: imagePreviewUrl, alt: "", className: "h-20 w-20 shrink-0 rounded-lg object-cover" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm font-medium text-[#1C1B1F]", children: imageFile.name }), _jsxs("p", { className: "mt-0.5 text-xs text-[#9D98B3]", children: [(imageFile.size / 1024).toFixed(1), " KB"] }), _jsxs("div", { className: "mt-2 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => imageInputRef.current?.click(), disabled: loading, className: "text-xs font-semibold text-[#6D4AFF] hover:underline disabled:opacity-60", children: "Replace" }), _jsx("button", { type: "button", onClick: clearImage, disabled: loading, className: "text-xs font-semibold text-[#9D98B3] hover:underline disabled:opacity-60", children: "Remove" })] })] })] })) : (_jsx("button", { type: "button", onClick: () => imageInputRef.current?.click(), disabled: loading, className: "inline-flex w-full items-center justify-center rounded-xl border border-dashed border-[#E5E3EE] bg-[#FAFAFA] px-4 py-8 text-sm font-semibold text-[#6D4AFF] transition hover:border-[#6D4AFF]/40 hover:bg-[#F8F7FC] disabled:opacity-60", children: "Choose image" }))] })] }), _jsx("button", { type: "submit", disabled: loading || brands.length === 0 || !styleCode, className: "w-full rounded-xl bg-[#6D4AFF] py-3 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60", children: loading ? (imageFile ? "Creating & uploading…" : "Creating…") : "Create product" })] })] }));
}
function friendlyCreateError(err) {
    const message = err instanceof Error ? err.message : "";
    if (/master not found|not found/i.test(message)) {
        return "A brand, style, color, or size code is missing from catalog masters. Create it under Catalog first.";
    }
    if (/brandCode and styleCode|colorCode|sizeCode|missing/i.test(message)) {
        return message;
    }
    if (/duplicate key|23505|already exists/i.test(message)) {
        return "A product with this brand/style already exists, or the composed SKU collides.";
    }
    return message || "Failed to create product";
}
function Field({ label, id, required, children, }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { htmlFor: id, className: "text-xs font-semibold uppercase tracking-wide text-[#6B6480]", children: [label, required && _jsx("span", { className: "text-red-500", children: " *" })] }), children] }));
}

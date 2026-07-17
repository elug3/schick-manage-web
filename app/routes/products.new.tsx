import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  type CatalogCodeName,
  type CatalogStyle,
  DEFAULT_DISCOUNT_RATE,
  createProductParent,
  createStyle,
  createVariant,
  listBrands,
  listColors,
  listEditions,
  listSizes,
  listStyles,
  salePriceFromList,
  setInventory,
  uploadProductImage,
  uploadVariantImage,
} from "~/lib/api";
import { useNotify } from "~/lib/notifications";

export function meta() {
  return [{ title: "New Product | Dupli1 Admin" }];
}

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const DEFAULT_DISCOUNT_PCT = String(Math.round(DEFAULT_DISCOUNT_RATE * 100));

const inputCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition placeholder:text-[#B4B0C8] focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

export default function NewProduct() {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [brands, setBrands] = useState<CatalogCodeName[]>([]);
  const [styles, setStyles] = useState<CatalogStyle[]>([]);
  const [colors, setColors] = useState<CatalogCodeName[]>([]);
  const [sizes, setSizes] = useState<CatalogCodeName[]>([]);
  const [editions, setEditions] = useState<CatalogCodeName[]>([]);
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listBrands(), listColors(), listSizes(), listEditions()])
      .then(([b, c, s, e]) => {
        if (cancelled) return;
        setBrands(b);
        setColors(c);
        setSizes(s);
        setEditions(e);
        if (b[0]) setBrandCode(b[0].code);
        if (c[0]) setColorCode(c[0].code);
        if (s.some((row) => row.code === "OS")) setSizeCode("OS");
        else if (s[0]) setSizeCode(s[0].code);
      })
      .catch((err) => {
        if (!cancelled) {
          notify(
            err instanceof Error ? err.message : "Failed to load catalog masters",
            "error"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setMastersLoading(false);
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
        if (cancelled) return;
        setStyles(rows);
        setStyleCode((prev) =>
          rows.some((r) => r.code === prev) ? prev : rows[0]?.code ?? ""
        );
      })
      .catch((err) => {
        if (!cancelled) {
          notify(
            err instanceof Error ? err.message : "Failed to load styles",
            "error"
          );
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
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function applyInitialStock(variantSku: string) {
    const stockQty = Number.parseInt(initialStock, 10);
    if (!Number.isNaN(stockQty) && stockQty >= 0 && variantSku) {
      await setInventory(variantSku, stockQty).catch(() => {});
    }
  }

  async function uploadSelectedImage(opts: {
    productId: string;
    variantSku?: string;
  }): Promise<boolean> {
    if (!imageFile) return true;

    try {
      if (opts.variantSku) {
        await uploadVariantImage(opts.productId, opts.variantSku, imageFile);
      } else {
        await uploadProductImage(opts.productId, imageFile);
      }
      return true;
    } catch (err) {
      notify(
        `Product created, but image upload failed: ${
          err instanceof Error ? err.message : "unknown error"
        }. You can retry from the product page.`,
        "error"
      );
      return false;
    }
  }

  async function handleCreateStyle(e: React.FormEvent) {
    e.preventDefault();
    if (!brandCode) return;
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
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create style", "error");
    } finally {
      setCreatingStyle(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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
      if (
        Number.isNaN(parsedDiscount) ||
        parsedDiscount < 0 ||
        parsedDiscount >= 1
      ) {
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

      let createdVariantSku: string | undefined;
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
      } catch (err) {
        notify(
          `Style "${name.trim()}" was created, but the first variant failed: ${
            err instanceof Error ? err.message : "unknown error"
          }. Add a variant from the product page to finish setup.`,
          "error"
        );
        navigate(`/products/${encodeURIComponent(parent.id)}`);
        return;
      }

      const uploaded = await uploadSelectedImage({
        productId: parent.id,
        variantSku: createdVariantSku,
      });
      if (uploaded) notify(`Product created: ${name.trim()}`);
      navigate(`/products/${encodeURIComponent(parent.id)}`);
    } catch (err) {
      notify(friendlyCreateError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  if (mastersLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/products" className="text-sm text-[#6D4AFF] hover:underline">
        ← Back to products
      </Link>

      <div>
        <h1 className="text-xl font-bold text-[#1C1B1F] sm:text-2xl">New product</h1>
        <p className="mt-0.5 text-sm text-[#6B6480]">
          Parent gets a ULID id; human identity is brand + style. Masters must
          exist first — manage them in{" "}
          <Link to="/catalog" className="text-[#6D4AFF] hover:underline">
            Catalog
          </Link>
          .
        </p>
      </div>

      {brands.length === 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No brands yet. Create brand and style codes under Catalog before adding
          products.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-[#E5E3EE] bg-white p-6 shadow-[0_1px_4px_rgba(28,27,31,0.04)]"
      >
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
            Style (parent)
          </h2>
          <Field label="Name" id="name" required>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Cassette Bag"
            />
          </Field>
          <Field label="Brand code" id="brandCode" required>
            <select
              id="brandCode"
              required
              value={brandCode}
              onChange={(e) => setBrandCode(e.target.value)}
              className={inputCls}
              disabled={brands.length === 0}
            >
              {brands.length === 0 ? (
                <option value="">No brands</option>
              ) : (
                brands.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))
              )}
            </select>
          </Field>
          <Field label="Style code" id="styleCode" required>
            <select
              id="styleCode"
              required
              value={styleCode}
              onChange={(e) => setStyleCode(e.target.value)}
              className={inputCls}
              disabled={styles.length === 0}
            >
              {styles.length === 0 ? (
                <option value="">Create a style below</option>
              ) : (
                styles.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))
              )}
            </select>
          </Field>

          <div className="rounded-xl border border-dashed border-[#E5E3EE] bg-[#FAFAFA] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
              Or create style under {brandCode || "brand"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={newStyleCode}
                onChange={(e) => setNewStyleCode(e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="CAS001"
                disabled={!brandCode || creatingStyle}
              />
              <input
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                className={inputCls}
                placeholder={name.trim() || "Cassette"}
                disabled={!brandCode || creatingStyle}
              />
            </div>
            <button
              type="button"
              onClick={handleCreateStyle}
              disabled={!brandCode || creatingStyle}
              className="rounded-xl border border-[#E5E3EE] px-3 py-2 text-xs font-semibold text-[#6D4AFF] hover:border-[#6D4AFF]/40 disabled:opacity-60"
            >
              {creatingStyle ? "Creating…" : "Create style"}
            </button>
          </div>

          <Field label="Material" id="material" required>
            <input
              id="material"
              type="text"
              required
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Description" id="description">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Optional"
            />
          </Field>
        </section>

        <section className="space-y-4 border-t border-[#F0EEF8] pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
            First variant (SKU)
          </h2>
          <Field label="Color code" id="colorCode" required>
            <select
              id="colorCode"
              required
              value={colorCode}
              onChange={(e) => setColorCode(e.target.value)}
              className={inputCls}
            >
              {colors.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size code" id="sizeCode" required>
            <select
              id="sizeCode"
              required
              value={sizeCode}
              onChange={(e) => setSizeCode(e.target.value)}
              className={inputCls}
            >
              {sizes.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Edition code" id="editionCode">
            <select
              id="editionCode"
              value={editionCode}
              onChange={(e) => setEditionCode(e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {editions.map((ed) => (
                <option key={ed.code} value={ed.code}>
                  {ed.code} — {ed.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="List price (USD)" id="sellingPrice" required>
            <input
              id="sellingPrice"
              type="number"
              required
              min={0}
              step="0.01"
              value={sellingPrice}
              onChange={(e) => {
                const next = e.target.value;
                setSellingPrice(next);
                const list = Number.parseFloat(next);
                const rate = Number.parseFloat(discountPct) / 100;
                if (!Number.isNaN(list) && list >= 0 && !Number.isNaN(rate)) {
                  setPrice(String(salePriceFromList(list, rate)));
                }
              }}
              className={inputCls}
              placeholder="Official / strikethrough price"
            />
          </Field>
          <Field label="Discount rate (%)" id="discountPct" required>
            <input
              id="discountPct"
              type="number"
              required
              min={0}
              max={99}
              step="1"
              value={discountPct}
              onChange={(e) => {
                const next = e.target.value;
                setDiscountPct(next);
                const list = Number.parseFloat(sellingPrice);
                const rate = Number.parseFloat(next) / 100;
                if (!Number.isNaN(list) && list >= 0 && !Number.isNaN(rate)) {
                  setPrice(String(salePriceFromList(list, rate)));
                }
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Sale price (USD)" id="price" required>
            <input
              id="price"
              type="number"
              required
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
              placeholder="Charged at checkout"
            />
          </Field>
          <p className="text-xs text-[#6B6480]">
            Default discount is {DEFAULT_DISCOUNT_PCT}%. Sale price updates when
            you change list price or discount; you can still override sale
            price.
          </p>
          <Field label="Status" id="status">
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputCls}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Initial stock" id="stock">
            <input
              id="stock"
              type="number"
              min={0}
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className={inputCls}
              placeholder="Inventory quantity for this SKU"
            />
          </Field>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
              Image
            </span>
            <p className="text-sm text-[#6B6480]">
              Optional. Uploaded to this variant after the product is created
              (max 50 MiB).
            </p>
            <input
              ref={imageInputRef}
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={loading}
            />
            {imageFile && imagePreviewUrl ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#E5E3EE] bg-[#FAFAFA] p-3">
                <img
                  src={imagePreviewUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1C1B1F]">
                    {imageFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#9D98B3]">
                    {(imageFile.size / 1024).toFixed(1)} KB
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={loading}
                      className="text-xs font-semibold text-[#6D4AFF] hover:underline disabled:opacity-60"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={clearImage}
                      disabled={loading}
                      className="text-xs font-semibold text-[#9D98B3] hover:underline disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl border border-dashed border-[#E5E3EE] bg-[#FAFAFA] px-4 py-8 text-sm font-semibold text-[#6D4AFF] transition hover:border-[#6D4AFF]/40 hover:bg-[#F8F7FC] disabled:opacity-60"
              >
                Choose image
              </button>
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || brands.length === 0 || !styleCode}
          className="w-full rounded-xl bg-[#6D4AFF] py-3 text-sm font-semibold text-white transition hover:bg-[#5A38E8] disabled:opacity-60"
        >
          {loading ? (imageFile ? "Creating & uploading…" : "Creating…") : "Create product"}
        </button>
      </form>
    </div>
  );
}

function friendlyCreateError(err: unknown): string {
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

function Field({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

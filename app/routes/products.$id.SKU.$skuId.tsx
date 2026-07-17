import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  type Product,
  type ProductVariant,
  DEFAULT_DISCOUNT_RATE,
  deleteVariant,
  discountRateFromPrices,
  findVariant,
  formatVariantOption,
  getInventory,
  getInventoryBySkuId,
  getManageProduct,
  salePriceFromList,
  setInventory,
  updateVariant,
  uploadVariantImage,
} from "~/lib/api";
import { useNotify } from "~/lib/notifications";

export function meta() {
  return [{ title: "SKU | Dupli1 Admin" }];
}

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const DEFAULT_DISCOUNT_PCT = String(Math.round(DEFAULT_DISCOUNT_RATE * 100));
const fieldCls =
  "w-full rounded-xl border border-[#E5E3EE] bg-[#F8F7FC] px-4 py-2.5 text-sm text-[#1C1B1F] outline-none transition focus:border-[#6D4AFF] focus:ring-2 focus:ring-[#6D4AFF]/20";

export default function SkuDetail() {
  const { id, skuId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [reserved, setReserved] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !skuId) return;
    setLoading(true);
    setError(null);
    try {
      const p = await getManageProduct(id);
      const v = findVariant(p, skuId);
      if (!v) {
        setProduct(p);
        setVariant(null);
        setError("SKU not found on this product");
        return;
      }
      setProduct(p);
      setVariant(v);

      try {
        const stock = v.skuId
          ? await getInventoryBySkuId(v.skuId).catch(() => getInventory(v.sku))
          : await getInventory(v.sku);
        setQuantity(stock.quantity);
        setReserved(stock.reserved);
      } catch {
        setQuantity(null);
        setReserved(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SKU");
      setProduct(null);
      setVariant(null);
    } finally {
      setLoading(false);
    }
  }, [id, skuId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
      </div>
    );
  }

  if (error || !product || !variant) {
    return (
      <div className="space-y-4">
        <Link
          to={id ? `/products/${encodeURIComponent(id)}` : "/products"}
          className="text-sm text-[#6D4AFF] hover:underline"
        >
          ← Back to product
        </Link>
        <div className="rounded-2xl border border-[#E5E3EE] bg-white p-10 text-center text-[#6B6480]">
          {error ?? "SKU not found"}
        </div>
      </div>
    );
  }

  const discount = discountRateFromPrices(variant.sellingPrice, variant.price);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to="/products" className="text-[#6D4AFF] hover:underline">
          Products
        </Link>
        <span className="text-[#9D98B3]">/</span>
        <Link
          to={`/products/${encodeURIComponent(product.id)}`}
          className="text-[#6D4AFF] hover:underline"
        >
          {product.name}
        </Link>
        <span className="text-[#9D98B3]">/</span>
        <span className="font-mono text-xs text-[#1C1B1F]">{variant.sku}</span>
      </div>

      <div className="rounded-2xl border border-[#E5E3EE] bg-white p-5 shadow-[0_1px_4px_rgba(28,27,31,0.04)] sm:p-8 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
            SKU detail
          </p>
          <h1 className="mt-1 font-mono text-xl font-bold text-[#1C1B1F] sm:text-2xl">
            {variant.sku}
          </h1>
          <p className="mt-1 text-sm text-[#6B6480]">
            {formatVariantOption(variant)} · {product.name}
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Human SKU", variant.sku],
            ["skuId", variant.skuId ?? "—"],
            ["Product ID", product.id],
            ["Color", variant.color || "—"],
            ["Size", variant.size || "—"],
            ["Color code", variant.colorCode ?? "—"],
            ["Size code", variant.sizeCode ?? "—"],
            ["Edition code", variant.editionCode ?? "—"],
            [
              "List price",
              variant.sellingPrice != null
                ? formatCurrency(variant.sellingPrice)
                : "—",
            ],
            ["Sale price", formatCurrency(variant.price)],
            [
              "Discount",
              discount != null ? `${Math.round(discount * 100)}%` : "—",
            ],
            ["Status", variant.status],
            [
              "Stock",
              quantity == null
                ? "—"
                : reserved != null && reserved > 0
                  ? `${quantity} (${reserved} reserved)`
                  : String(quantity),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
                {label}
              </dt>
              <dd className="mt-1 break-all text-sm text-[#1C1B1F]">{value}</dd>
            </div>
          ))}
        </dl>

        <StockSection
          sku={variant.sku}
          quantity={quantity}
          onSaved={async (qty) => {
            setQuantity(qty);
            notify(`Stock updated for ${variant.sku}`);
          }}
        />

        <ImagesSection
          productId={product.id}
          variant={variant}
          onUploaded={(updated) => {
            setVariant(updated);
            notify("Image uploaded");
          }}
        />

        <EditSection
          productId={product.id}
          variant={variant}
          onSaved={async () => {
            await load();
            notify("SKU updated");
          }}
        />

        <div className="border-t border-[#F0EEF8] pt-6">
          <button
            type="button"
            className="text-sm font-semibold text-red-600 hover:underline"
            onClick={async () => {
              if (
                !window.confirm(
                  `Delete variant ${variant.sku}? This cannot be undone.`
                )
              ) {
                return;
              }
              try {
                await deleteVariant(product.id, variant.sku);
                notify(`Deleted ${variant.sku}`);
                navigate(`/products/${encodeURIComponent(product.id)}`);
              } catch (err) {
                notify(
                  err instanceof Error ? err.message : "Failed to delete SKU",
                  "error"
                );
              }
            }}
          >
            Delete SKU
          </button>
        </div>
      </div>
    </div>
  );
}

function StockSection({
  sku,
  quantity,
  onSaved,
}: {
  sku: string;
  quantity: number | null;
  onSaved: (quantity: number) => Promise<void>;
}) {
  const { notify } = useNotify();
  const [value, setValue] = useState(quantity == null ? "" : String(quantity));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(quantity == null ? "" : String(quantity));
  }, [quantity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number.parseInt(value, 10);
    if (Number.isNaN(qty) || qty < 0) {
      notify("Enter a valid stock quantity", "error");
      return;
    }
    setSaving(true);
    try {
      const item = await setInventory(sku, qty);
      await onSaved(item.quantity);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update stock", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3 border-t border-[#F0EEF8] pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
        Inventory
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Quantity
          </span>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`w-36 ${fieldCls}`}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Update stock"}
        </button>
      </form>
    </section>
  );
}

function ImagesSection({
  productId,
  variant,
  onUploaded,
}: {
  productId: string;
  variant: ProductVariant;
  onUploaded: (variant: ProductVariant) => void;
}) {
  const { notify } = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file", "error");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify("Image must be 50 MiB or smaller", "error");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const updated = await uploadVariantImage(productId, variant.sku, file);
      onUploaded(updated);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <section className="space-y-3 border-t border-[#F0EEF8] pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
        Images
      </h2>
      {variant.imageUrls.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {variant.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-28 w-28 rounded-xl border border-[#E5E3EE] object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B6480]">No images yet.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border border-dashed border-[#E5E3EE] px-4 py-2.5 text-sm font-semibold text-[#6D4AFF] hover:border-[#6D4AFF]/40 disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "Upload image"}
      </button>
    </section>
  );
}

function EditSection({
  productId,
  variant,
  onSaved,
}: {
  productId: string;
  variant: ProductVariant;
  onSaved: () => Promise<void>;
}) {
  const { notify } = useNotify();
  const [color, setColor] = useState(variant.color);
  const [size, setSize] = useState(variant.size);
  const [sellingPrice, setSellingPrice] = useState(
    variant.sellingPrice != null ? String(variant.sellingPrice) : ""
  );
  const initialDiscount =
    discountRateFromPrices(variant.sellingPrice, variant.price) ??
    DEFAULT_DISCOUNT_RATE;
  const [discountPct, setDiscountPct] = useState(
    String(Math.round(initialDiscount * 100))
  );
  const [price, setPrice] = useState(String(variant.price));
  const [status, setStatus] = useState(variant.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColor(variant.color);
    setSize(variant.size);
    setSellingPrice(
      variant.sellingPrice != null ? String(variant.sellingPrice) : ""
    );
    const rate =
      discountRateFromPrices(variant.sellingPrice, variant.price) ??
      DEFAULT_DISCOUNT_RATE;
    setDiscountPct(String(Math.round(rate * 100)));
    setPrice(String(variant.price));
    setStatus(variant.status);
  }, [variant]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedSale = Number.parseFloat(price);
    const parsedList = Number.parseFloat(sellingPrice);
    if (Number.isNaN(parsedSale) || parsedSale < 0) {
      notify("Enter a valid sale price", "error");
      return;
    }
    setSaving(true);
    try {
      await updateVariant(productId, variant.sku, {
        color: color.trim(),
        size: size.trim(),
        price: parsedSale,
        sellingPrice: Number.isNaN(parsedList) ? undefined : parsedList,
        status: status.trim() || "active",
      });
      await onSaved();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update SKU", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-[#F0EEF8] pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#9D98B3]">
        Edit SKU
      </h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Color
          </span>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={fieldCls}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Size
          </span>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className={fieldCls}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            List price
          </span>
          <input
            type="number"
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
            className={fieldCls}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Discount (%)
          </span>
          <input
            type="number"
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
            className={fieldCls}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Sale price
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={fieldCls}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6480]">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={fieldCls}
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="mb-3 text-xs text-[#6B6480]">
            Default discount is {DEFAULT_DISCOUNT_PCT}%. Sale price updates from
            list × (1 − discount); you can override sale price.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(n);
}

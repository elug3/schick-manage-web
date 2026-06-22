import { authedFetch } from "./auth";

export type ProductStatus = "active" | "draft" | "archived";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  description: string;
  imageUrls?: string[];
  brand?: string;
  color?: string;
  material?: string;
  status: ProductStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  items: OrderItem[];
  itemCount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardStats {
  activeProducts: number;
}

export interface AnalyticsSummary {
  revenue7d: number;
  revenue30d: number;
  revenue90d: number;
  orders7d: number;
  orders30d: number;
  topCategories: { category: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; sold: number; revenue: number }[];
}

// ── Products ─────────────────────────────────────────────────────────────────
// Routes through Vite proxy: /api → localhost:8081 (product service)

export async function getProducts(): Promise<Product[]> {
  const res = await authedFetch("/api/products");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch products");
  }
  return res.json() as Promise<Product[]>;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await authedFetch(`/api/products/${id}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Product not found");
  }
  return res.json() as Promise<Product>;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt">
): Promise<Product> {
  const res = await authedFetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to create product");
  }
  return res.json() as Promise<Product>;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product> {
  const res = await authedFetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update product");
  }
  return res.json() as Promise<Product>;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await authedFetch(`/api/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
}

// Uses XHR so callers can track upload progress for large files.
export function uploadProductImage(
  id: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<Product> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("schick_at") ?? "";
    const fd = new FormData();
    fd.append("image", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/products/${id}/image`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText) as Product); }
        catch { reject(new Error("Invalid response from server")); }
      } else {
        try {
          const b = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(b.error ?? `Upload failed (${xhr.status})`));
        } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}

// ── Users ────────────────────────────────────────────────────────────────────
// Routes through Vite proxy: /api/v1 → localhost:8080 (auth service)

export type UserRole = "owner" | "admin" | "user";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export async function getUsers(): Promise<AdminUser[]> {
  const res = await authedFetch("/api/v1/users");
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to fetch users");
  }
  return res.json() as Promise<AdminUser[]>;
}

export async function updateUserRole(id: string, role: UserRole): Promise<AdminUser> {
  const res = await authedFetch(`/api/v1/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update role");
  }
  return res.json() as Promise<AdminUser>;
}

export async function createUser(data: {
  email: string;
  password: string;
  role: UserRole;
}): Promise<AdminUser> {
  const res = await authedFetch("/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = "";
    try {
      const body = JSON.parse(text) as { error?: string; message?: string; detail?: string };
      detail = body.error ?? body.message ?? body.detail ?? text;
    } catch {
      detail = text;
    }
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<AdminUser>;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await authedFetch(`/api/v1/users/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
}

// ── Coupons ──────────────────────────────────────────────────────────────────
// Routes through Vite proxy: /api → localhost:8081 (product service)

export interface AdminCoupon {
  code: string;
  discount: number;   // fraction, e.g. 0.30 = 30 %
  description: string;
  expires: string;
  active: boolean;
}

export async function getCoupons(): Promise<AdminCoupon[]> {
  const res = await authedFetch("/api/coupons");
  if (!res.ok) throw new Error("Failed to fetch coupons");
  const data = (await res.json()) as { total: number; results: AdminCoupon[] | null };
  return data.results ?? [];
}

export async function createCoupon(data: AdminCoupon): Promise<AdminCoupon> {
  const res = await authedFetch("/api/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to create coupon");
  }
  return res.json() as Promise<AdminCoupon>;
}

export async function updateCoupon(
  code: string,
  data: Partial<Omit<AdminCoupon, "code">>
): Promise<AdminCoupon> {
  const res = await authedFetch(`/api/coupons/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update coupon");
  }
  return res.json() as Promise<AdminCoupon>;
}

export async function deleteCoupon(code: string): Promise<void> {
  const res = await authedFetch(`/api/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete coupon");
}

// ── Orders ───────────────────────────────────────────────────────────────────
// Not yet implemented in the backend — returns empty list.

export async function getOrders(): Promise<Order[]> {
  return [];
}

export async function updateOrderStatus(
  _id: string,
  _status: OrderStatus
): Promise<void> {
  // not yet implemented
}

// ── Analytics / Dashboard ────────────────────────────────────────────────────
// Not yet implemented in the backend.
// getDashboardStats derives active product count from the products API.

export async function getDashboardStats(): Promise<DashboardStats> {
  const products = await getProducts();
  return {
    activeProducts: products.filter((p) => p.status === "active").length,
  };
}

export async function getAnalytics(): Promise<AnalyticsSummary | null> {
  return null;
}

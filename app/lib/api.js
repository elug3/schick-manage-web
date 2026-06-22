import { authedFetch } from "./auth";
// ── Products ─────────────────────────────────────────────────────────────────
// Routes through Vite proxy: /api → localhost:8081 (product service)
export async function getProducts() {
    const res = await authedFetch("/api/products");
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to fetch products");
    }
    return res.json();
}
export async function getProduct(id) {
    const res = await authedFetch(`/api/products/${id}`);
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Product not found");
    }
    return res.json();
}
export async function createProduct(data) {
    const res = await authedFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to create product");
    }
    return res.json();
}
export async function updateProduct(id, data) {
    const res = await authedFetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to update product");
    }
    return res.json();
}
export async function deleteProduct(id) {
    const res = await authedFetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok)
        throw new Error("Failed to delete product");
}
// Uses XHR so callers can track upload progress for large files.
export function uploadProductImage(id, file, onProgress) {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem("schick_at") ?? "";
        const fd = new FormData();
        fd.append("image", file);
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `/api/products/${id}/image`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (onProgress) {
            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable)
                    onProgress(Math.round((e.loaded / e.total) * 100));
            });
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                }
                catch {
                    reject(new Error("Invalid response from server"));
                }
            }
            else {
                try {
                    const b = JSON.parse(xhr.responseText);
                    reject(new Error(b.error ?? `Upload failed (${xhr.status})`));
                }
                catch {
                    reject(new Error(`Upload failed (${xhr.status})`));
                }
            }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(fd);
    });
}
export async function getUsers() {
    const res = await authedFetch("/api/v1/users");
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to fetch users");
    }
    return res.json();
}
export async function updateUserRole(id, role) {
    const res = await authedFetch(`/api/v1/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to update role");
    }
    return res.json();
}
export async function createUser(data) {
    const res = await authedFetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = "";
        try {
            const body = JSON.parse(text);
            detail = body.error ?? body.message ?? body.detail ?? text;
        }
        catch {
            detail = text;
        }
        throw new Error(detail || `${res.status} ${res.statusText}`);
    }
    return res.json();
}
export async function deleteUser(id) {
    const res = await authedFetch(`/api/v1/users/${id}`, { method: "DELETE" });
    if (!res.ok)
        throw new Error("Failed to delete user");
}
export async function getCoupons() {
    const res = await authedFetch("/api/coupons");
    if (!res.ok)
        throw new Error("Failed to fetch coupons");
    const data = (await res.json());
    return data.results ?? [];
}
export async function createCoupon(data) {
    const res = await authedFetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to create coupon");
    }
    return res.json();
}
export async function updateCoupon(code, data) {
    const res = await authedFetch(`/api/coupons/${encodeURIComponent(code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = (await res.json().catch(() => ({})));
        throw new Error(body.error ?? "Failed to update coupon");
    }
    return res.json();
}
export async function deleteCoupon(code) {
    const res = await authedFetch(`/api/coupons/${encodeURIComponent(code)}`, {
        method: "DELETE",
    });
    if (!res.ok)
        throw new Error("Failed to delete coupon");
}
// ── Orders ───────────────────────────────────────────────────────────────────
// Not yet implemented in the backend — returns empty list.
export async function getOrders() {
    return [];
}
export async function updateOrderStatus(_id, _status) {
    // not yet implemented
}
// ── Analytics / Dashboard ────────────────────────────────────────────────────
// Not yet implemented in the backend.
// getDashboardStats derives active product count from the products API.
export async function getDashboardStats() {
    const products = await getProducts();
    return {
        activeProducts: products.filter((p) => p.status === "active").length,
    };
}
export async function getAnalytics() {
    return null;
}

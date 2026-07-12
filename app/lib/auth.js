const SESSION_FETCH = { credentials: "include" };
function post(url, body) {
    return fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        ...SESSION_FETCH,
    });
}
export async function getMe() {
    const res = await fetch("/auth/session/me", SESSION_FETCH);
    if (!res.ok)
        return null;
    const body = (await res.json());
    return {
        id: body.user_id ?? "",
        email: body.email,
        accountType: body.account_type,
    };
}
async function errorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body.error ?? fallback;
    }
    catch {
        return fallback;
    }
}
export async function login(email, password) {
    const res = await post("/auth/session/login", { email, password });
    if (!res.ok)
        throw new Error(await errorMessage(res, "Login failed"));
    const body = (await res.json());
    return { id: "", email: body.email ?? email };
}
/** All product/order/inventory/auth API calls go through the cookie-authenticated
 * session gateway, which exchanges and caches the access token server-side. */
export async function authedFetch(url, init = {}) {
    const headers = new Headers(init.headers);
    headers.delete("Authorization");
    const res = await fetch(`/auth/session/gateway${url}`, {
        ...init,
        headers,
        credentials: "include",
    });
    if (res.status === 401) {
        throw new Error("Session expired. Please sign in again.");
    }
    return res;
}
export async function logout() {
    await post("/auth/session/logout").catch(() => { });
}

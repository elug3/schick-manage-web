export interface User {
  id: string;
  email: string;
  accountType?: string;
}

interface LoginResponse {
  email?: string;
}

const SESSION_FETCH: RequestInit = { credentials: "include" };

function post(url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...SESSION_FETCH,
  });
}

export async function getMe(): Promise<User | null> {
  const res = await fetch("/auth/session/me", SESSION_FETCH);
  if (!res.ok) return null;
  const body = (await res.json()) as {
    email: string;
    user_id?: string;
    account_type?: string;
  };
  return {
    id: body.user_id ?? "",
    email: body.email,
    accountType: body.account_type,
  };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return (body as { error?: string }).error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await post("/auth/session/login", { email, password });
  if (!res.ok) throw new Error(await errorMessage(res, "Login failed"));
  const body = (await res.json()) as LoginResponse;
  return { id: "", email: body.email ?? email };
}

/** All product/order/inventory/auth API calls go through the cookie-authenticated
 * session gateway, which exchanges and caches the access token server-side. */
export async function authedFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit);
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

export async function logout(): Promise<void> {
  await post("/auth/session/logout").catch(() => {});
}

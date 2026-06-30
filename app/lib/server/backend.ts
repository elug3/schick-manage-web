const DEFAULT_GATEWAY_URL = "http://localhost:8080";

type Service = "auth" | "product" | "inventory" | "order";

function gatewayBase(): string {
  return (
    process.env.SCHICK_GATEWAY_URL ??
    process.env.SCHICK_API_BASE_URL ??
    DEFAULT_GATEWAY_URL
  ).replace(/\/$/, "");
}

/** Build an upstream URL for server-side API calls through the gateway proxy. */
export function serviceUrl(_service: Service, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${gatewayBase()}${normalized}`;
}

export async function backendPost(
  service: Service,
  path: string,
  body?: unknown
): Promise<Response> {
  return fetch(serviceUrl(service, path), {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function backendGet(
  service: Service,
  path: string,
  accessToken?: string
): Promise<Response> {
  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;
  return fetch(serviceUrl(service, path), { headers });
}

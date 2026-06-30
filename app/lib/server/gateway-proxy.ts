const DEFAULT_GATEWAY_URL = "http://localhost:8080";

const GATEWAY_PREFIXES = ["/auth", "/product", "/inventory", "/order"] as const;

function gatewayBase(): string {
  return (
    process.env.SCHICK_GATEWAY_URL ??
    process.env.SCHICK_API_BASE_URL ??
    DEFAULT_GATEWAY_URL
  ).replace(/\/$/, "");
}

function upstreamPath(pathname: string): string | null {
  for (const prefix of GATEWAY_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const stripped = pathname.slice(prefix.length);
      return stripped.startsWith("/") ? stripped : `/${stripped}`;
    }
  }
  return null;
}

/** Proxy browser gateway-prefix requests to the upstream API (mirrors Vite dev proxy). */
export async function proxyGatewayRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = upstreamPath(url.pathname);
  if (!path) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = new URL(path, `${gatewayBase()}/`);
  upstream.search = url.search;

  const headers = new Headers();
  const authorization = request.headers.get("Authorization");
  if (authorization) headers.set("Authorization", authorization);

  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);

  headers.set("Accept", request.headers.get("Accept") ?? "application/json");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  return fetch(upstream, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });
}

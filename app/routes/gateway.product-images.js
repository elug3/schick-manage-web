import { proxyProductImagesRequest } from "~/lib/server/gateway-proxy";
/** Same-origin proxy for gateway `/product-images/*` (MinIO via local nginx). */
export async function loader({ request }) {
    return proxyProductImagesRequest(request);
}

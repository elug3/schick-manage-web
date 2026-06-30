import { proxyGatewayRequest } from "~/lib/server/gateway-proxy";
export async function loader({ request }) {
    return proxyGatewayRequest(request);
}
export async function action({ request }) {
    return proxyGatewayRequest(request);
}

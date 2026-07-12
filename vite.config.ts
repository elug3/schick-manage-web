import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/** Strip gateway prefix so upstream receives paths as documented. */
function stripGatewayPrefix(prefix: string) {
  return (path: string) => path.replace(new RegExp(`^${prefix}`), "") || "/";
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      // Trailing slash matters: Vite matches proxy keys by plain string prefix, so
      // "/product" without it would also swallow page routes like /products and
      // /products/new. /auth/session/* is handled by React Router, not proxied.
      "/auth/api/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: stripGatewayPrefix("/auth"),
      },
      "/product/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: stripGatewayPrefix("/product"),
      },
      "/inventory/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: stripGatewayPrefix("/inventory"),
      },
      "/order/": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: stripGatewayPrefix("/order"),
      },
    },
  },
});

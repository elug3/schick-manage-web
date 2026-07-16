/**
 * App version metadata baked in at build time via Vite `define`
 * (see vite.config.ts). CI/Docker pass APP_VERSION, APP_BUILD_NUMBER,
 * and APP_GIT_SHA; local dev falls back to package.json + "dev"/"local".
 */
declare const __APP_VERSION__: string;
declare const __APP_BUILD_NUMBER__: string;
declare const __APP_GIT_SHA__: string;

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

export const APP_BUILD_NUMBER: string =
  typeof __APP_BUILD_NUMBER__ !== "undefined" ? __APP_BUILD_NUMBER__ : "dev";

export const APP_GIT_SHA: string =
  typeof __APP_GIT_SHA__ !== "undefined" ? __APP_GIT_SHA__ : "local";

/** Short commit for compact UI (7 chars when a full SHA is present). */
export function shortGitSha(sha: string = APP_GIT_SHA): string {
  if (!sha || sha === "local") return sha;
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

/** e.g. "v0.1.0 · build 42" */
export function formatVersionLabel(
  version: string = APP_VERSION,
  buildNumber: string = APP_BUILD_NUMBER,
): string {
  return `v${version} · build ${buildNumber}`;
}

export const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
export const APP_BUILD_NUMBER = typeof __APP_BUILD_NUMBER__ !== "undefined" ? __APP_BUILD_NUMBER__ : "dev";
export const APP_GIT_SHA = typeof __APP_GIT_SHA__ !== "undefined" ? __APP_GIT_SHA__ : "local";
/** Short commit for compact UI (7 chars when a full SHA is present). */
export function shortGitSha(sha = APP_GIT_SHA) {
    if (!sha || sha === "local")
        return sha;
    return sha.length > 7 ? sha.slice(0, 7) : sha;
}
/** e.g. "v0.1.0 · build 42" */
export function formatVersionLabel(version = APP_VERSION, buildNumber = APP_BUILD_NUMBER) {
    return `v${version} · build ${buildNumber}`;
}

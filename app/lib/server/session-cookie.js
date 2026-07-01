export const SESSION_COOKIE = "dupli1_sid";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
export function getSessionId(request) {
    const cookie = request.headers.get("Cookie");
    if (!cookie)
        return null;
    for (const part of cookie.split(";")) {
        const [name, ...valueParts] = part.trim().split("=");
        if (name === SESSION_COOKIE) {
            const value = valueParts.join("=");
            return value || null;
        }
    }
    return null;
}
function isSecureRequest(request) {
    if (!request)
        return false;
    const forwarded = request.headers.get("x-forwarded-proto");
    if (forwarded) {
        return forwarded.split(",")[0]?.trim() === "https";
    }
    try {
        return new URL(request.url).protocol === "https:";
    }
    catch {
        return false;
    }
}
function cookieAttributes(maxAge, request) {
    const parts = [
        "HttpOnly",
        "Path=/",
        "SameSite=Lax",
        `Max-Age=${maxAge}`,
    ];
    if (isSecureRequest(request)) {
        parts.push("Secure");
    }
    return parts.join("; ");
}
export function setSessionCookieHeader(sessionId, request) {
    return `${SESSION_COOKIE}=${sessionId}; ${cookieAttributes(SESSION_MAX_AGE, request)}`;
}
export function clearSessionCookieHeader(request) {
    return `${SESSION_COOKIE}=; ${cookieAttributes(0, request)}`;
}

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const textEncoder = new TextEncoder();

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "apkbay-admin-session-fallback"
  );
}

export function adminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || "admin456",
    password: process.env.ADMIN_PASSWORD || "Test456#",
  };
}

export function verifyAdminLogin(username: string, password: string): boolean {
  const creds = adminCredentials();
  return username === creds.username && password === creds.password;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return bytesToHex(new Uint8Array(signature));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function createSessionToken(): Promise<string> {
  const payload = `admin:${Date.now()}`;
  const sig = await signPayload(payload, sessionSecret());
  return toBase64Url(`${payload}.${sig}`);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded = fromBase64Url(token);
    const dot = decoded.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    if (!payload.startsWith("admin:")) return false;
    const ts = Number(payload.slice(6));
    if (!Number.isFinite(ts) || Date.now() - ts > SESSION_MAX_AGE_MS) return false;
    const expected = await signPayload(payload, sessionSecret());
    return safeEqual(sig, expected);
  } catch {
    return false;
  }
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
  return verifySessionToken(match?.[1]);
}

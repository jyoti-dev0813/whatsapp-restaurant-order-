const COOKIE_NAME = "cafebill_session";

export { COOKIE_NAME };

export type SessionPayload = {
  uid: string;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function sign(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function sealSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(secret, body);
  return `${body}.${signature}`;
}

export async function openSession(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  const expected = await sign(secret, body);
  if (!safeEqual(signature, expected)) return null;
  const bytes = base64UrlToBytes(body);
  if (!bytes) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== "number") return null;
    if (payload.exp <= nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}

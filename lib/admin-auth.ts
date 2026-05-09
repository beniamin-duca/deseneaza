// HMAC-SHA-256 signed cookie for admin auth. Web Crypto so it works
// in both the Edge middleware and Node route handlers.

export const ADMIN_COOKIE = 'riza_admin'
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

interface CookiePayload {
  exp: number // ms epoch
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? 0 : 4 - (padded.length % 4)
  const full = padded + '='.repeat(padding)
  const bin = atob(full)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signCookie(secret: string): Promise<string> {
  const payload: CookiePayload = {
    exp: Date.now() + ADMIN_MAX_AGE_SECONDS * 1000,
  }
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const sigB64 = b64urlEncode(new Uint8Array(sig))
  return `${payloadB64}.${sigB64}`
}

export async function verifyCookie(
  cookieValue: string,
  secret: string,
): Promise<boolean> {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  try {
    const key = await getKey(secret)
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sigB64),
      new TextEncoder().encode(payloadB64),
    )
    if (!ok) return false
    const payload: CookiePayload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64)),
    )
    if (typeof payload.exp !== 'number') return false
    return payload.exp > Date.now()
  } catch {
    return false
  }
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

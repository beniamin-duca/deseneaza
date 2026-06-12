/**
 * Downscale a data-URL image to a small JPEG suitable for KV storage.
 * Draws on a white background (drawings are on white) so JPEG has no black fill.
 * Client-only (uses DOM); import from client components.
 */
export async function downscaleDataUrl(
  src: string,
  maxSide = 700,
  quality = 0.82
): Promise<string> {
  const img = await loadImage(src)
  const longest = Math.max(img.width, img.height) || 1
  const scale = Math.min(1, maxSide / longest)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return src
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

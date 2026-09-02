// Client-side JPEG compression so large phone photos don't blow up the Mongo doc.
export async function compressToJpegDataUrl(
  file: File,
  opts: { maxSide?: number; quality?: number } = {}
): Promise<string> {
  const maxSide = opts.maxSide ?? 768;
  const quality = opts.quality ?? 0.72;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

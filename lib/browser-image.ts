"use client";

const maxWidth = 1920;
const maxHeight = 1080;
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(avif|heic|heif|jpe?g|png|webp)$/i.test(file.name);
}

async function loadImage(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, dispose: () => bitmap.close() };
    } catch {
      // Safari does not consistently support createImageBitmap for camera-roll photos.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Deze foto kan niet worden verwerkt."));
      element.src = url;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight, dispose: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export async function resizePhotoTo1080p(file: File, maxBytes = 4_000_000) {
  if (!isImageFile(file) || typeof document === "undefined") throw new Error("Kies een foto uit je fotobibliotheek.");
  const needsConversion = !supportedTypes.has(file.type) || file.size > maxBytes;
  let source: Awaited<ReturnType<typeof loadImage>> | null = null;
  try {
    source = await loadImage(file);
    const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
    if (scale === 1 && !needsConversion) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("De foto kan niet worden verwerkt.");
    context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .86));
    if (!blob) throw new Error("De foto kan niet worden verwerkt.");
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
  } finally {
    source?.dispose();
  }
}

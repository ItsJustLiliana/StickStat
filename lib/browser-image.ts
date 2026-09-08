"use client";

const maxWidth = 1920;
const maxHeight = 1080;

export async function resizePhotoTo1080p(file: File) {
  if (!file.type.startsWith("image/") || typeof document === "undefined") return file;
  try {
    const source = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
    if (scale === 1) { source.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { source.close(); return file; }
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", .9));
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "wedstrijd"}.jpg`, { type: "image/jpeg" }) : file;
  } catch { return file; }
}

import { prisma } from "./prisma";

/** Public URL for a stored photo (or null). The frontend prepends the API base. */
export function photoUrl(photoId: string | null): string | null {
  return photoId ? `/photos/${photoId}` : null;
}

/** Persists an uploaded file (memoryStorage) as a Photo row; returns its id. */
export async function savePhoto(file: Express.Multer.File): Promise<string> {
  const photo = await prisma.photo.create({
    data: { data: file.buffer, mimeType: file.mimetype },
  });
  return photo.id;
}

/** Deletes a Photo row if the id is set. Best-effort: never throws. */
export async function deletePhoto(photoId: string | null): Promise<void> {
  if (!photoId) return;
  await prisma.photo.delete({ where: { id: photoId } }).catch(() => {
    /* already gone — ignore */
  });
}

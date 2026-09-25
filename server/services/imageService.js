// Product images are stored as URLs. Today they are plain https URLs (e.g. a CDN).
// To move to Cloudinary later, add an `uploadImage(file)` function here that uploads
// the file and returns its secure URL — controllers already only deal with URLs.

const ALLOWED_PROTOCOLS = ['https:', 'http:'];

export const isValidImageUrl = (value) => {
  if (typeof value !== 'string' || value.length > 1000) return false;
  if (value.startsWith('/')) return true; // local asset served by the app, e.g. /images/tee.jpg
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
};

export const normalizeImageList = (images) => {
  const list = Array.isArray(images) ? images : [images];
  return list.map((url) => String(url || '').trim()).filter(Boolean);
};

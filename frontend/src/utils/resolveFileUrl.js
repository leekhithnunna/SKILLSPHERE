const API_ORIGIN = 'http://localhost:5000';

/**
 * Cloudinary URLs are already absolute. The local-disk upload fallback
 * returns paths like "/uploads/portfolio/xyz.png" that need the API
 * origin prefixed to be loadable from the Vite dev server.
 */
const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
};

export default resolveFileUrl;

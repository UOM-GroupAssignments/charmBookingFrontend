export function isValidImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:') return false;

    // Optional: whitelist trusted domains
    const allowedDomains = ['yourcdn.com', 'images.payhere.lk', 'trustedcdn.com'];
    if (!allowedDomains.includes(parsedUrl.hostname)) return false;

    // Optional: check file extensions
    if (!/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(parsedUrl.pathname)) return false;

    return true;
  } catch (err) {
    return false; // Invalid URL format
  }
}

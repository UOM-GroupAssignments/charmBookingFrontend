export function isValidImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (!import.meta.env.DEV && parsedUrl.protocol !== 'https:') return false;

    // Optional: whitelist trusted domains
        const allowedDomains = [
      'api.charmbooking.com',
      'charmbooking.com',
      'storage.googleapis.com',
      'payherestorage.blob.core.windows.net',
      'localhost',
    ];
      if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
      console.warn('Blocked image URL (domain):', url);
      return false;
    }

    // Optional: check file extensions
    if (!/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(parsedUrl.pathname)) return false;

    return true;
  } catch (err) {
    console.error('Invalid URL:', err);
    return false;
  }
}

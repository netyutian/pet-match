const webpSupported = (() => {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
})();

export const AVATAR_EXT = webpSupported ? 'webp' : 'png';

export function getAvatarUrl(element: string, size: 'full' | 'thumb' = 'full'): string {
  const suffix = size === 'thumb' ? '-thumb' : '';
  return `./assets/avatars/${element}${suffix}.${AVATAR_EXT}`;
}

export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(urls.map((url) => preloadImage(url).catch(() => null))).then(() => {});
}

export function preloadAvatars(elements: string[]): Promise<void> {
  return preloadImages(elements.map((e) => getAvatarUrl(e)));
}

/**
 * Set background image with a placeholder color, swapping to image once loaded.
 * Falls back from webp to png automatically.
 */
export function setBackgroundWithFallback(
  el: HTMLElement,
  url: string,
  fallbackColor: string
): void {
  el.style.backgroundColor = fallbackColor;
  el.style.backgroundImage = 'none';
  const tryLoad = (targetUrl: string): void => {
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url('${targetUrl}')`;
      el.style.backgroundColor = '#fff';
    };
    img.onerror = () => {
      if (targetUrl.endsWith('.webp')) {
        tryLoad(targetUrl.replace('.webp', '.png'));
        return;
      }
      // keep fallback color on final error
    };
    img.src = targetUrl;
  };
  tryLoad(url);
}

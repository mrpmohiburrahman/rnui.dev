// lib/imagekit.ts

const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';

if (!IMAGEKIT_URL_ENDPOINT) {
    console.warn('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not defined in .env');
}

interface ThumbnailOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
}

/**
 * Get the full ImageKit URL for a video with optimization parameters
 * @param path - Relative path to the video (e.g., "/demo/buttons/my-button.mp4" or "demo/buttons/my-button.mp4")
 * @param quality - Video quality (1-100), default 50 for good balance
 * @returns Full ImageKit URL with transformations
 */
export function getImageKitVideoUrl(path: string, quality: number = 50): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Return plain URL without transformations for now (debugging)
    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}`;
}

/**
 * Get optimized thumbnail URL with specific dimensions and quality
 * @param path - Relative path to the thumbnail
 * @param options - Thumbnail optimization options
 * @returns Full ImageKit URL with transformations
 */
export function getImageKitThumbnailUrl(
    path: string,
    options: ThumbnailOptions = {}
): string {
    const {
        width = 221,
        height = 393,
        quality = 70,
        format = 'auto'
    } = options;

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Build transformation string
    const transformations = `tr=w-${width},h-${height},q-${quality},f-${format}`;

    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}?${transformations}`;
}

/**
 * Get Low Quality Image Placeholder (LQIP) for blur-up effect
 * Returns a tiny, heavily compressed and blurred version for instant loading
 * @param path - Relative path to the image
 * @returns Full ImageKit URL with LQIP transformations
 */
export function getImageKitLQIPUrl(path: string): string {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // LQIP transformations: very small width, low quality, blur
    // This creates a ~1-2KB image that loads instantly
    const transformations = 'tr=w-20,q-10,bl-20';

    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}?${transformations}`;
}

/**
 * Get the base ImageKit URL without transformations
 * Useful for poster images or when you want to apply custom transformations
 * @param path - Relative path
 * @returns Full ImageKit URL
 */
export function getImageKitBaseUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}`;
}


// lib/imagekit.ts

/**
 * Get the full ImageKit URL for a video
 * @param path - Relative path to the video (e.g., "/demo/buttons/my-button.mp4" or "demo/buttons/my-button.mp4")
 * @returns Full ImageKit URL
 */
export function getImageKitVideoUrl(path: string): string {
    const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/knjhgwi8d';

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    return `${IMAGEKIT_URL_ENDPOINT}/${cleanPath}`;
}

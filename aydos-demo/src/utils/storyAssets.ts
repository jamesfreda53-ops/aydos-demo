/**
 * Builds public-folder asset paths for a story.
 *
 * Expects files placed at:
 *   /public/stories/<storyId>/images/<filename>
 *   /public/stories/<storyId>/audio/<filename>
 *
 * Vite serves everything under /public from the site root, so these
 * paths work as-is with no imports and survive page refreshes.
 *
 * NOTE: never use "#" in a filename referenced this way — "#" is the
 * URL fragment character, so "#1.png" would break the path. Use
 * "1.png", "img-1.png", etc. instead.
 */

export function storyImage(storyId: string, filename: string): string {
  return `/stories/${storyId}/images/${filename}`;
}

export function storyAudio(storyId: string, filename: string): string {
  return `/stories/${storyId}/audio/${filename}`;
}

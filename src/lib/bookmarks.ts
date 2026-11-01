export interface Bookmark {
  url: string;
  slug: string;
}

export const STORAGE_KEY = 'mona-bookmarks';
export const SEPARATOR = ' :: ';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Accepts input with or without a scheme; returns null if it is not a usable http(s) URL. */
export function normalizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let value = input.trim();
  if (!value || /\s/.test(value)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return null;
    let out = parsed.toString();
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) out = out.replace(/\/$/, '');
    return out;
  } catch {
    return null;
  }
}

export function generateSlug(random: () => number = Math.random, length = 4): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += BASE62[Math.min(BASE62.length - 1, Math.floor(random() * BASE62.length))];
  }
  return `mona-${id}`;
}

/** Keeps only well-formed {url, slug} entries; anything else is dropped. */
export function sanitizeBookmarks(value: unknown): Bookmark[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: Bookmark[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { url, slug } = item as Record<string, unknown>;
    if (typeof url !== 'string' || typeof slug !== 'string') continue;
    if (!/^mona-[0-9a-zA-Z]+$/.test(slug) || seen.has(slug)) continue;
    const clean = normalizeUrl(url);
    if (!clean) continue;
    seen.add(slug);
    result.push({ url: clean, slug });
  }
  return result;
}

/** Parses a raw stored string; never throws. */
export function parseStored(raw: unknown): Bookmark[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    return sanitizeBookmarks(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function addBookmark(
  list: Bookmark[],
  input: unknown,
  random: () => number = Math.random,
): { list: Bookmark[]; added: Bookmark | null } {
  const url = normalizeUrl(input);
  if (!url) return { list, added: null };
  const existing = list.find((b) => b.url === url);
  if (existing) return { list, added: existing };
  const taken = new Set(list.map((b) => b.slug));
  let slug = generateSlug(random);
  while (taken.has(slug)) slug = generateSlug(random);
  const added = { url, slug };
  return { list: [added, ...list], added };
}

export function formatBookmark(b: Bookmark): string {
  return `${b.url}${SEPARATOR}${b.slug}`;
}

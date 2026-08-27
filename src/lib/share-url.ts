import { BANNER_DATA_VERSION, parseBannerData } from './data-version';

const GZIP_PREFIX = '#v1.';
const PLAIN_PREFIX = '#v1u.';

type SharePayload = {
  version: number;
  html: string;
};

export function isShareHash(hash: string): boolean {
  return hash.startsWith(GZIP_PREFIX) || hash.startsWith(PLAIN_PREFIX);
}

export async function encodeShareHash(html: string): Promise<string> {
  const json = JSON.stringify({
    version: BANNER_DATA_VERSION,
    html,
  } satisfies SharePayload);
  try {
    const payload = bytesToBase64Url(await gzip(new TextEncoder().encode(json)));
    return `${GZIP_PREFIX}${payload}`;
  } catch {
    return `${PLAIN_PREFIX}${encodeURIComponent(json)}`;
  }
}

export async function decodeShareHash(
  hash: string,
): Promise<{ html: string } | null> {
  try {
    if (hash.startsWith(GZIP_PREFIX)) {
      const bytes = await gunzip(
        base64UrlToBytes(hash.slice(GZIP_PREFIX.length)),
      );
      return parseSharePayload(new TextDecoder().decode(bytes));
    }
    if (hash.startsWith(PLAIN_PREFIX)) {
      return parseSharePayload(decodeURIComponent(hash.slice(PLAIN_PREFIX.length)));
    }
  } catch {
    return null;
  }
  return null;
}

export async function buildShareUrl(html: string): Promise<string> {
  const hash = await encodeShareHash(html);
  const url = new URL(window.location.href);
  url.hash = hash.slice(1);
  return url.toString();
}

export async function syncShareHash(html: string): Promise<void> {
  const url = new URL(window.location.href);
  if (html.trim() === '') {
    if (url.hash) {
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
    return;
  }

  const hash = await encodeShareHash(html);
  if (window.location.hash === hash) return;
  url.hash = hash.slice(1);
  window.history.replaceState(null, '', `${url.pathname}${url.search}${hash}`);
}

export function stripShareHash(): void {
  const url = new URL(window.location.href);
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

function parseSharePayload(raw: string): { html: string } | null {
  const html = parseBannerData(raw);
  return html == null ? null : { html };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded =
    value.length % 4 === 0 ? value : `${value}${'='.repeat(4 - (value.length % 4))}`;
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function gzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = blobFromBytes(data)
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = blobFromBytes(data)
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function blobFromBytes(data: Uint8Array): Blob {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return new Blob([copy]);
}

import {
  BANNER_DATA_VERSION,
  parseBannerData,
  serializeBannerData,
} from './data-version';

const HTML_KEY = 'grepp-main-banner.html';
const MODE_KEY = 'grepp-main-banner.editor-mode';
const BOILERPLATE_CSS_KEY = 'grepp-main-banner.boilerplate-css';

export type EditorMode = 'free' | 'template';

export function loadBannerHtml(fallback: string): string {
  try {
    const stored = localStorage.getItem(HTML_KEY);
    if (stored == null) return fallback;

    const versioned = parseBannerData(stored);
    if (versioned != null) return versioned;

    // 버전 필드가 없던 예전 저장본. 현재 스키마가 1일 때만 읽는다.
    if (BANNER_DATA_VERSION === 1 && looksLikeLegacyHtml(stored)) {
      return stored;
    }
  } catch {
    /* private mode 등 */
  }
  return fallback;
}

export function saveBannerHtml(html: string): void {
  try {
    if (html.trim() === '') {
      localStorage.removeItem(HTML_KEY);
      return;
    }
    localStorage.setItem(HTML_KEY, serializeBannerData(html));
  } catch {
    /* quota / private mode */
  }
}

export function clearBannerStorage(): void {
  try {
    localStorage.removeItem(HTML_KEY);
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(BOILERPLATE_CSS_KEY);
    localStorage.removeItem('grepp-main-banner.doc');
  } catch {
    /* private mode 등 */
  }
}

function looksLikeLegacyHtml(stored: string): boolean {
  const trimmed = stored.trim();
  return trimmed.startsWith('<') || trimmed === '';
}

export function loadEditorMode(fallback: EditorMode): EditorMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'free' || stored === 'template') return stored;
  } catch {
    /* private mode 등 */
  }
  return fallback;
}

export function saveEditorMode(mode: EditorMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* quota / private mode */
  }
}

export function loadApplyBoilerplateCss(fallback = true): boolean {
  try {
    const stored = localStorage.getItem(BOILERPLATE_CSS_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    /* private mode 등 */
  }
  return fallback;
}

export function saveApplyBoilerplateCss(apply: boolean): void {
  try {
    localStorage.setItem(BOILERPLATE_CSS_KEY, apply ? '1' : '0');
  } catch {
    /* quota / private mode */
  }
}

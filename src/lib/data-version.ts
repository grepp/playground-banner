/**
 * 로컬 저장·공유 URL 스키마 버전.
 * 배너 HTML 계약이 바뀌어 예전 데이터를 넣으면 깨질 때만 올린다.
 * package.json 버전과 같지 않다.
 */
export const BANNER_DATA_VERSION = 1;

export type BannerDataEnvelope = {
  version: number;
  html: string;
};

export function parseBannerData(
  raw: string,
  expectedVersion = BANNER_DATA_VERSION,
): string | null {
  try {
    const data = JSON.parse(raw) as {
      version?: unknown;
      v?: unknown;
      html?: unknown;
    };
    const version = data.version ?? data.v;
    if (version !== expectedVersion || typeof data.html !== 'string') {
      return null;
    }
    return data.html;
  } catch {
    return null;
  }
}

export function serializeBannerData(
  html: string,
  version = BANNER_DATA_VERSION,
): string {
  const payload: BannerDataEnvelope = { version, html };
  return JSON.stringify(payload);
}

export type BannerTextColor = 'black' | 'white';

export function cssHexForTextColor(color: BannerTextColor): string {
  return color === 'white' ? '#ffffff' : '#000000';
}

export type BannerTemplate = {
  background: string;
  textColor: BannerTextColor;
  showAdLabel: boolean;
  adLabelText: string;
  showLabelText: boolean;
  labelText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  mobileImageUrl: string;
  desktopImageUrl: string;
};

export const BLANK_BANNER_TEMPLATE: BannerTemplate = {
  background: '#DCE9FF',
  textColor: 'black',
  showAdLabel: false,
  adLabelText: '광고',
  showLabelText: false,
  labelText: '',
  titleLine1: '',
  titleLine2: '',
  subtitle: '',
  mobileImageUrl: '',
  desktopImageUrl: '',
};

export const DEFAULT_BANNER_TEMPLATE: BannerTemplate = {
  background: '#DCE9FF',
  textColor: 'black',
  showAdLabel: true,
  adLabelText: '광고',
  showLabelText: true,
  labelText: '일이삼사오육칠팔구십일이',
  titleLine1: '일이삼사오육칠팔구십일이삼사',
  titleLine2: '일이삼사오육칠팔구십일이삼사',
  subtitle: '일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사',
  mobileImageUrl:
    'https://asset.programmers.co.kr/image/origin/production/banner/174394/448d1fa7-82b8-4701-b88c-ef0c479bb614.png',
  desktopImageUrl:
    'https://asset.programmers.co.kr/image/origin/production/banner/174393/ef163103-37bf-4eec-a63b-fdb040a077bf.png',
};

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function styleProp(el: Element | null, prop: string): string {
  if (!el) return '';
  const raw = el.getAttribute('style') ?? '';
  const match = raw.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function firstUrl(srcset: string): string {
  return srcset.trim().split(/[\s,]/)[0] ?? '';
}

const NAMED_RGB: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  blue: [0, 0, 255],
  green: [0, 128, 0],
  navy: [0, 0, 128],
  teal: [0, 128, 128],
  aqua: [0, 255, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  maroon: [128, 0, 0],
  purple: [128, 0, 128],
  fuchsia: [255, 0, 255],
  lime: [0, 255, 0],
  olive: [128, 128, 0],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
};

function parseCssColor(value: string): [number, number, number] | null {
  const raw = value.trim().toLowerCase();
  if (!raw) return null;

  const named = NAMED_RGB[raw];
  if (named) return named;

  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return [
        Number.parseInt(h[0] + h[0], 16),
        Number.parseInt(h[1] + h[1], 16),
        Number.parseInt(h[2] + h[2], 16),
      ];
    }
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgb = raw.match(
    /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i,
  );
  if (rgb) {
    return [
      Number.parseInt(rgb[1], 10),
      Number.parseInt(rgb[2], 10),
      Number.parseInt(rgb[3], 10),
    ];
  }

  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseTextColor(value: string): BannerTextColor | null {
  const rgb = parseCssColor(value);
  if (!rgb) return null;
  return relativeLuminance(rgb) >= 0.5 ? 'white' : 'black';
}

/** HTML에 글자색이 없을 때 배경 대비로 추정한다. */
export function textColorForBackground(background: string): 'black' | 'white' {
  const rgb = parseCssColor(background);
  if (!rgb) return 'black';
  const luminance = relativeLuminance(rgb);
  return contrastRatio(luminance, 1) >= contrastRatio(luminance, 0)
    ? 'white'
    : 'black';
}

/** 현재 운영 배너 HTML(V2: labels / titles / subtitle / picture)을 폼 값으로 읽는다. */
export function parseBannerTemplate(html: string): BannerTemplate | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('.root-banner-wrap');
  if (!root) return null;

  const ad = root.querySelector('.label-ad');
  const label = root.querySelector('.labels .label-text, .label-text');
  const titles = root.querySelector('.titles');
  const titleEls = [...root.querySelectorAll('.title')];
  const subtitle = root.querySelector('.subtitle');
  const source = root.querySelector('source');
  const img = root.querySelector('.right img, picture img, img');
  const background =
    styleProp(root, 'background') || DEFAULT_BANNER_TEMPLATE.background;
  const textColor =
    parseTextColor(styleProp(titles, 'color')) ??
    parseTextColor(styleProp(label, 'color')) ??
    parseTextColor(styleProp(subtitle, 'color')) ??
    textColorForBackground(background);

  return {
    background,
    textColor,
    showAdLabel: Boolean(ad),
    adLabelText: ad?.textContent?.trim() || '광고',
    showLabelText: Boolean(label),
    labelText: label?.textContent?.trim() ?? '',
    titleLine1: titleEls[0]?.textContent?.trim() ?? '',
    titleLine2: titleEls[1]?.textContent?.trim() ?? '',
    subtitle: subtitle?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    mobileImageUrl: firstUrl(source?.getAttribute('srcset') ?? ''),
    desktopImageUrl: img?.getAttribute('src') ?? '',
  };
}

export function serializeBannerTemplate(template: BannerTemplate): string {
  const textColor = cssHexForTextColor(template.textColor);
  const labels: string[] = [];
  if (template.showAdLabel && template.adLabelText.trim()) {
    labels.push(
      `        <span class="label-ad">${escapeText(template.adLabelText.trim())}</span>`,
    );
  }
  if (template.showLabelText && template.labelText.trim()) {
    labels.push(
      `        <span class="label-text" style="color: ${textColor}">${escapeText(template.labelText.trim())}</span>`,
    );
  }

  const titles = [template.titleLine1, template.titleLine2]
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `        <p class="title">${escapeText(line)}</p>`,
    );

  const labelsBlock =
    labels.length > 0
      ? `      <div class="labels">\n${labels.join('\n')}\n      </div>\n`
      : '';

  const titlesBlock =
    titles.length > 0
      ? `      <div class="titles" style="color: ${textColor}">\n${titles.join('\n')}\n      </div>\n`
      : '';

  return `<div class="root-banner-wrap" style="background: ${escapeAttr(template.background)}">
  <div class="banner-item-wide">
    <div class="left">
${labelsBlock}${titlesBlock}      <p class="subtitle" style="color: ${textColor}">
        ${escapeText(template.subtitle)}
      </p>
    </div>
    <div class="right">
      <picture>
        <source
          media="(max-width: 991px)"
          srcset="${escapeAttr(template.mobileImageUrl)}"
        />
        <img
          src="${escapeAttr(template.desktopImageUrl)}"
        />
      </picture>
    </div>
  </div>
</div>
`;
}

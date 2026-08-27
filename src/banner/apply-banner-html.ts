import { isLgDown } from './viewports';

/** innerHTML로 넣은 `<picture>` 는 iframe에서 source media가 반영되지 않는 경우가 있어, 현재 iframe 너비에 맞는 src를 직접 고른다. */
export function applyBannerHtml(mount: Element, html: string): void {
  mount.innerHTML = html;

  const width = mount.ownerDocument.defaultView?.innerWidth ?? 0;
  if (!isLgDown(width)) return;

  mount.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    if (!img) return;

    for (const source of picture.querySelectorAll('source')) {
      const media = source.getAttribute('media') ?? '';
      if (!/max-width:\s*991px/i.test(media)) continue;
      const url =
        source.getAttribute('srcset')?.trim().split(/[\s,]/)[0] ||
        source.srcset.trim().split(/[\s,]/)[0];
      if (url) {
        img.src = url;
        picture.querySelectorAll('source').forEach((node) => node.remove());
        break;
      }
    }
  });
}

import { useEffect, useRef, useState } from 'react';
import { applyBannerHtml } from '../banner/apply-banner-html';
import {
  BANNER_HEIGHT_DESKTOP,
  BANNER_HEIGHT_MOBILE,
  isLgDown,
} from '../banner/viewports';

const PREVIEW_SRC = `${import.meta.env.BASE_URL}preview.html`;
const PREVIEW_BARE_SRC = `${import.meta.env.BASE_URL}preview-bare.html`;

type BannerPreviewProps = {
  html: string;
  applyBoilerplateCss?: boolean;
};

export function BannerPreview({
  html,
  applyBoilerplateCss = true,
}: BannerPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlRef = useRef(html);
  const wasLgDownRef = useRef<boolean | null>(null);
  const src = applyBoilerplateCss ? PREVIEW_SRC : PREVIEW_BARE_SRC;
  const [height, setHeight] = useState(BANNER_HEIGHT_DESKTOP);

  useEffect(() => {
    htmlRef.current = html;
  }, [html]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const preventNav = (event: Event) => {
      event.preventDefault();
    };

    const applyHtml = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const mount = doc.querySelector('[data-banner-html]');
      if (mount) applyBannerHtml(mount, htmlRef.current);

      doc.removeEventListener('click', preventNav);
      doc.addEventListener('click', preventNav);
    };

    iframe.addEventListener('load', applyHtml);
    if (iframe.contentDocument?.readyState === 'complete') {
      applyHtml();
    }

    return () => {
      iframe.removeEventListener('load', applyHtml);
      iframe.contentDocument?.removeEventListener('click', preventNav);
    };
  }, [src]);

  useEffect(() => {
    const mount = iframeRef.current?.contentDocument?.querySelector(
      '[data-banner-html]',
    );
    if (mount) applyBannerHtml(mount, html);
  }, [html]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      const lgDown = isLgDown(host.clientWidth);
      setHeight(lgDown ? BANNER_HEIGHT_MOBILE : BANNER_HEIGHT_DESKTOP);

      if (wasLgDownRef.current === lgDown) return;
      wasLgDownRef.current = lgDown;

      const mount = iframeRef.current?.contentDocument?.querySelector(
        '[data-banner-html]',
      );
      if (mount) applyBannerHtml(mount, htmlRef.current);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="w-full min-w-0 bg-white">
      <iframe
        ref={iframeRef}
        title="배너 미리보기"
        src={src}
        sandbox="allow-same-origin"
        className="block w-full border-0"
        style={{ height, overflow: 'hidden' }}
      />
    </div>
  );
}

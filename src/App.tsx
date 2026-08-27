import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_BANNER_HTML } from './banner/default-banner-html';
import {
  BLANK_BANNER_TEMPLATE,
  DEFAULT_BANNER_TEMPLATE,
  parseBannerTemplate,
  serializeBannerTemplate,
  type BannerTemplate,
} from './banner/template';
import { BannerPreview } from './components/BannerPreview';
import { DiagnosticsBar } from './components/DiagnosticsBar';
import { HtmlEditor } from './components/HtmlEditor';
import { SegmentedControl } from './components/SegmentedControl';
import { SettingsMenu } from './components/SettingsMenu';
import { TemplateEditor } from './components/TemplateEditor';
import { diagnoseBannerHtml } from './lib/diagnostics';
import { formatBannerHtml } from './lib/format-html';
import {
  loadApplyBoilerplateCss,
  loadBannerHtml,
  loadEditorMode,
  saveApplyBoilerplateCss,
  saveBannerHtml,
  saveEditorMode,
  clearBannerStorage,
  type EditorMode,
} from './lib/persist';
import {
  buildShareUrl,
  decodeShareHash,
  isShareHash,
  stripShareHash,
  syncShareHash,
} from './lib/share-url';

export function App() {
  const [workHtml, setWorkHtml] = useState(() => loadBannerHtml(''));
  const [editorMode, setEditorMode] = useState<EditorMode>(() =>
    loadEditorMode('free'),
  );
  const [template, setTemplate] = useState<BannerTemplate>(
    () => parseBannerTemplate(loadBannerHtml('')) ?? BLANK_BANNER_TEMPLATE,
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applyBoilerplateCss, setApplyBoilerplateCss] = useState(() =>
    loadApplyBoilerplateCss(true),
  );
  const skipFirstSave = useRef(true);
  const skipNextSave = useRef(false);
  const [shareImportDone, setShareImportDone] = useState(
    () => !isShareHash(window.location.hash),
  );

  const html = workHtml;
  const setHtml = setWorkHtml;

  useEffect(() => {
    saveEditorMode(editorMode);
  }, [editorMode]);

  useEffect(() => {
    saveApplyBoilerplateCss(applyBoilerplateCss);
  }, [applyBoilerplateCss]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!isShareHash(hash)) return;

    let cancelled = false;
    void (async () => {
      const decoded = await decodeShareHash(hash);
      if (cancelled) return;
      if (!decoded) {
        stripShareHash();
        setShareImportDone(true);
        return;
      }

      const current = loadBannerHtml('');
      if (current.trim() !== '' && current !== decoded.html) {
        const ok = window.confirm(
          '공유된 배너 HTML로 바꿀까요? 지금 작성 중인 내용은 사라집니다.',
        );
        if (!ok || cancelled) {
          if (!cancelled) stripShareHash();
          if (!cancelled) setShareImportDone(true);
          return;
        }
      }
      if (cancelled) return;

      setWorkHtml(decoded.html);
      setTemplate(parseBannerTemplate(decoded.html) ?? BLANK_BANNER_TEMPLATE);
      saveBannerHtml(decoded.html);
      setShareImportDone(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!shareImportDone) return;

    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      void syncShareHash(workHtml);
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    let hide = 0;
    const persist = window.setTimeout(() => {
      saveBannerHtml(workHtml);
      void syncShareHash(workHtml);
      setSaved(true);
      hide = window.setTimeout(() => setSaved(false), 1400);
    }, 500);

    return () => {
      window.clearTimeout(persist);
      window.clearTimeout(hide);
    };
  }, [shareImportDone, workHtml]);

  const diagnostics = useMemo(() => diagnoseBannerHtml(html), [html]);

  const format = useCallback(() => {
    setHtml(formatBannerHtml(html));
  }, [html, setHtml]);

  const copyText = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  }, []);

  const copy = useCallback(async () => {
    await copyText(html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [copyText, html]);

  const copyLink = useCallback(async () => {
    if (html.trim() === '') return;
    try {
      const url = await buildShareUrl(html);
      await copyText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      window.alert('공유 링크를 만들지 못했습니다.');
    }
  }, [copyText, html]);

  const clearLocalData = useCallback(() => {
    const ok = window.confirm(
      '현재 에디터 내용이 저장된 localStorage 데이터와 주소창 URL을 지울까요?',
    );
    if (!ok) return;
    if (workHtml.trim() !== '') skipNextSave.current = true;
    clearBannerStorage();
    stripShareHash();
    setWorkHtml('');
    setTemplate(BLANK_BANNER_TEMPLATE);
    setEditorMode('free');
    setApplyBoilerplateCss(true);
  }, [workHtml]);

  const loadExample = useCallback(() => {
    if (workHtml.trim() !== '' && workHtml !== DEFAULT_BANNER_HTML) {
      const ok = window.confirm(
        '지금 작성 중인 내용을 예시 HTML로 바꿀까요? 지금 내용은 사라집니다.',
      );
      if (!ok) return;
    }
    setWorkHtml(DEFAULT_BANNER_HTML);
    setTemplate(DEFAULT_BANNER_TEMPLATE);
  }, [workHtml]);

  const switchEditorMode = useCallback(
    (mode: EditorMode) => {
      if (mode === 'template') {
        setTemplate(parseBannerTemplate(html) ?? BLANK_BANNER_TEMPLATE);
      }
      setEditorMode(mode);
    },
    [html],
  );

  const updateTemplate = useCallback(
    (next: BannerTemplate) => {
      setTemplate(next);
      setHtml(formatBannerHtml(serializeBannerTemplate(next)));
    },
    [setHtml],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900">
            프로그래머스 메인 배너 Playground
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            어드민에 넣을 HTML을 미리보고 복사하세요. 자유 모드로 직접 고치거나,
            템플릿 모드로 값만 입력할 수 있습니다.
          </p>
        </div>
        <SettingsMenu
          applyBoilerplateCss={applyBoilerplateCss}
          onApplyBoilerplateCssChange={setApplyBoilerplateCss}
          onClearStorage={clearLocalData}
        />
      </header>

      <section className="flex shrink-0 flex-col bg-white">
        <div className="flex shrink-0 items-center border-b border-zinc-200 bg-white px-4 py-1.5">
          <h2 className="text-xs font-medium text-zinc-500">미리보기</h2>
        </div>
        <BannerPreview html={html} applyBoilerplateCss={applyBoilerplateCss} />
        <DiagnosticsBar diagnostics={diagnostics} />
      </section>

      <section className="flex min-h-[400px] flex-1 flex-col overflow-hidden border-t border-zinc-200 bg-white">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              aria-label="편집 모드"
              value={editorMode}
              onChange={switchEditorMode}
              options={[
                { value: 'free', label: '자유 모드' },
                { value: 'template', label: '템플릿 모드' },
              ]}
            />
            <button
              type="button"
              onClick={loadExample}
              className={
                shareImportDone && html.trim() === ''
                  ? 'example-hint rounded-md border bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50'
                  : 'rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50'
              }
            >
              예시 불러오기
            </button>
            <button
              type="button"
              onClick={format}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
            >
              포매팅
            </button>
            <span
              className={
                saved
                  ? 'text-[11px] font-medium text-emerald-700 transition-opacity'
                  : 'text-[11px] font-medium text-transparent transition-opacity'
              }
              aria-live="polite"
            >
              Saved
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={html.trim() === ''}
              aria-live="polite"
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:text-zinc-400"
            >
              {linkCopied ? '복사됨' : 'URL 공유'}
            </button>
            <button
              type="button"
              onClick={() => void copy()}
              aria-live="polite"
              className="rounded-md bg-[#0077ff] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#006ae6]"
            >
              {copied ? '복사됨' : 'HTML 복사'}
            </button>
          </div>
        </div>
        {editorMode === 'free' ? (
          <div className="min-h-0 flex-1">
            <HtmlEditor value={html} onChange={setHtml} onFormat={format} />
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
            <div className="min-h-0 min-w-0 w-full overflow-auto md:w-[min(28rem,42%)] md:shrink-0 md:border-r md:border-zinc-200">
              <TemplateEditor value={template} onChange={updateTemplate} />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-slate-200 bg-slate-100 md:border-t-0">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-1.5">
                <h3 className="text-xs font-medium text-slate-600">생성 HTML</h3>
                <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-600">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="size-3 fill-current"
                  >
                    <path d="M8 1.5A2.5 2.5 0 0 0 5.5 4v2h-1A1.5 1.5 0 0 0 3 7.5v5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 6h-1V4A2.5 2.5 0 0 0 8 1.5Zm1.5 4.5h-3V4a1.5 1.5 0 1 1 3 0v2Z" />
                  </svg>
                  읽기 전용
                </span>
              </div>
              <div className="min-h-0 flex-1 bg-slate-100">
                <HtmlEditor value={html} readOnly />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

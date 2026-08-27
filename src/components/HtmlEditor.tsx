import { html } from '@codemirror/lang-html';
import { indentWithTab } from '@codemirror/commands';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

type HtmlEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  onFormat?: () => void;
  readOnly?: boolean;
};

const sharedTheme = {
  '&': {
    height: '100%',
    fontSize: '13px',
    lineHeight: '1.5',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
  },
  '.cm-content ::selection': {
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.28) !important',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'rgba(59, 130, 246, 0.38) !important',
  },
} as const;

const editorTheme = EditorView.theme(
  {
    ...sharedTheme,
    '.cm-content': {
      padding: '12px 0',
      caretColor: '#18181b',
    },
    '.cm-gutters': {
      backgroundColor: '#ffffff',
      color: '#a1a1aa',
      border: 'none',
      borderRight: '1px solid #e4e4e7',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#f4f4f5',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '&.cm-editor': {
      backgroundColor: '#ffffff',
    },
  },
  { dark: false },
);

const viewerTheme = EditorView.theme(
  {
    ...sharedTheme,
    '.cm-content': {
      padding: '12px 0',
      caretColor: 'transparent',
      cursor: 'text',
    },
    '.cm-gutters': {
      backgroundColor: '#e2e8f0',
      color: '#94a3b8',
      border: 'none',
      borderRight: '1px solid #cbd5e1',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-cursor, .cm-dropCursor': {
      display: 'none',
    },
    '&.cm-editor': {
      backgroundColor: '#eef2f6',
    },
  },
  { dark: false },
);

export function HtmlEditor({
  value,
  onChange,
  onFormat,
  readOnly = false,
}: HtmlEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onFormatRef = useRef(onFormat);
  const lastExternalValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    onFormatRef.current = onFormat;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              onFormatRef.current?.();
              return true;
            },
          },
          indentWithTab,
        ]),
        basicSetup,
        readOnly ? viewerTheme : editorTheme,
        EditorView.lineWrapping,
        html(),
        placeholderExt(
          readOnly
            ? '옵션을 바꾸면 여기에 HTML이 나타납니다'
            : '어드민에 넣을 배너 HTML을 붙여 넣으세요',
        ),
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || readOnly) return;
          const next = update.state.doc.toString();
          lastExternalValueRef.current = next;
          onChangeRef.current?.(next);
        }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    lastExternalValueRef.current = value;

    const resizeObserver = new ResizeObserver(() => {
      view.requestMeasure();
    });
    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      view.destroy();
      viewRef.current = null;
    };
    // EditorView는 마운트 시 1회만 생성한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value === lastExternalValueRef.current) return;

    const current = view.state.doc.toString();
    if (current === value) {
      lastExternalValueRef.current = value;
      return;
    }

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
    lastExternalValueRef.current = value;
  }, [value]);

  return <div ref={hostRef} className="h-full min-h-0 [&_.cm-editor]:h-full" />;
}

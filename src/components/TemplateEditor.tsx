import type { ReactNode } from 'react';
import { SegmentedControl } from './SegmentedControl';
import { type BannerTemplate, type BannerTextColor } from '../banner/template';

type TemplateEditorProps = {
  value: BannerTemplate;
  onChange: (next: BannerTemplate) => void;
};

const inputClass =
  'w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-300 focus:border-zinc-400';

function FieldCode({ children }: { children: string }) {
  return (
    <span className="font-mono text-[10px] font-medium tracking-tight text-[#aa1111]">
      {children}
    </span>
  );
}

function toPickerValue(color: string): string {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (value.toLowerCase() === 'black') return '#000000';
  if (value.toLowerCase() === 'white') return '#ffffff';
  return '#000000';
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="color"
      aria-label={label}
      className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
      value={toPickerValue(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CharCount({ text, limit = 14 }: { text: string; limit?: number }) {
  const count = [...text].length;
  if (count === 0) return null;
  return (
    <span
      className={
        count > limit
          ? 'w-5 shrink-0 text-right text-[10px] tabular-nums text-amber-700'
          : 'w-5 shrink-0 text-right text-[10px] tabular-nums text-zinc-400'
      }
    >
      {count}
    </span>
  );
}

function Section({
  title,
  code,
  action,
  children,
}: {
  title: string;
  code?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-1.5">
        <h3 className="text-[11px] font-medium text-zinc-400">{title}</h3>
        {code ? <FieldCode>{code}</FieldCode> : null}
        {action ? <div className="ml-auto flex items-center">{action}</div> : null}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  code,
  optional,
  children,
}: {
  label: string;
  code?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[12px] text-zinc-700">{label}</span>
        {code ? <FieldCode>{code}</FieldCode> : null}
        {optional ? (
          <span className="text-[10px] text-zinc-400">(optional)</span>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

export function TemplateEditor({ value, onChange }: TemplateEditorProps) {
  const patch = (partial: Partial<BannerTemplate>) =>
    onChange({ ...value, ...partial });
  const patchBackground = (background: string) => patch({ background });

  return (
    <form
      className="flex min-h-0 flex-col gap-6 p-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <Section title="배경" code=".root-banner-wrap">
        <FieldRow label="색">
          <ColorSwatch
            label="배경색"
            value={value.background}
            onChange={patchBackground}
          />
          <input
            className={inputClass}
            value={value.background}
            onChange={(event) => patchBackground(event.target.value)}
            spellCheck={false}
            aria-label="배경색"
          />
        </FieldRow>
      </Section>

      <Section title="텍스트">
        <FieldRow label="색">
          <SegmentedControl
            aria-label="텍스트 색"
            value={value.textColor}
            onChange={(textColor: BannerTextColor) => patch({ textColor })}
            options={[
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
            ]}
          />
        </FieldRow>
      </Section>

      <Section title="라벨">
        <FieldRow label="광고" code=".label-ad" optional>
          <input
            type="checkbox"
            className="size-4 shrink-0"
            checked={value.showAdLabel}
            onChange={(event) => patch({ showAdLabel: event.target.checked })}
            aria-label="광고 배지"
          />
          {value.showAdLabel ? (
            <input
              className={inputClass}
              value={value.adLabelText}
              onChange={(event) => patch({ adLabelText: event.target.value })}
              aria-label="광고 배지 문구"
            />
          ) : null}
        </FieldRow>
        <FieldRow label="브랜드" code=".label-text" optional>
          <input
            type="checkbox"
            className="size-4 shrink-0"
            checked={value.showLabelText}
            onChange={(event) =>
              patch({ showLabelText: event.target.checked })
            }
            aria-label="브랜드 라벨"
          />
          {value.showLabelText ? (
            <input
              className={inputClass}
              value={value.labelText}
              onChange={(event) => patch({ labelText: event.target.value })}
              aria-label="브랜드 라벨 문구"
            />
          ) : null}
        </FieldRow>
      </Section>

      <Section title="문구" code=".titles">
        <FieldRow label="1줄" code=".title">
          <input
            className={inputClass}
            value={value.titleLine1}
            onChange={(event) => patch({ titleLine1: event.target.value })}
            aria-label="제목 1줄"
          />
          <CharCount text={value.titleLine1} />
        </FieldRow>
        <FieldRow label="2줄" code=".title">
          <input
            className={inputClass}
            value={value.titleLine2}
            onChange={(event) => patch({ titleLine2: event.target.value })}
            placeholder="없음"
            aria-label="제목 2줄"
          />
          <CharCount text={value.titleLine2} />
        </FieldRow>
        <FieldRow label="부제" code=".subtitle">
          <input
            className={inputClass}
            value={value.subtitle}
            onChange={(event) => patch({ subtitle: event.target.value })}
            aria-label="부제"
          />
        </FieldRow>
      </Section>

      <Section title="이미지">
        <p className="-mt-1 text-[11px] text-zinc-400">
          키비주얼에 텍스트를 넣지 마세요. 문구는 왼쪽 영역입니다.
        </p>
        <FieldRow label="모바일" code="source[srcset]">
          <input
            className={inputClass}
            value={value.mobileImageUrl}
            onChange={(event) => patch({ mobileImageUrl: event.target.value })}
            spellCheck={false}
            aria-label="모바일 이미지 URL"
          />
        </FieldRow>
        <FieldRow label="데스크탑" code="img[src]">
          <input
            className={inputClass}
            value={value.desktopImageUrl}
            onChange={(event) =>
              patch({ desktopImageUrl: event.target.value })
            }
            spellCheck={false}
            aria-label="데스크탑 이미지 URL"
          />
        </FieldRow>
      </Section>
    </form>
  );
}

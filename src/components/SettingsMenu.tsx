import { useEffect, useId, useRef, useState } from 'react';

type SettingsMenuProps = {
  applyBoilerplateCss: boolean;
  onApplyBoilerplateCssChange: (value: boolean) => void;
  onClearStorage: () => void;
};

export function SettingsMenu({
  applyBoilerplateCss,
  onApplyBoilerplateCssChange,
  onClearStorage,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="설정"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      >
        <GearIcon />
      </button>
      {open ? (
        <SettingsPanel
          id={menuId}
          applyBoilerplateCss={applyBoilerplateCss}
          onApplyBoilerplateCssChange={onApplyBoilerplateCssChange}
          onClearStorage={() => {
            onClearStorage();
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function SettingsPanel({
  id,
  applyBoilerplateCss,
  onApplyBoilerplateCssChange,
  onClearStorage,
}: {
  id: string;
  applyBoilerplateCss: boolean;
  onApplyBoilerplateCssChange: (value: boolean) => void;
  onClearStorage: () => void;
}) {
  return (
    <div
      id={id}
      role="menu"
      className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white"
    >
      <label className="flex cursor-pointer items-center gap-2 px-2.5 py-2 text-[13px] text-zinc-800 hover:bg-zinc-50">
        <input
          type="checkbox"
          className="size-3.5 shrink-0 accent-zinc-800"
          checked={applyBoilerplateCss}
          onChange={(event) => onApplyBoilerplateCssChange(event.target.checked)}
        />
        보일러플레이트 CSS
      </label>
      <div className="h-px bg-zinc-100" />
      <button
        type="button"
        role="menuitem"
        onClick={onClearStorage}
        className="w-full px-2.5 py-2 text-left hover:bg-zinc-50"
      >
        <span className="block text-[13px] text-zinc-700">저장된 데이터 지우기</span>
        <span className="mt-0.5 block text-[11px] text-zinc-400">
          URL 및 localStorage
        </span>
      </button>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.214 1.265l-1.267.966a7.05 7.05 0 0 1 0 2.294l1.267.966a1 1 0 0 1 .214 1.265l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447L1.616 13.24a1 1 0 0 1 .214-1.265l1.267-.966a7.05 7.05 0 0 1 0-2.294l-1.267-.966a1 1 0 0 1-.214-1.265l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      />
    </svg>
  );
}

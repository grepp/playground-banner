import type { Diagnostic } from '../lib/diagnostics';

type DiagnosticsBarProps = {
  diagnostics: Diagnostic[];
};

export function DiagnosticsBar({ diagnostics }: DiagnosticsBarProps) {
  if (diagnostics.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1 border-t border-zinc-200 bg-white px-4 py-2">
      {diagnostics.map((item) => (
        <li
          key={`${item.level}:${item.message}`}
          className={
            item.level === 'error'
              ? 'text-sm text-red-700'
              : 'text-sm text-amber-800'
          }
        >
          <span className="mr-2 font-semibold">
            {item.level === 'error' ? '오류' : '주의'}
          </span>
          {item.message}
        </li>
      ))}
    </ul>
  );
}

type SegmentedControlProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  'aria-label': string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="flex rounded-md bg-zinc-100 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={
            value === option.value
              ? 'rounded px-2.5 py-1 text-xs font-medium bg-white text-zinc-900 shadow-sm'
              : 'rounded px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-800'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

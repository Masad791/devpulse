"use client";

/** A <select> that submits its form on change (the one bit of JS the filters need). */
export function AutoSubmitSelect({
  options,
  ...props
}: { options: [value: string, label: string][] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm text-fg"
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

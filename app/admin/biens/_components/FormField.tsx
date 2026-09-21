import type { ReactNode } from "react";

export const inputClass =
  "rounded-xl border border-anthracite-200 px-3 py-2.5 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-400 disabled:bg-anthracite-50 disabled:text-anthracite-400";

export const checkboxClass = "h-4 w-4 rounded border-anthracite-300 focus-visible:ring-2 focus-visible:ring-gold-400";

export function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={htmlFor}>
      <span className="text-xs font-semibold uppercase tracking-wider text-anthracite-500">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function CheckboxField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-anthracite-800">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className={checkboxClass} />
      {label}
    </label>
  );
}

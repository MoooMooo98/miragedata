"use client";

import type { ReactNode } from "react";

export function Card({
  title,
  children,
  accent,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={`mb-4 rounded-[10px] border bg-white p-4 sm:px-5 ${className}`}
      style={{ borderColor: accent ?? "#dddddd" }}
    >
      {title != null && (
        <h3
          className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#888]"
          style={accent ? { color: accent } : undefined}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function Callout({
  kind = "info",
  children,
}: {
  kind?: "info" | "warn" | "danger";
  children: ReactNode;
}) {
  const map = {
    info: "bg-[#eef6ff] border-[#b7d7f4] text-[#185fa5]",
    warn: "bg-[#fff8e8] border-[#f5c842] text-[#7a5a00]",
    danger: "bg-[#fff0f0] border-[#f0b0b0] text-[#8f2424]",
  } as const;
  return (
    <div
      className={`mb-3 rounded-lg border px-3.5 py-2.5 text-[11px] leading-[1.5] ${map[kind]}`}
    >
      {children}
    </div>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-[#9FE1CB] bg-[#f0faf6] px-4 py-2.5 text-xs leading-[1.5] text-[#0F6E56]">
      {children}
    </div>
  );
}

const chipMap: Record<string, string> = {
  g: "bg-[#eaf3de] text-[#3b6d11]",
  a: "bg-[#faeeda] text-[#854f0b]",
  r: "bg-[#fcebeb] text-[#a32d2d]",
  b: "bg-[#e6f1fb] text-[#185fa5]",
  bm: "bg-[#efeafc] text-[#5b3fc4]",
};
export function Chip({
  tone = "g",
  children,
}: {
  tone?: keyof typeof chipMap;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${chipMap[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-[3px] block text-[11px] font-medium text-[#666]">
        {label}
      </span>
      {children}
      {hint != null && (
        <span className="mt-0.5 block text-[10px] leading-[1.3] text-[#999]">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-[#ccc] bg-white px-[9px] py-[5px] text-xs text-[#1a1a18] outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/15";

export function NumberField({
  label,
  hint,
  value,
  onChange,
  step,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        className={inputCls}
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </Field>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: T;
  options: readonly (T | { value: T; label: string })[];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => {
          const val = typeof o === "object" ? o.value : o;
          const txt = typeof o === "object" ? o.label : o;
          return (
            <option key={val} value={val}>
              {txt}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function BarRow({
  label,
  fmtValue,
  frac,
  color,
}: {
  label: string;
  fmtValue: string;
  frac: number;
  color: string;
}) {
  return (
    <div className="mb-[7px] flex items-center gap-2">
      <span className="w-[190px] flex-shrink-0 text-[11px] text-[#666]">
        {label}
      </span>
      <div className="h-1.5 flex-1 rounded bg-[#f0f0ee]">
        <div
          className="h-1.5 rounded"
          style={{
            width: `${Math.round(clampFrac(frac) * 100)}%`,
            background: color,
          }}
        />
      </div>
      <span className="w-[120px] flex-shrink-0 text-right text-[11px] text-[#555]">
        {fmtValue}
      </span>
    </div>
  );
}
function clampFrac(v: number) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}

export const GRID2 = "grid grid-cols-1 gap-x-[1.1rem] gap-y-[0.7rem] sm:grid-cols-2";
export const GRID3 =
  "grid grid-cols-1 gap-x-[1.1rem] gap-y-[0.7rem] sm:grid-cols-2 lg:grid-cols-3";
export const GRID4 =
  "grid grid-cols-1 gap-x-4 gap-y-[0.6rem] sm:grid-cols-2 lg:grid-cols-4";

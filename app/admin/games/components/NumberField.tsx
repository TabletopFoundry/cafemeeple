"use client";

import { useId } from "react";

interface NumberFieldProps {
  id?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

export default function NumberField({ id, label, value, onChange, min = 1, max, suffix }: NumberFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || min)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-violet-500 transition focus:ring-2"
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "min" | "max"> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
};

const parseDraft = (value: string) => Number(value.replace(",", "."));

export default function EditableNumberInput({ value, onValueChange, min = -Infinity, max = Infinity, onBlur, onFocus, onKeyDown, ...props }: Props) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseDraft(raw);
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
    onValueChange(next);
    setDraft(String(next));
  };

  return <input
    {...props}
    type="text"
    inputMode="decimal"
    value={draft}
    onFocus={(event) => {
      focused.current = true;
      event.currentTarget.select();
      onFocus?.(event);
    }}
    onChange={(event) => {
      const raw = event.target.value;
      if (/^-?\d*[.,]?\d*$/.test(raw)) setDraft(raw);
    }}
    onBlur={(event) => {
      focused.current = false;
      commit(event.currentTarget.value);
      onBlur?.(event);
    }}
    onKeyDown={(event) => {
      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") { setDraft(String(value)); event.currentTarget.blur(); }
      onKeyDown?.(event);
    }}
  />;
}

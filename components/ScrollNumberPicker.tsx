"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  label: string;
  hint: string;
  done: string;
};

const ITEM_HEIGHT = 48;

export default function ScrollNumberPicker({ value, onValueChange, min, max, step = 1, suffix = "", label, hint, done }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const scrollRef = useRef<HTMLDivElement>(null);
  const values = useMemo(() => {
    const count = Math.floor((max - min) / step) + 1;
    return Array.from({ length: count }, (_, index) => Number((min + index * step).toFixed(2)));
  }, [min, max, step]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    const index = Math.max(0, values.findIndex(item => item === value));
    const frame = requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = index * ITEM_HEIGHT; });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, value, values]);

  const choose = (next: number) => {
    setDraft(next);
    const index = values.indexOf(next);
    scrollRef.current?.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={`${label}: ${value} ${suffix}`} className="mt-2 flex h-14 w-full touch-manipulation items-center justify-between rounded-xl border border-ink/10 bg-white px-4 text-left shadow-sm outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10">
      <strong className="text-base">{value}</strong><span className="flex items-center gap-2 text-xs font-bold text-ink/35"><span>{suffix}</span><span className="text-lg text-tomato">↕</span></span>
    </button>
    {open && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label={label} className="w-full max-w-md rounded-[2rem] bg-cream p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-3xl font-semibold">{label}</h2><p className="mt-1 text-xs text-ink/45">{hint}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5 text-xl">×</button></div>
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="pointer-events-none absolute inset-x-3 top-24 z-10 h-12 rounded-xl border-y border-tomato/25 bg-tomato/[.07]"/>
          <div ref={scrollRef} onScroll={event => { const index = Math.max(0, Math.min(values.length - 1, Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT))); setDraft(values[index]); }} className="h-60 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="h-24"/>
            {values.map(item => <button type="button" key={item} onClick={() => choose(item)} className={`flex h-12 w-full snap-center items-center justify-center gap-2 text-lg transition ${draft === item ? "font-extrabold text-ink" : "font-semibold text-ink/25"}`}><span>{item}</span><span className="text-xs">{suffix}</span></button>)}
            <div className="h-24"/>
          </div>
        </div>
        <button type="button" onClick={() => { onValueChange(draft); setOpen(false); }} className="mt-5 min-h-12 w-full rounded-xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg">{done}: {draft} {suffix}</button>
      </section>
    </div>}
  </>;
}

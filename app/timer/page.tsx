"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import { formatBakeTimerClock, normalizeBakeTimerDuration, type BakeTimerStatus } from "@/lib/bake-timer";
import { pizzaStyleById } from "@/lib/pizza-styles";
import { settingsFromUrl } from "@/lib/recipe-url";
import type { PizzaStyleId, RecipeSettings } from "@/lib/saved-recipes";

type WakeStatus = "idle" | "active" | "unsupported" | "failed";
type LightMode = "off" | "torch" | "screen";
type WakeLockLike = { release: () => Promise<void>; addEventListener: (type: "release", listener: () => void) => void; released?: boolean };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> } };

const defaults: RecipeSettings = { pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy", fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria", pizzaStyleId: "neapolitan" };
const styleSeconds: Record<PizzaStyleId, number> = { neapolitan: 90, contemporary: 100, "new-york": 420, "roman-thin": 300, detroit: 840, sicilian: 900 };
const presets = [60, 90, 120, 300, 420];

const copy = {
  fi: {
    eyebrow: "Paistoajastin", title: "Pidä silmät pizzassa, me pidämme ajan.", intro: "Ajastin antaa viimeisille 10 sekunnille nousevan äänimerkin. Nollan jälkeen punainen yliaika jatkuu enintään 90 sekuntia.", back: "Takaisin valmistusohjeeseen", recipe: "Nykyinen pizzatyyli", recommended: "Tyylin oletusaika", quick: "Nopeat ajat", custom: "Säädä aikaa", start: "Käynnistä", pause: "Tauko", resume: "Jatka", reset: "Nollaa", minus: "Vähennä 10 sekuntia", plus: "Lisää 10 sekuntia", mute: "Äänet pois", sound: "Äänet päällä", ready: "Valmis käynnistettäväksi", running: "Pizza paistuu", paused: "Ajastin tauolla", overtime: "PIZZA ULOS!", expired: "90 sekuntia yliaikaa — tarkista pizza heti", wakeActive: "Näyttö pysyy päällä", wakeIdle: "Näyttö pidetään päällä, kun ajastin käynnistyy", wakeUnsupported: "Selain ei tue näytön hereillä pitämistä. Muuta tarvittaessa puhelimen automaattilukitusta.", wakeFailed: "Puhelin ei sallinut näytön lukitusta. Virransäästötila voi estää sen.", note: "Pidä sivu näkyvissä ajastuksen aikana. Jos vaihdat sovellusta, aika lasketaan silti todellisesta päättymishetkestä.", secondsLeft: "sekuntia jäljellä", overtimeLabel: "yliaikaa", maxOvertime: "Yliaika pysähtyy +1:30 kohdalla.", light: "Tarkistusvalo", lightOff: "Sammuta valo", torchOn: "Taskulamppu päällä", screenOn: "Valkoinen tarkistusvalo", whiteLight: "Avaa valkoinen näyttö", lightHint: "Android yrittää käyttää takasalamavaloa. iPhonessa avautuu kirkas valkoinen näkymä, jossa ajastin jatkaa toimintaansa.",
  },
  en: {
    eyebrow: "Bake timer", title: "Keep your eyes on the pizza. We will keep the time.", intro: "The final 10 seconds get a rising sound cue. After zero, red overtime runs for a maximum of 90 seconds.", back: "Back to preparation guide", recipe: "Current pizza style", recommended: "Style default", quick: "Quick times", custom: "Adjust time", start: "Start", pause: "Pause", resume: "Resume", reset: "Reset", minus: "Subtract 10 seconds", plus: "Add 10 seconds", mute: "Mute sounds", sound: "Sounds on", ready: "Ready to start", running: "Pizza is baking", paused: "Timer paused", overtime: "PIZZA OUT!", expired: "90 seconds overtime — check the pizza now", wakeActive: "Screen will stay awake", wakeIdle: "The screen will stay awake when the timer starts", wakeUnsupported: "This browser cannot keep the screen awake. Temporarily change the phone's auto-lock if needed.", wakeFailed: "The phone did not allow screen wake lock. Battery saving mode may block it.", note: "Keep this page visible while timing. If you switch apps, time is still calculated from the real finish time.", secondsLeft: "seconds left", overtimeLabel: "overtime", maxOvertime: "Overtime stops at +1:30.", light: "Inspection light", lightOff: "Turn light off", torchOn: "Flashlight on", screenOn: "White inspection light", whiteLight: "Open white screen", lightHint: "Android will try to use the rear flash. On iPhone a bright white view opens while the timer keeps running.",
  },
  sv: {
    eyebrow: "Gräddningstimer", title: "Håll ögonen på pizzan. Vi håller tiden.", intro: "De sista 10 sekunderna får en stigande ljudsignal. Efter noll fortsätter röd övertid i högst 90 sekunder.", back: "Tillbaka till tillagningsguiden", recipe: "Aktuell pizzastil", recommended: "Stilens standardtid", quick: "Snabbtider", custom: "Justera tiden", start: "Starta", pause: "Paus", resume: "Fortsätt", reset: "Nollställ", minus: "Minska med 10 sekunder", plus: "Öka med 10 sekunder", mute: "Stäng av ljud", sound: "Ljud på", ready: "Redo att starta", running: "Pizzan gräddas", paused: "Timern är pausad", overtime: "TA UT PIZZAN!", expired: "90 sekunders övertid — kontrollera pizzan nu", wakeActive: "Skärmen hålls vaken", wakeIdle: "Skärmen hålls vaken när timern startar", wakeUnsupported: "Webbläsaren kan inte hålla skärmen vaken. Ändra vid behov telefonens autolås.", wakeFailed: "Telefonen tillät inte skärmlåset. Strömsparläget kan blockera det.", note: "Håll sidan synlig under tidtagningen. Om du byter app beräknas tiden ändå från den verkliga sluttiden.", secondsLeft: "sekunder kvar", overtimeLabel: "övertid", maxOvertime: "Övertiden stannar vid +1:30.", light: "Kontrolljus", lightOff: "Släck ljuset", torchOn: "Ficklampan är på", screenOn: "Vitt kontrolljus", whiteLight: "Öppna vit skärm", lightHint: "Android försöker använda den bakre blixten. På iPhone öppnas en ljus vit vy medan timern fortsätter.",
  },
} as const;

const clock = formatBakeTimerClock;

export default function TimerPage() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [overtime, setOvertime] = useState(0);
  const [status, setStatus] = useState<BakeTimerStatus>("idle");
  const [wakeStatus, setWakeStatus] = useState<WakeStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [lightMode, setLightMode] = useState<LightMode>("off");
  const endAt = useRef(0);
  const lastBeep = useRef<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockLike | null>(null);
  const torchStream = useRef<MediaStream | null>(null);
  const t = copy.en;
  const style = pizzaStyleById(settings.pizzaStyleId, settings.goal);

  useEffect(() => {
    const shared = settingsFromUrl(location.search);
    const nextSettings = { ...defaults, ...Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) } as RecipeSettings;
    const styleId = pizzaStyleById(nextSettings.pizzaStyleId, nextSettings.goal).id;
    const initial = normalizeBakeTimerDuration(Number(new URLSearchParams(location.search).get("timer")) || styleSeconds[styleId], styleSeconds[styleId]);
    setSettings(nextSettings); setDuration(initial); setRemaining(initial); document.documentElement.lang = "en"; setReady(true);
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try { await wakeLock.current?.release(); } catch { /* The system may already have released it. */ }
    wakeLock.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    const wakeNavigator = navigator as NavigatorWithWakeLock;
    if (!wakeNavigator.wakeLock) { setWakeStatus("unsupported"); return; }
    try {
      const sentinel = await wakeNavigator.wakeLock.request("screen");
      wakeLock.current = sentinel; setWakeStatus("active");
      sentinel.addEventListener("release", () => { wakeLock.current = null; setWakeStatus(current => current === "idle" ? current : "failed"); });
    } catch { setWakeStatus("failed"); }
  }, []);

  const stopInspectionLight = useCallback(() => {
    torchStream.current?.getTracks().forEach(track => track.stop());
    torchStream.current = null;
    setLightMode("off");
  }, []);

  const toggleInspectionLight = useCallback(async () => {
    if (lightMode !== "off") { stopInspectionLight(); return; }
    const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (appleMobile || !navigator.mediaDevices?.getUserMedia) { setLightMode("screen"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      if (!track || !capabilities?.torch) { stream.getTracks().forEach(item => item.stop()); setLightMode("screen"); return; }
      await track.applyConstraints({ advanced: [{ torch: true }] } as unknown as MediaTrackConstraints);
      torchStream.current = stream;
      setLightMode("torch");
    } catch { setLightMode("screen"); }
  }, [lightMode, stopInspectionLight]);

  const beep = useCallback((frequency: number, length = .09) => {
    if (muted) return;
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const context = audio.current ?? new AudioCtor(); audio.current = context;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.16, context.currentTime + .01); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + length);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + length + .02);
  }, [muted]);

  useEffect(() => {
    if (status !== "running" && status !== "overtime") return;
    const update = () => {
      const difference = endAt.current - Date.now();
      if (difference > 0) { setRemaining(Math.ceil(difference / 1000)); return; }
      setRemaining(0);
      const extra = Math.min(90, Math.floor(Math.abs(difference) / 1000));
      setOvertime(extra);
      if (extra >= 90) { setStatus("expired"); void releaseWakeLock(); }
      else setStatus(current => current === "overtime" ? current : "overtime");
    };
    update(); const interval = window.setInterval(update, 100); return () => window.clearInterval(interval);
  }, [status, releaseWakeLock]);

  useEffect(() => {
    if (status !== "running" || remaining < 1 || remaining > 10 || lastBeep.current === remaining) return;
    lastBeep.current = remaining; beep(620 + (10 - remaining) * 55, remaining <= 3 ? .16 : .08);
    if (remaining <= 3 && "vibrate" in navigator) navigator.vibrate?.(35);
  }, [remaining, status, beep]);

  useEffect(() => {
    if (status !== "overtime") return;
    beep(1050, .4); if ("vibrate" in navigator) navigator.vibrate?.([100, 60, 180]);
  }, [status, beep]);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "visible" && (status === "running" || status === "overtime") && !wakeLock.current) void requestWakeLock(); };
    document.addEventListener("visibilitychange", onVisibility); return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [status, requestWakeLock]);

  useEffect(() => () => { void releaseWakeLock(); torchStream.current?.getTracks().forEach(track => track.stop()); audio.current?.close(); }, [releaseWakeLock]);

  const start = () => {
    const seconds = status === "paused" ? remaining : duration;
    if (seconds <= 0) return;
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtor) { audio.current ??= new AudioCtor(); void audio.current.resume(); }
    endAt.current = Date.now() + seconds * 1000; lastBeep.current = null; setOvertime(0); setRemaining(seconds); setStatus("running"); void requestWakeLock();
  };
  const pause = () => { const seconds = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)); setRemaining(seconds); setStatus("paused"); void releaseWakeLock(); setWakeStatus("idle"); };
  const reset = () => { setStatus("idle"); setRemaining(duration); setOvertime(0); lastBeep.current = null; void releaseWakeLock(); setWakeStatus("idle"); };
  const chooseDuration = (seconds: number) => { if (status === "running" || status === "overtime") return; setDuration(seconds); setRemaining(seconds); setOvertime(0); setStatus("idle"); };
  const adjust = (change: number) => chooseDuration(normalizeBakeTimerDuration(duration + change, duration));
  const timerValue = status === "overtime" || status === "expired" ? `+${clock(overtime)}` : clock(remaining);
  const statusText = status === "idle" ? t.ready : status === "running" ? remaining <= 10 ? `${remaining} ${t.secondsLeft}` : t.running : status === "paused" ? t.paused : status === "overtime" ? t.overtime : t.expired;
  const wakeText = wakeStatus === "active" ? t.wakeActive : wakeStatus === "unsupported" ? t.wakeUnsupported : wakeStatus === "failed" ? t.wakeFailed : t.wakeIdle;
  const wakeColor = wakeStatus === "active" ? "text-leaf" : wakeStatus === "unsupported" || wakeStatus === "failed" ? "text-tomato" : "text-ink/45";
  const urgent = status === "overtime" || status === "expired";
  const lastTen = status === "running" && remaining <= 10;

  if (!ready) return <main className="min-h-screen bg-cream"/>;
  return <main className={`min-h-screen px-4 py-6 pb-28 text-ink transition-colors duration-300 sm:px-6 ${urgent ? "bg-[#b62f20]" : "bg-cream"}`}>
    {lightMode === "screen" && <section className="fixed inset-0 z-[100] grid min-h-[100dvh] grid-rows-[auto_1fr_auto] bg-white p-4 text-ink" aria-label={t.screenOn}>
      <div className="flex items-center justify-between gap-3"><strong className="text-xs uppercase tracking-[.16em] text-ink/45">☀ {t.screenOn}</strong><button type="button" onClick={stopInspectionLight} className="min-h-12 rounded-full bg-ink px-5 text-sm font-extrabold text-white">✕ {t.lightOff}</button></div>
      <div className="grid place-items-center text-center"><div><p className={`font-mono text-[clamp(5rem,25vw,11rem)] font-black leading-none tracking-[-.08em] ${urgent ? "text-tomato" : "text-ink"}`} aria-live="polite">{timerValue}</p><p className={`mt-6 text-sm font-extrabold uppercase tracking-[.18em] ${urgent ? "text-tomato" : "text-ink/55"}`}>{statusText}</p></div></div>
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" onClick={() => setMuted(current => !current)} className="min-h-14 rounded-2xl border border-ink/15 bg-white text-sm font-extrabold">{muted ? "🔇 " + t.mute : "🔊 " + t.sound}</button>{status === "running" ? <button type="button" onClick={pause} className="min-h-14 rounded-2xl bg-ink text-sm font-extrabold text-white">Ⅱ {t.pause}</button> : status === "idle" || status === "paused" ? <button type="button" onClick={start} className="min-h-14 rounded-2xl bg-tomato text-sm font-extrabold text-white">▶ {status === "paused" ? t.resume : t.start}</button> : <button type="button" onClick={reset} className="min-h-14 rounded-2xl bg-tomato text-sm font-extrabold text-white">↺ {t.reset}</button>}</div>
    </section>}
    <div className="mx-auto max-w-4xl">
    <div className="flex items-center justify-between gap-2"><Link href="/session/start" className={`rounded-full px-4 py-2 text-xs font-bold ${urgent ? "bg-white/15 text-white" : "bg-white text-ink/65"}`}>← {t.back}</Link><div className="flex gap-2"><button type="button" onClick={() => void toggleInspectionLight()} className={`rounded-full px-3 py-2 text-xs font-bold ${urgent ? "bg-white/15 text-white" : lightMode === "torch" ? "bg-tomato text-white" : "bg-white text-ink/65"}`}>🔦 {lightMode === "torch" ? t.torchOn : t.light}</button><button type="button" onClick={() => setMuted(current => !current)} aria-label={muted ? t.mute : t.sound} className={`rounded-full px-3 py-2 text-xs font-bold ${urgent ? "bg-white/15 text-white" : "bg-white text-ink/65"}`}>{muted ? "🔇" : "🔊"}</button></div></div>
    <section className={`py-9 text-center ${urgent ? "text-white" : ""}`}><p className={`text-xs font-extrabold uppercase tracking-[.22em] ${urgent ? "text-white/55" : "text-tomato"}`}>{t.eyebrow}</p><h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">{t.title}</h1><p className={`mx-auto mt-4 max-w-2xl text-sm leading-6 ${urgent ? "text-white/65" : "text-ink/50"}`}>{t.intro}</p></section>
    <section className={`overflow-hidden rounded-[2rem] shadow-2xl ${urgent ? "bg-[#7d1d13] text-white" : "bg-ink text-white"}`}><div className="border-b border-white/10 p-5 text-center"><span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">{t.recipe}</span><strong className="ml-2 text-xs">{style.nameEn}</strong><span className="ml-2 text-[10px] text-white/35">· {t.recommended} {clock(styleSeconds[style.id])}</span></div><div className={`relative grid min-h-[22rem] place-items-center px-4 py-10 text-center ${lastTen ? "animate-pulse" : ""}`}><div><p className={`font-mono text-[clamp(4.8rem,24vw,10rem)] font-black leading-none tracking-[-.08em] ${lastTen ? "text-[#ffd166]" : ""}`} aria-live="polite">{timerValue}</p><p className={`mt-5 text-sm font-extrabold uppercase tracking-[.18em] ${urgent ? "text-white" : lastTen ? "text-[#ffd166]" : "text-white/45"}`}>{statusText}</p>{urgent && <p className="mt-2 text-xs text-white/50">{t.maxOvertime}</p>}</div></div><div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5 sm:grid-cols-3">{status === "running" ? <button type="button" onClick={pause} className="min-h-16 rounded-2xl bg-white text-lg font-extrabold text-ink">Ⅱ {t.pause}</button> : status === "idle" || status === "paused" ? <button type="button" onClick={start} className="min-h-16 rounded-2xl bg-tomato text-lg font-extrabold text-white sm:col-span-2">▶ {status === "paused" ? t.resume : t.start}</button> : null}<button type="button" onClick={reset} className="min-h-16 rounded-2xl bg-white/10 text-sm font-extrabold text-white">↺ {t.reset}</button></div></section>
    <section className="mt-5 grid gap-5 lg:grid-cols-2"><div className="rounded-[1.5rem] bg-white/80 p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">{t.quick}</h2><div className="mt-4 grid grid-cols-3 gap-2">{presets.map(seconds => <button key={seconds} type="button" disabled={status === "running" || status === "overtime"} onClick={() => chooseDuration(seconds)} className={`min-h-12 rounded-xl text-xs font-extrabold disabled:opacity-35 ${duration === seconds ? "bg-ink text-white" : "bg-cream text-ink/55"}`}>{clock(seconds)}</button>)}</div></div><div className="rounded-[1.5rem] bg-white/80 p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">{t.custom}</h2><div className="mt-4 grid grid-cols-[1fr_5rem_1fr] gap-2"><button type="button" disabled={status === "running" || status === "overtime"} onClick={() => adjust(-10)} aria-label={t.minus} className="min-h-14 rounded-xl bg-cream text-2xl font-black disabled:opacity-35">−</button><strong className="grid place-items-center font-mono text-xl">{clock(duration)}</strong><button type="button" disabled={status === "running" || status === "overtime"} onClick={() => adjust(10)} aria-label={t.plus} className="min-h-14 rounded-xl bg-cream text-2xl font-black disabled:opacity-35">+</button></div></div></section>
    <section className="mt-5 rounded-[1.5rem] bg-white/80 p-5 shadow-card"><div className="flex gap-3"><span className="text-xl">{wakeStatus === "active" ? "☀" : "◐"}</span><div><strong className={`text-sm ${wakeColor}`}>{wakeText}</strong><p className="mt-1 text-xs leading-5 text-ink/45">{t.note}</p></div></div><div className="mt-4 flex gap-3 border-t border-ink/10 pt-4"><span className="text-xl">🔦</span><div className="flex-1"><strong className="text-sm text-ink/70">{lightMode === "torch" ? t.torchOn : lightMode === "screen" ? t.screenOn : t.light}</strong><p className="mt-1 text-xs leading-5 text-ink/45">{t.lightHint}</p><button type="button" onClick={() => { stopInspectionLight(); setLightMode("screen"); }} className="mt-3 min-h-11 rounded-xl bg-cream px-4 text-xs font-extrabold text-ink/70">☀ {t.whiteLight}</button></div></div></section>
        <SiteFooter />
  </div></main>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { flourById } from "@/lib/flours";
import { compressJournalPhoto, deleteJournalEntry, loadJournalEntries, newJournalId, saveJournalEntry, type JournalEntry } from "@/lib/pizza-journal";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";

type Locale = "fi" | "en";
const defaults: RecipeSettings = { pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy", fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria" };
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };

const copy = {
  fi: {
    calculator: "Laskuri", planner: "Aikataulu", doctor: "Taikinalääkäri", styles: "Pizzatyylit", journal: "Päiväkirja", guide: "Ohjeet & termit", eyebrow: "Pizza Journal", title: "Muista, mikä teki pizzasta hyvän.", intro: "Tallenna paistokerta, kuva ja omat havainnot. Nykyisen laskurin resepti liitetään merkintään automaattisesti.", newEntry: "Uusi merkintä", name: "Paiston nimi", namePlaceholder: "Lauantain pizzailta", bakedAt: "Paistopäivä", photo: "Pizzakuva", photoHint: "Valinnainen · kuva pienennetään ennen tallennusta", taste: "Maku", texture: "Rakenne", handling: "Taikinan käsiteltävyys", notes: "Mitä tapahtui?", notesPlaceholder: "Reuna nousi hyvin, pohja olisi voinut olla rapeampi…", nextTime: "Mitä muutan seuraavalla kerralla?", nextPlaceholder: "Paistan hieman pidempään ja vähennän hydraatiota…", save: "Tallenna paisto", saving: "Tallennetaan…", saved: "Paisto tallennettu", failed: "Tallennus ei onnistunut tällä laitteella.", recipe: "Mukana oleva resepti", entries: "Omat paistot", empty: "Päiväkirjassa ei ole vielä merkintöjä.", openRecipe: "Avaa resepti", delete: "Poista", deleteConfirm: "Poistetaanko tämä päiväkirjamerkintä?", show: "Näytä tiedot", hide: "Piilota tiedot", noNotes: "Ei muistiinpanoja", storedLocally: "Päiväkirja ja kuvat säilytetään vain tällä laitteella ja tässä selaimessa.", ratings: "Arviot", balls: "palloa", fermentation: "Kohotus", flour: "Jauho", hydration: "Hydraatio",
  },
  en: {
    calculator: "Calculator", planner: "Planner", doctor: "Dough Doctor", styles: "Pizza styles", journal: "Journal", guide: "Guide & glossary", eyebrow: "Pizza Journal", title: "Remember what made the pizza great.", intro: "Save each bake, photo and observation. The calculator’s current recipe is attached automatically.", newEntry: "New entry", name: "Bake name", namePlaceholder: "Saturday pizza night", bakedAt: "Baking date", photo: "Pizza photo", photoHint: "Optional · the photo is reduced before storage", taste: "Taste", texture: "Texture", handling: "Dough handling", notes: "What happened?", notesPlaceholder: "The rim rose well, but the base could have been crisper…", nextTime: "What will I change next time?", nextPlaceholder: "Bake slightly longer and lower hydration…", save: "Save bake", saving: "Saving…", saved: "Bake saved", failed: "Saving failed on this device.", recipe: "Attached recipe", entries: "My bakes", empty: "There are no journal entries yet.", openRecipe: "Open recipe", delete: "Delete", deleteConfirm: "Delete this journal entry?", show: "Show details", hide: "Hide details", noNotes: "No notes", storedLocally: "The journal and photos are stored only on this device and in this browser.", ratings: "Ratings", balls: "balls", fermentation: "Fermentation", flour: "Flour", hydration: "Hydration",
  },
} as const;

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset><legend className="mb-2 text-xs font-bold text-ink/60">{label}</legend><div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => onChange(rating)} aria-label={`${label} ${rating}/5`} aria-pressed={value === rating} className={`grid h-10 w-10 place-items-center rounded-xl text-lg transition ${rating <= value ? "bg-tomato text-white" : "border border-ink/10 bg-white text-ink/25"}`}>★</button>)}</div></fieldset>;
}

function JournalPhoto({ blob, alt }: { blob: Blob; alt: string }) {
  const [source, setSource] = useState("");
  useEffect(() => { const url = URL.createObjectURL(blob); setSource(url); return () => URL.revokeObjectURL(url); }, [blob]);
  return source ? <Image src={source} alt={alt} fill unoptimized className="object-cover"/> : null;
}

export default function JournalPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [settings, setSettings] = useState<RecipeSettings>(defaults);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [name, setName] = useState("");
  const [bakedAt, setBakedAt] = useState(localDate);
  const [taste, setTaste] = useState(4);
  const [texture, setTexture] = useState(4);
  const [handling, setHandling] = useState(3);
  const [notes, setNotes] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [photo, setPhoto] = useState<Blob>();
  const [photoPreview, setPhotoPreview] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const t = copy[locale];
  const flour = flourById(settings.flourId);
  const query = recipeParams(settings).toString();

  useEffect(() => {
    const stored = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const nextLocale = stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const shared = settingsFromUrl(window.location.search);
    const validShared = Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) as Partial<RecipeSettings>;
    setLocale(nextLocale); setSettings({ ...defaults, ...validShared }); document.documentElement.lang = nextLocale;
    loadJournalEntries().then(setEntries).catch(() => setNotice(copy[nextLocale].failed)).finally(() => setReady(true));
  }, []);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  const choosePhoto = async (file?: File) => {
    if (!file) { setPhoto(undefined); setPhotoPreview(""); return; }
    const compressed = await compressJournalPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(compressed); setPhotoPreview(compressed ? URL.createObjectURL(compressed) : "");
  };

  const saveEntry = async () => {
    if (!name.trim()) return;
    setSaving(true); setNotice("");
    const entry: JournalEntry = { id: newJournalId(), createdAt: new Date().toISOString(), bakedAt, name: name.trim(), settings, tasteRating: taste, textureRating: texture, handlingRating: handling, notes: notes.trim(), nextTime: nextTime.trim(), photo };
    try {
      await saveJournalEntry(entry); setEntries((current) => [entry, ...current].sort((a, b) => b.bakedAt.localeCompare(a.bakedAt)));
      setName(""); setNotes(""); setNextTime(""); setPhoto(undefined); setPhotoPreview(""); setNotice(t.saved);
    } catch { setNotice(t.failed); } finally { setSaving(false); }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    await deleteJournalEntry(id); setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  if (!ready) return <main className="min-h-screen bg-cream" />;

  return <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8"><div className="mx-auto max-w-6xl">
    <header className="flex items-center justify-between gap-4"><Link href={`/?${query}`} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20">🍕</span><span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span></Link><nav className="hidden items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1 xl:flex"><Link href={`/?${query}`} className="rounded-full px-3 py-2 text-xs font-bold text-ink/55">{t.calculator}</Link><Link href={`/plan?${query}`} className="rounded-full px-3 py-2 text-xs font-bold text-ink/55">{t.planner}</Link><Link href={`/doctor?${query}`} className="rounded-full px-3 py-2 text-xs font-bold text-ink/55">{t.doctor}</Link><Link href="/styles" className="rounded-full px-3 py-2 text-xs font-bold text-ink/55">{t.styles}</Link><span className="rounded-full bg-ink px-3 py-2 text-xs font-bold text-white">{t.journal}</span></nav><Link href="/guide" className="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65">{t.guide}</Link></header>
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:hidden"><Link href={`/?${query}`} className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.calculator}</Link><Link href={`/plan?${query}`} className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.planner}</Link><Link href={`/doctor?${query}`} className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.doctor}</Link><Link href="/styles" className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.styles}</Link><span className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.journal}</span></nav>
    <section className="py-9 sm:py-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">{t.title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-ink/55 sm:text-base">{t.intro}</p></section>

    <div className="grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]"><section className="rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-card sm:p-7 lg:sticky lg:top-6"><h2 className="font-display text-3xl font-semibold">{t.newEntry}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-ink/60">{t.name}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm outline-none focus:border-tomato"/></label><label className="text-xs font-bold text-ink/60">{t.bakedAt}<input type="date" value={bakedAt} onChange={(event) => setBakedAt(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm outline-none focus:border-tomato"/></label></div><div className="mt-4 rounded-2xl bg-leaf/[.08] p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-leaf">{t.recipe}</p><strong className="mt-1 block text-sm">{flour.brand} {flour.name} · {settings.hydration} %</strong><span className="mt-1 block text-xs text-ink/50">{settings.pizzas} {t.balls} × {settings.ballWeight} g · {settings.fermentation.replaceAll("-", " ")}</span></div><label className="mt-4 block text-xs font-bold text-ink/60">{t.photo}<span className="ml-2 font-normal text-ink/35">{t.photoHint}</span><input type="file" accept="image/*" capture="environment" onChange={(event) => choosePhoto(event.target.files?.[0])} className="mt-2 block w-full rounded-xl border border-dashed border-ink/15 bg-cream p-3 text-xs"/></label>{photoPreview && <div className="relative mt-3 aspect-video overflow-hidden rounded-xl"><Image src={photoPreview} alt="" fill unoptimized className="object-cover"/></div>}<div className="mt-5 grid gap-4 sm:grid-cols-3"><Rating label={t.taste} value={taste} onChange={setTaste}/><Rating label={t.texture} value={texture} onChange={setTexture}/><Rating label={t.handling} value={handling} onChange={setHandling}/></div><label className="mt-5 block text-xs font-bold text-ink/60">{t.notes}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t.notesPlaceholder} rows={3} className="mt-2 w-full rounded-xl border border-ink/10 bg-white p-3 text-sm outline-none focus:border-tomato"/></label><label className="mt-4 block text-xs font-bold text-ink/60">{t.nextTime}<textarea value={nextTime} onChange={(event) => setNextTime(event.target.value)} placeholder={t.nextPlaceholder} rows={2} className="mt-2 w-full rounded-xl border border-ink/10 bg-white p-3 text-sm outline-none focus:border-tomato"/></label>{notice && <p className="mt-3 rounded-xl bg-leaf/10 px-3 py-2 text-xs font-bold text-leaf">{notice}</p>}<button type="button" onClick={saveEntry} disabled={!name.trim() || saving} className="mt-4 w-full rounded-xl bg-tomato px-4 py-3.5 text-sm font-extrabold text-white disabled:opacity-40">{saving ? t.saving : t.save}</button><p className="mt-3 text-[10px] leading-4 text-ink/35">{t.storedLocally}</p></section>

    <section><div className="flex items-center justify-between gap-4"><h2 className="font-display text-3xl font-semibold">{t.entries}</h2><span className="grid h-8 min-w-8 place-items-center rounded-full bg-ink px-2 text-xs font-bold text-white">{entries.length}</span></div>{entries.length === 0 ? <p className="mt-5 rounded-2xl border border-dashed border-ink/15 bg-white/50 px-4 py-8 text-center text-sm text-ink/40">{t.empty}</p> : <div className="mt-5 space-y-4">{entries.map((entry) => { const entryFlour = flourById(entry.settings.flourId); const isOpen = expanded === entry.id; return <article key={entry.id} className="overflow-hidden rounded-[1.5rem] border border-white bg-white/80 shadow-card"><div className="grid sm:grid-cols-[11rem_1fr]">{entry.photo ? <div className="relative aspect-video bg-ink/5 sm:aspect-auto sm:min-h-44"><JournalPhoto blob={entry.photo} alt={entry.name}/></div> : <div className="grid aspect-video place-items-center bg-leaf/[.08] text-4xl sm:aspect-auto">🍕</div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold">{entry.name}</h3><p className="mt-1 text-xs text-ink/40">{new Intl.DateTimeFormat(locale === "fi" ? "fi-FI" : "en-GB", { dateStyle: "long" }).format(new Date(`${entry.bakedAt}T12:00:00`))}</p></div><div className="text-right text-xs font-bold text-tomato">★ {entry.tasteRating}/5</div></div><p className="mt-3 text-xs text-ink/50">{entryFlour.brand} {entryFlour.name} · {entry.settings.hydration} % · {entry.settings.fermentation.replaceAll("-", " ")}</p><button type="button" onClick={() => setExpanded(isOpen ? null : entry.id)} className="mt-3 text-xs font-extrabold text-leaf">{isOpen ? t.hide : t.show} {isOpen ? "↑" : "↓"}</button></div></div>{isOpen && <div className="border-t border-ink/10 p-5"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-cream p-3"><span className="block text-[9px] uppercase text-ink/35">{t.taste}</span><strong>★ {entry.tasteRating}/5</strong></div><div className="rounded-xl bg-cream p-3"><span className="block text-[9px] uppercase text-ink/35">{t.texture}</span><strong>★ {entry.textureRating}/5</strong></div><div className="rounded-xl bg-cream p-3"><span className="block text-[9px] uppercase text-ink/35">{t.handling}</span><strong>★ {entry.handlingRating}/5</strong></div></div><p className="mt-4 text-sm leading-6 text-ink/60">{entry.notes || t.noNotes}</p>{entry.nextTime && <p className="mt-3 rounded-xl bg-tomato/[.06] p-3 text-sm leading-6 text-ink/60"><strong className="text-tomato">{t.nextTime}</strong><br/>{entry.nextTime}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/?${recipeParams(entry.settings).toString()}`} className="rounded-xl bg-ink px-3 py-3 text-center text-xs font-bold text-white">{t.openRecipe}</Link><button type="button" onClick={() => removeEntry(entry.id)} className="rounded-xl border border-tomato/20 px-3 py-3 text-xs font-bold text-tomato">{t.delete}</button></div></div>}</article>; })}</div>}</section></div>
    <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature locale={locale}/></footer>
  </div></main>;
}

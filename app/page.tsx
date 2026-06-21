"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppSignature from "@/components/AppSignature";
import EditableNumberInput from "@/components/EditableNumberInput";
import {
  loadSavedRecipes,
  newRecipeId,
  storeSavedRecipes,
  type Fermentation,
  type OvenType,
  type PizzaGoal,
  type SavedRecipe,
  type YeastType,
} from "@/lib/saved-recipes";
import { recipeParams, recipeUrl, settingsFromUrl } from "@/lib/recipe-url";
import { flourById, flourProfiles, type FlourId } from "@/lib/flours";
import { bakeFor } from "@/lib/baking";

type Locale = "en" | "fi";

const fermentationOptions: { value: Fermentation; hours: number; temperature: number }[] = [
  { value: "6h-room", hours: 6, temperature: 22 },
  { value: "12h-room", hours: 12, temperature: 22 },
  { value: "24h-room", hours: 24, temperature: 22 },
  { value: "24h-cold", hours: 24, temperature: 4 },
  { value: "48h-cold", hours: 48, temperature: 4 },
];

const quickFermentationOptions: Fermentation[] = ["6h-room", "12h-room", "24h-room", "24h-cold", "48h-cold"];

const presetFor = (goal: PizzaGoal, ovenTemperature: number, schedule: Fermentation) => {
  const hotOven = ovenTemperature >= 380;
  const scheduleOption = fermentationOptions.find((option) => option.value === schedule)!;
  const longFermentation = scheduleOption.hours >= 24;
  const presets = {
    balanced: hotOven
      ? { ballWeight: 260, hydration: 64, salt: 2.8, flourW: longFermentation ? "W 270–310" : "W 250–290", diameter: "30–32 cm" }
      : { ballWeight: 270, hydration: 65, salt: 2.8, flourW: longFermentation ? "W 270–310" : "W 250–290", diameter: "30–32 cm" },
    airy: hotOven
      ? { ballWeight: 260, hydration: 68, salt: 2.8, flourW: longFermentation ? "W 300–340" : "W 280–320", diameter: "30–32 cm" }
      : { ballWeight: 280, hydration: 72, salt: 2.8, flourW: longFermentation ? "W 300–340" : "W 290–330", diameter: "30–32 cm" },
    crispy: hotOven
      ? { ballWeight: 220, hydration: 60, salt: 2.6, flourW: longFermentation ? "W 240–280" : "W 220–260", diameter: "30–32 cm" }
      : { ballWeight: 230, hydration: 62, salt: 2.6, flourW: longFermentation ? "W 240–280" : "W 220–260", diameter: "30–32 cm" },
    pan: { ballWeight: 450, hydration: 75, salt: 2.8, flourW: longFermentation ? "W 300–350" : "W 280–330", diameter: "28 cm pan" },
  };
  return { ...presets[goal], fermentation: schedule, temperature: scheduleOption.temperature };
};

const copy = {
  en: {
    toolkit: "Baker's toolkit", guide: "Guide & glossary", calculator: "Calculator", planner: "Planner", doctor: "Dough Doctor", styles: "Pizza styles", journal: "Journal", eyebrow: "Pizza dough calculator", title: "Your next great pizza starts with the numbers.",
    intro: "Set your batch, style, and fermentation. We'll handle the baker's math.", build: "Fine-tune your batch",
    quickTitle: "What kind of pizza do you want?", quickIntro: "Choose a result, baking schedule and oven. The calculator builds a sensible medium-size starting recipe.", schedule: "When will you bake?",
    oven: "Which oven do you use?", homeOven: "Kitchen oven", homeOvenNote: "Stone or steel", gasOven: "Gas pizza oven", gasOvenNote: "Ooni, Chef Matteo, etc.", bakeGuide: "Baking recommendation", bakeTemperature: "Temperature", bakeTime: "Baking time", homePreheat: "Preheat the stone or steel thoroughly, usually 45–60 minutes.", gasPreheat: "Heat the stone fully and adjust the flame while turning the pizza.", panGasNote: "For pan pizza, verify that the pan is rated for this temperature and gas flame.", recommendation: "Recommended setup", flourStrength: "Flour strength", mediumSize: "Medium size", tune: "Fine-tune recipe", hideTune: "Hide fine-tuning", flourChoice: "Choose your pizza flour", flourIntro: "The flour profile suggests a suitable hydration and fermentation range.", protein: "Protein", suggestedHydration: "Hydration", suggestedTime: "Fermentation", bestFor: "Best for", applyFlour: "Use flour suggestion", flourApplied: "Flour suggestion applied", estimatedData: "Approximate profile — check the current values printed on your bag.", makerInfo: "Manufacturer information",
    goals: { balanced: ["Balanced", "Soft with a crisp base"], airy: ["Very airy", "Open, light crust"], crispy: ["Thin & crispy", "Low, crunchy profile"], pan: ["Airy pan", "Soft, tall and fluffy"] },
    pizzas: "Number of pizzas", ballWeight: "Dough ball weight", hydration: "Hydration", salt: "Salt", waste: "Extra for waste",
    yeastType: "Leavening type", fermentation: "Fermentation", temperature: "Room temperature", coldTemperature: "Refrigerator temperature", coldFixed: "Fixed by the cold-fermentation preset",
    yeasts: {
      cy: ["CY", "Compressed yeast"], ady: ["ADY", "Active dry yeast"], idy: ["IDY", "Instant dry yeast"],
      ssd: ["SSD", "Stiff sourdough (50%)"], lsd: ["LSD", "Liquid sourdough (100%)"],
    },
    ferment: {
      "6h-room": ["6h room", "Same-day"], "12h-room": ["12h room", "Overnight"], "24h-room": ["24h room", "Day + night"],
      "24h-cold": ["24h cold", "Fridge"], "48h-cold": ["48h cold", "Deep flavor"],
    },
    yourRecipe: "Your recipe", ready: "Ready to mix", total: "total", flour: "Flour", water: "Water",
    saveRecipe: "Save recipe", recipeName: "Recipe name", recipeNamePlaceholder: "Friday pizza", save: "Save", cancel: "Cancel", saved: "Recipe saved", myRecipes: "My recipes", noRecipes: "No saved recipes yet.", openRecipe: "Open", deleteRecipe: "Delete", deleteConfirm: "Delete this saved recipe?", savedOn: "Saved", recipeOpened: "Recipe opened", shareTitle: "Share your pizza", shareIntro: "Send a pizza card and recipe link to Instagram, WhatsApp or another app.", shareRecipe: "Share image", shareWhatsApp: "WhatsApp link", copyLink: "Copy recipe link", linkCopied: "Recipe link copied", shareText: "I’m making {style} pizza with DoughTools. Make your own pizza recipe:", shareFallback: "The recipe link was copied. You can paste it into Instagram or another app.",
    note: "Leavening is estimated from time and temperature. Flour strength, starter activity and actual dough temperature may require adjustment.",
    instructionsTitle: "Your dough plan", instructionsIntro: "Open the lighter planning view for step-by-step instructions and exact clock times.", openPlan: "Open instructions & schedule", startClock: "Start now or choose your desired baking time.",
    footer: "Made for better pizza nights.", bakers: "Baker's percentages are based on flour weight.", decrease: "Decrease number of pizzas", increase: "Increase number of pizzas",
  },
  fi: {
    toolkit: "Leipurin työkalut", guide: "Ohjeet ja terminologia", calculator: "Laskuri", planner: "Aikataulu", doctor: "Taikinalääkäri", styles: "Pizzatyylit", journal: "Päiväkirja", eyebrow: "Pizzataikinalaskuri", title: "Seuraava loistava pizzasi alkaa oikeista luvuista.",
    intro: "Valitse erän koko, tyyli ja kohotus. Me hoidamme leipurin laskut.", build: "Hienosäädä taikina",
    quickTitle: "Millaista pizzaa haluat?", quickIntro: "Valitse lopputulos, paistoajankohta ja uuni. Laskuri rakentaa järkevän lähtöreseptin keskikokoiselle pizzalle.", schedule: "Milloin paistat?",
    oven: "Mitä uunia käytät?", homeOven: "Keittiöuuni", homeOvenNote: "Kivi tai teräs", gasOven: "Kaasupizzauuni", gasOvenNote: "Ooni, Chef Matteo jne.", bakeGuide: "Paistosuositus", bakeTemperature: "Lämpötila", bakeTime: "Paistoaika", homePreheat: "Esilämmitä kiveä tai terästä kunnolla, yleensä 45–60 minuuttia.", gasPreheat: "Kuumenna kivi täysin ja säädä liekkiä pizzaa kääntäessäsi.", panGasNote: "Varmista pannupizzassa, että pannu kestää tämän lämpötilan ja kaasuliekin.", recommendation: "Suositeltu kokonaisuus", flourStrength: "Jauhon vahvuus", mediumSize: "Keskikoko", tune: "Hienosäädä reseptiä", hideTune: "Piilota hienosäätö", flourChoice: "Valitse pizzajauho", flourIntro: "Jauhoprofiili ehdottaa sille sopivaa hydraatiota ja kohotusaikaa.", protein: "Proteiini", suggestedHydration: "Hydraatio", suggestedTime: "Kohotus", bestFor: "Sopii parhaiten", applyFlour: "Käytä jauhosuositusta", flourApplied: "Jauhosuositus otettu käyttöön", estimatedData: "Arvioitu profiili – tarkista ajantasaiset arvot omasta jauhopussista.", makerInfo: "Valmistajan tiedot",
    goals: { balanced: ["Tasapainoinen", "Pehmeä ja rapeapohjainen"], airy: ["Erittäin ilmava", "Avoin ja kevyt reuna"], crispy: ["Ohut ja rapea", "Matala, rouskuva pohja"], pan: ["Ilmava pannupizza", "Pehmeä, korkea ja kuohkea"] },
    pizzas: "Pizzojen määrä", ballWeight: "Taikinapallon paino", hydration: "Hydraatio", salt: "Suola", waste: "Hävikkivara",
    yeastType: "Kohotustapa", fermentation: "Kohotus", temperature: "Huonelämpötila", coldTemperature: "Jääkaapin lämpötila", coldFixed: "Kylmäkohotuksen vakioasetus",
    yeasts: {
      cy: ["CY", "Puristehiiva"], ady: ["ADY", "Aktiivikuivahiiva"], idy: ["IDY", "Pikakuivahiiva"],
      ssd: ["SSD", "Jäykkä juuri (50 %)"], lsd: ["LSD", "Nestemäinen juuri (100 %)"],
    },
    ferment: {
      "6h-room": ["6 h huone", "Samana päivänä"], "12h-room": ["12 h huone", "Yön yli"], "24h-room": ["24 h huone", "Päivä + yö"],
      "24h-cold": ["24 h kylmä", "Jääkaapissa"], "48h-cold": ["48 h kylmä", "Syvä maku"],
    },
    yourRecipe: "Reseptisi", ready: "Valmis sekoitettavaksi", total: "yhteensä", flour: "Jauhot", water: "Vesi",
    saveRecipe: "Tallenna resepti", recipeName: "Reseptin nimi", recipeNamePlaceholder: "Perjantain pizza", save: "Tallenna", cancel: "Peruuta", saved: "Resepti tallennettu", myRecipes: "Omat reseptit", noRecipes: "Ei vielä tallennettuja reseptejä.", openRecipe: "Avaa", deleteRecipe: "Poista", deleteConfirm: "Poistetaanko tämä tallennettu resepti?", savedOn: "Tallennettu", recipeOpened: "Resepti avattu", shareTitle: "Jaa pizzasi", shareIntro: "Lähetä pizzakortti ja reseptilinkki Instagramiin, WhatsAppiin tai muuhun sovellukseen.", shareRecipe: "Jaa kuva", shareWhatsApp: "WhatsApp-linkki", copyLink: "Kopioi reseptilinkki", linkCopied: "Reseptilinkki kopioitu", shareText: "Teen {style}-pizzaa DoughToolsilla. Tee oma pizzareseptisi:", shareFallback: "Reseptilinkki kopioitiin. Voit liittää sen Instagramiin tai muuhun sovellukseen.",
    note: "Kohotteen määrä arvioidaan ajan ja lämpötilan perusteella. Jauhon vahvuus, juuren aktiivisuus ja taikinan todellinen lämpötila voivat vaatia säätöä.",
    instructionsTitle: "Taikinasi valmistusohje", instructionsIntro: "Avaa kevyt suunnittelunäkymä, jossa ovat vaiheittaiset ohjeet ja tarkat kellonajat.", openPlan: "Avaa valmistusohje ja aikataulu", startClock: "Aloita nyt tai valitse haluamasi paistoaika.",
    footer: "Parempia pizzailtoja varten.", bakers: "Leipurin prosentit lasketaan jauhojen painosta.", decrease: "Vähennä pizzojen määrää", increase: "Lisää pizzojen määrää",
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value || 0));
const steppedValue = (value: number, direction: -1 | 1, step: number, min: number, max: number) => {
  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return clamp(Number((value + direction * step).toFixed(decimals)), min, max);
};
const grams = (value: number, locale: Locale, precise = false) => new Intl.NumberFormat(locale === "fi" ? "fi-FI" : "en-US", {
  maximumFractionDigits: precise ? (value < 10 ? 2 : 1) : (value < 10 ? 1 : 0),
}).format(value);

const shareCardFile = async (title: string, subtitle: string, details: string[]) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#f6f3ea";
  context.fillRect(0, 0, 1080, 1080);
  context.fillStyle = "#e34a2c";
  context.beginPath();
  context.arc(880, 190, 300, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#efc46d";
  context.beginPath();
  context.arc(820, 250, 220, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#d99b42";
  context.lineWidth = 28;
  context.stroke();
  [[735, 175], [895, 180], [780, 310], [920, 330]].forEach(([x, y]) => {
    context.fillStyle = "#bf3826";
    context.beginPath();
    context.arc(x, y, 38, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = "#18221b";
  context.font = "800 46px Arial, sans-serif";
  context.fillText("Dough", 72, 105);
  context.fillStyle = "#e34a2c";
  context.fillText("Tools", 222, 105);
  context.fillStyle = "#18221b";
  context.font = "700 84px Georgia, serif";
  context.fillText(title, 72, 520);
  context.fillStyle = "rgba(24,34,27,.62)";
  context.font = "500 34px Arial, sans-serif";
  context.fillText(subtitle, 72, 580);
  details.forEach((line, index) => {
    context.fillStyle = index === 0 ? "#e34a2c" : "#18221b";
    context.font = `${index === 0 ? "800" : "700"} 37px Arial, sans-serif`;
    context.fillText(line, 72, 700 + index * 62);
  });
  context.fillStyle = "#18221b";
  context.fillRect(0, 975, 1080, 105);
  context.fillStyle = "#fff";
  context.font = "600 30px Arial, sans-serif";
  context.fillText("doughtools — make your own perfect pizza", 72, 1040);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  return blob ? new File([blob], "doughtools-recipe.png", { type: "image/png" }) : null;
};

function NumberField({ id, label, value, min, max, step = 1, suffix, stepper = false, decreaseLabel = "Decrease", increaseLabel = "Increase", onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; stepper?: boolean; decreaseLabel?: string; increaseLabel?: string; onChange: (value: number) => void;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink/70">{label}</label>
      <div className={`relative ${stepper ? "grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] gap-2" : "block"}`}>
        {stepper && <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(steppedValue(value, -1, step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition active:scale-95 disabled:opacity-30">−</button>}
        <div className="relative min-w-0">
          <EditableNumberInput id={id} min={min} max={max} value={value} onValueChange={onChange}
            className={`h-14 min-w-0 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 ${stepper ? "text-center" : "pr-12"}`} />
          {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/40">{suffix}</span>}
        </div>
        {stepper && <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(steppedValue(value, 1, step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition active:scale-95 disabled:opacity-30">+</button>}
      </div>
    </div>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [goal, setGoal] = useState<PizzaGoal>("balanced");
  const [ovenType, setOvenType] = useState<OvenType>("gas");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pizzas, setPizzas] = useState(6);
  const [ballWeight, setBallWeight] = useState(260);
  const [waste, setWaste] = useState(3);
  const [hydration, setHydration] = useState(64);
  const [salt, setSalt] = useState(2.8);
  const [yeastType, setYeastType] = useState<YeastType>("idy");
  const [fermentation, setFermentation] = useState<Fermentation>("24h-cold");
  const [temperature, setTemperature] = useState(4);
  const [flourId, setFlourId] = useState<FlourId>("caputo-pizzeria");
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeNotice, setRecipeNotice] = useState("");
  const [urlReady, setUrlReady] = useState(false);
  const t = copy[locale];
  const isColdFermentation = fermentation.endsWith("cold");
  const activeBake = bakeFor(goal, ovenType);
  const ovenTemperature = activeBake.temperature;
  const activePreset = presetFor(goal, ovenTemperature, fermentation);
  const activeFlour = flourById(flourId);

  useEffect(() => {
    const saved = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const detected: Locale = navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const nextLocale = saved === "fi" || saved === "en" ? saved : detected;
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  useEffect(() => {
    setSavedRecipes(loadSavedRecipes());
  }, []);

  useEffect(() => {
    const shared = settingsFromUrl(window.location.search);
    if (shared.pizzas !== undefined) setPizzas(shared.pizzas);
    if (shared.ballWeight !== undefined) setBallWeight(shared.ballWeight);
    if (shared.waste !== undefined) setWaste(shared.waste);
    if (shared.hydration !== undefined) setHydration(shared.hydration);
    if (shared.salt !== undefined) setSalt(shared.salt);
    if (shared.yeastType !== undefined) setYeastType(shared.yeastType);
    if (shared.fermentation !== undefined) setFermentation(shared.fermentation);
    if (shared.temperature !== undefined) setTemperature(shared.temperature);
    if (shared.goal !== undefined) setGoal(shared.goal);
    if (shared.ovenType !== undefined) setOvenType(shared.ovenType);
    if (shared.flourId !== undefined) setFlourId(shared.flourId);
    setUrlReady(true);
  }, []);

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("doughtools-locale", nextLocale);
    document.documentElement.lang = nextLocale;
  };

  const applyPreset = (nextGoal: PizzaGoal, nextOvenType = ovenType, nextFermentation = fermentation) => {
    const nextOvenTemperature = bakeFor(nextGoal, nextOvenType).temperature;
    const preset = presetFor(nextGoal, nextOvenTemperature, nextFermentation);
    setGoal(nextGoal);
    setOvenType(nextOvenType);
    setBallWeight(preset.ballWeight);
    setHydration(preset.hydration);
    setSalt(preset.salt);
    setFermentation(preset.fermentation);
    setTemperature(preset.temperature);
    setYeastType("idy");
  };

  const recipe = useMemo(() => {
    const total = pizzas * ballWeight * (1 + waste / 100);
    const option = fermentationOptions.find((item) => item.value === fermentation)!;
    // Calibrated to the supplied reference: CY 0.14335% at 12 h / 22°C.
    // Fermentation activity roughly doubles for every 10°C rise (Q10 model).
    const effectiveHours = option.hours * Math.pow(2, (temperature - 22) / 10);
    const cyPercent = 0.14335 * (12 / Math.max(effectiveHours, 0.25));
    const commercialFactors = { cy: 1, ady: 0.52, idy: 0.414 } as const;
    const isSourdough = yeastType === "ssd" || yeastType === "lsd";

    if (isSourdough) {
      const totalFlour = total / (1 + hydration / 100 + salt / 100);
      const referenceStarterPercent = yeastType === "ssd" ? 11 : 8.39;
      const starterPercent = referenceStarterPercent * (cyPercent / 0.14335);
      const starterHydration = yeastType === "ssd" ? 0.5 : 1;
      const leavener = totalFlour * starterPercent / 100;
      const starterFlour = leavener / (1 + starterHydration);
      const starterWater = leavener - starterFlour;
      return {
        total,
        flour: Math.max(0, totalFlour - starterFlour),
        water: Math.max(0, totalFlour * hydration / 100 - starterWater),
        salt: totalFlour * salt / 100,
        leavener,
      };
    }

    const yeastPercent = cyPercent * commercialFactors[yeastType];
    const flour = total / (1 + hydration / 100 + salt / 100 + yeastPercent / 100);
    return {
      total,
      flour,
      water: flour * hydration / 100,
      salt: flour * salt / 100,
      leavener: flour * yeastPercent / 100,
    };
  }, [pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation, temperature]);

  const currentSettings = useMemo(() => ({
    pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation, temperature, goal, ovenType, flourId,
  }), [pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation, temperature, goal, ovenType, flourId]);

  const planHref = `/plan?${recipeParams(currentSettings).toString()}`;
  const doctorHref = `/doctor?${recipeParams(currentSettings).toString()}`;
  const stylesHref = "/styles";
  const journalHref = `/journal?${recipeParams(currentSettings).toString()}`;

  useEffect(() => {
    if (!urlReady) return;
    const query = recipeParams(currentSettings).toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
  }, [currentSettings, urlReady]);

  const copyRecipeLink = async () => {
    await navigator.clipboard.writeText(recipeUrl(currentSettings));
    setRecipeNotice(t.linkCopied);
  };

  const shareRecipe = async () => {
    const url = recipeUrl(currentSettings);
    const style = t.goals[goal][0];
    const text = t.shareText.replace("{style}", style.toLowerCase());
    const card = await shareCardFile(
      style,
      `${pizzas} × ${ballWeight} g`,
      [`${hydration} % ${t.hydration.toLowerCase()}`, `${t.ferment[fermentation][0]} · ${activeBake.temperature} °C · ${activeBake.time}`],
    );
    try {
      if (navigator.share) {
        const files = card ? [card] : [];
        const shareData: ShareData = { title: `DoughTools – ${style}`, text, url };
        if (files.length && navigator.canShare?.({ files })) shareData.files = files;
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setRecipeNotice(t.shareFallback);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await navigator.clipboard.writeText(url);
      setRecipeNotice(t.shareFallback);
    }
  };

  const shareToWhatsApp = () => {
    const url = recipeUrl(currentSettings);
    const style = t.goals[goal][0];
    const text = `${t.shareText.replace("{style}", style.toLowerCase())} ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const applyFlourSuggestion = () => {
    const option = fermentationOptions.find((item) => item.value === activeFlour.recommendedFermentation)!;
    setHydration(activeFlour.recommendedHydration);
    setFermentation(activeFlour.recommendedFermentation);
    setTemperature(option.temperature);
    setRecipeNotice(t.flourApplied);
  };

  const saveCurrentRecipe = () => {
    const name = recipeName.trim();
    if (!name) return;
    const savedRecipe: SavedRecipe = {
      id: newRecipeId(),
      name,
      createdAt: new Date().toISOString(),
      settings: currentSettings,
      ingredients: recipe,
    };
    const nextRecipes = [savedRecipe, ...savedRecipes];
    storeSavedRecipes(nextRecipes);
    setSavedRecipes(nextRecipes);
    setRecipeName("");
    setShowSaveForm(false);
    setRecipeNotice(t.saved);
  };

  const openSavedRecipe = (savedRecipe: SavedRecipe) => {
    const settings = savedRecipe.settings;
    setPizzas(settings.pizzas);
    setBallWeight(settings.ballWeight);
    setWaste(settings.waste);
    setHydration(settings.hydration);
    setSalt(settings.salt);
    setYeastType(settings.yeastType);
    setFermentation(settings.fermentation);
    setTemperature(settings.temperature);
    setGoal(settings.goal);
    setOvenType(settings.ovenType);
    setFlourId(settings.flourId ?? "caputo-pizzeria");
    setRecipeNotice(t.recipeOpened);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
  };

  const deleteSavedRecipe = (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const nextRecipes = savedRecipes.filter((savedRecipe) => savedRecipe.id !== id);
    storeSavedRecipes(nextRecipes);
    setSavedRecipes(nextRecipes);
  };

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex items-center justify-between sm:mb-10">
          <a href="#top" className="flex items-center gap-3" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 15.5C7.8 7.9 17.6 5 20 7c-.3 6.4-4.9 12.1-12 12.5-3.4.2-5.3-1.4-4-4Z"/><circle cx="10" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span>
          </a>
          <nav className="hidden items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1 xl:flex" aria-label={t.toolkit}>
            <a href="#top" className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.calculator}</a>
            <Link href={planHref} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">{t.planner}</Link>
            <Link href={doctorHref} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">{t.doctor}</Link>
            <Link href={stylesHref} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">{t.styles}</Link>
            <Link href={journalHref} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">{t.journal}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/guide" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink sm:block">{t.guide}</Link>
            <Link href="/history" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink lg:block">{locale === "fi" ? "Pizzan historia" : "Pizza history"}</Link>
            <Link href="/ovens" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink lg:block">{locale === "fi" ? "Uuniopas" : "Oven guide"}</Link>
            <Link href="/gear" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">{locale === "fi" ? "Varusteet" : "Gear"}</Link>
            <Link href={`/sauce?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">{locale === "fi" ? "Kastike" : "Sauce"}</Link>
            <Link href={`/costs?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">{locale === "fi" ? "Kustannukset" : "Costs"}</Link>
            <Link href={`/coach?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full bg-tomato px-3 py-2 text-xs font-bold text-white transition hover:bg-tomato/90 xl:block">AI Coach</Link>
            <Link href={`/community?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">{locale === "fi" ? "Yhteisö" : "Community"}</Link>
            <div className="flex rounded-full border border-ink/10 bg-white/70 p-1" aria-label="Language">
              {(["fi", "en"] as Locale[]).map((language) => <button key={language} type="button" onClick={() => changeLocale(language)} aria-pressed={locale === language} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase transition ${locale === language ? "bg-ink text-white" : "text-ink/45"}`}>{language}</button>)}
            </div>
            <span className="hidden rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-leaf md:block">{t.toolkit}</span>
          </div>
        </header>

        <nav className="mb-7 flex gap-2 overflow-x-auto pb-1 xl:hidden" aria-label={t.toolkit}>
          <a href="#top" className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.calculator}</a>
          <Link href={planHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.planner}</Link>
          <Link href={doctorHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.doctor}</Link>
          <Link href={stylesHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.styles}</Link>
          <Link href={journalHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.journal}</Link>
          <Link href="/history" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Pizzan historia" : "Pizza history"}</Link>
          <Link href="/ovens" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Uuniopas" : "Oven guide"}</Link>
          <Link href="/gear" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Varusteet" : "Gear"}</Link>
          <Link href={`/sauce?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Kastike" : "Sauce"}</Link>
          <Link href={`/costs?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Kustannukset" : "Costs"}</Link>
          <Link href={`/coach?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full bg-tomato px-4 py-2 text-xs font-bold text-white">AI Coach</Link>
          <Link href={`/community?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{locale === "fi" ? "Yhteisö" : "Community"}</Link>
        </nav>

        <section id="top" className="mb-7 max-w-2xl sm:mb-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60 sm:text-base">{t.intro}</p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr] lg:gap-7">
          <section className="rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="recipe-settings">
            <div className="mb-2 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">1</span><h2 id="recipe-settings" className="font-display text-2xl font-semibold">{t.quickTitle}</h2></div>
            <p className="mb-5 text-sm leading-6 text-ink/55">{t.quickIntro}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["balanced", "airy", "crispy", "pan"] as PizzaGoal[]).map((option) => (
                <button key={option} type="button" onClick={() => applyPreset(option)} aria-pressed={goal === option} className={`min-h-20 rounded-2xl border p-3 text-left transition ${goal === option ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white hover:border-ink/25"}`}>
                  <span className="block text-sm font-extrabold">{t.goals[option][0]}</span>
                  <span className={`mt-1 block text-[11px] leading-4 ${goal === option ? "text-white/70" : "text-ink/45"}`}>{t.goals[option][1]}</span>
                </button>
              ))}
            </div>
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold text-ink/70">{t.schedule}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {quickFermentationOptions.map((option) => <button key={option} type="button" onClick={() => applyPreset(goal, ovenType, option)} aria-pressed={fermentation === option} className={`rounded-2xl border px-3 py-3 text-left transition sm:text-center ${fermentation === option ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white hover:border-ink/25"}`}><span className="block text-sm font-extrabold">{t.ferment[option][0]}</span><span className={`mt-1 block text-[10px] ${fermentation === option ? "text-white/65" : "text-ink/40"}`}>{t.ferment[option][1]}</span></button>)}
              </div>
            </fieldset>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField id="quick-pizzas" label={t.pizzas} value={pizzas} min={1} max={50} stepper decreaseLabel={t.decrease} increaseLabel={t.increase} onChange={setPizzas} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">{t.oven}</legend>
                <div className="grid h-14 grid-cols-2 rounded-2xl bg-ink/5 p-1">
                  {(["gas", "home"] as OvenType[]).map((option) => <button key={option} type="button" onClick={() => applyPreset(goal, option)} aria-pressed={ovenType === option} className={`rounded-xl px-2 text-left transition ${ovenType === option ? "bg-white text-ink shadow-sm" : "text-ink/45"}`}><span className="block text-xs font-extrabold">{option === "home" ? t.homeOven : t.gasOven}</span><span className="mt-0.5 block truncate text-[9px] font-semibold opacity-60">{option === "home" ? t.homeOvenNote : t.gasOvenNote}</span></button>)}
                </div>
              </fieldset>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-leaf/[.08] p-4 text-center sm:grid-cols-4">
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.ballWeight}</span><strong className="mt-1 block text-sm">{activePreset.ballWeight} g</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.flourStrength}</span><strong className="mt-1 block text-sm">{activePreset.flourW}</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.mediumSize}</span><strong className="mt-1 block text-sm">{activePreset.diameter}</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.fermentation}</span><strong className="mt-1 block text-sm">{t.ferment[fermentation][0]}</strong></div>
            </div>
            <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-4">
              <label htmlFor="flour-profile" className="block text-sm font-extrabold">{t.flourChoice}</label>
              <p className="mt-1 text-[11px] leading-4 text-ink/45">{t.flourIntro}</p>
              <select id="flour-profile" value={flourId} onChange={(event) => setFlourId(event.target.value as FlourId)} className="mt-3 h-12 w-full rounded-xl border border-ink/10 bg-cream px-3 text-sm font-bold outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10">
                {flourProfiles.map((flour) => <option key={flour.id} value={flour.id}>{flour.brand} {flour.name} · {flour.strength}</option>)}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-ink/[.04] p-2.5"><span className="block text-[9px] font-bold uppercase tracking-wide text-ink/40">{t.flourStrength}</span><strong className="mt-1 block text-xs">{activeFlour.strength}</strong></div>
                <div className="rounded-xl bg-ink/[.04] p-2.5"><span className="block text-[9px] font-bold uppercase tracking-wide text-ink/40">{t.protein}</span><strong className="mt-1 block text-xs">{activeFlour.protein}</strong></div>
                <div className="rounded-xl bg-ink/[.04] p-2.5"><span className="block text-[9px] font-bold uppercase tracking-wide text-ink/40">{t.suggestedHydration}</span><strong className="mt-1 block text-xs">{activeFlour.hydration[0]}–{activeFlour.hydration[1]} %</strong></div>
                <div className="rounded-xl bg-ink/[.04] p-2.5"><span className="block text-[9px] font-bold uppercase tracking-wide text-ink/40">{t.suggestedTime}</span><strong className="mt-1 block text-xs">{activeFlour.fermentationHours[0]}–{activeFlour.fermentationHours[1]} h</strong></div>
              </div>
              <p className="mt-3 text-[11px] text-ink/55"><strong>{t.bestFor}:</strong> {activeFlour.styles.map((style) => t.goals[style][0]).join(" · ")}</p>
              {activeFlour.approximate && <p className="mt-2 rounded-lg bg-tomato/[.07] px-2.5 py-2 text-[10px] leading-4 text-tomato">{t.estimatedData}</p>}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={applyFlourSuggestion} className="rounded-xl bg-leaf px-4 py-2.5 text-xs font-extrabold text-white transition active:scale-[.98]">{t.applyFlour}</button>
                <a href={activeFlour.source} target="_blank" rel="noreferrer" className="rounded-xl border border-ink/10 px-4 py-2.5 text-center text-xs font-bold text-ink/55">{t.makerInfo} ↗</a>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
              <div className="flex items-center justify-between gap-4"><strong className="text-sm">{t.bakeGuide}</strong><div className="flex gap-4 text-right"><span><small className="block text-[9px] font-bold uppercase tracking-wide text-white/40">{t.bakeTemperature}</small><b className="text-sm">{activeBake.temperature}°C</b></span><span><small className="block text-[9px] font-bold uppercase tracking-wide text-white/40">{t.bakeTime}</small><b className="text-sm">{activeBake.time}</b></span></div></div>
              <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-5 text-white/45">{ovenType === "home" ? t.homePreheat : t.gasPreheat}{goal === "pan" && ovenType === "gas" ? ` ${t.panGasNote}` : ""}</p>
            </div>
            <button type="button" onClick={() => setShowAdvanced((current) => !current)} aria-expanded={showAdvanced} className="mt-5 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink">{showAdvanced ? t.hideTune : t.tune} <span aria-hidden="true">{showAdvanced ? "↑" : "↓"}</span></button>

            {showAdvanced && <div className="mt-7 border-t border-ink/10 pt-7">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">2</span><h2 className="font-display text-2xl font-semibold">{t.build}</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField id="ball-weight" label={t.ballWeight} value={ballWeight} min={100} max={1000} step={5} suffix="g" stepper onChange={setBallWeight} />
              <NumberField id="hydration" label={t.hydration} value={hydration} min={40} max={100} step={0.5} suffix="%" stepper onChange={setHydration} />
              <NumberField id="salt" label={t.salt} value={salt} min={0} max={10} step={0.1} suffix="%" stepper onChange={setSalt} />
              <NumberField id="waste" label={t.waste} value={waste} min={0} max={25} step={0.5} suffix="%" stepper onChange={setWaste} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">{t.yeastType}</legend>
                <div className="grid h-14 grid-cols-5 rounded-2xl bg-ink/5 p-1">
                  {(["cy", "ady", "idy", "ssd", "lsd"] as YeastType[]).map((type) => <button key={type} type="button" title={t.yeasts[type][1]} aria-label={t.yeasts[type][1]} onClick={() => setYeastType(type)} className={`rounded-xl text-xs font-extrabold transition ${yeastType === type ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{t.yeasts[type][0]}</button>)}
                </div>
                <p className="mt-2 text-xs font-semibold text-ink/50">{t.yeasts[yeastType][1]}</p>
              </fieldset>
            </div>

            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-semibold text-ink/70">{t.fermentation}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {fermentationOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => { setFermentation(option.value); setTemperature(option.temperature); }} aria-pressed={fermentation === option.value}
                    className={`min-h-16 rounded-2xl border px-2 py-3 text-left transition sm:text-center ${fermentation === option.value ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white text-ink hover:border-ink/25"}`}>
                    <span className="block text-sm font-bold">{t.ferment[option.value][0]}</span><span className={`mt-1 block text-[10px] font-medium ${fermentation === option.value ? "text-white/70" : "text-ink/40"}`}>{t.ferment[option.value][1]}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 max-w-sm">
                {isColdFermentation ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-ink/70">{t.coldTemperature}</p>
                    <div className="flex h-14 items-center justify-between rounded-2xl border border-ink/10 bg-ink/[.035] px-4">
                      <span className="text-base font-semibold">4 °C</span>
                      <span className="text-xs font-semibold text-ink/40">{t.coldFixed}</span>
                    </div>
                  </div>
                ) : (
                  <NumberField id="temperature" label={t.temperature} value={temperature} min={15} max={30} step={1} suffix="°C" stepper onChange={setTemperature} />
                )}
              </div>
            </fieldset>
            </div>}
          </section>

          <aside className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card lg:sticky lg:top-7" aria-live="polite">
            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">{t.yourRecipe}</p><h2 className="mt-1 font-display text-3xl font-semibold">{t.ready}</h2></div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">{Math.round(recipe.total)} g {t.total}</span>
              </div>

              <div className="divide-y divide-white/10">
                {[{ name: t.flour, value: recipe.flour, color: "bg-[#e8c98a]", precise: false }, { name: t.water, value: recipe.water, color: "bg-[#80b4c3]", precise: false }, { name: t.salt, value: recipe.salt, color: "bg-white", precise: false }, { name: t.yeasts[yeastType][1], value: recipe.leavener, color: "bg-[#d67e65]", precise: true }].map((ingredient) => (
                  <div key={ingredient.name} className="flex items-center justify-between py-4 first:pt-1 last:pb-1">
                    <span className="flex items-center gap-3 text-sm font-semibold text-white/65"><span className={`h-2 w-2 rounded-full ${ingredient.color}`} />{ingredient.name}</span>
                    <span className="text-2xl font-extrabold tabular-nums">{grams(ingredient.value, locale, ingredient.precise)} <small className="text-sm font-semibold text-white/35">g</small></span>
                  </div>
                ))}
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl bg-cream text-ink">
                <div className="relative min-h-32 overflow-hidden p-4 pr-32">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">DoughTools</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-none">{t.goals[goal][0]}</h3>
                  <p className="mt-2 text-[11px] font-semibold text-ink/55">{pizzas} × {ballWeight} g · {hydration} % · {t.ferment[fermentation][0]}</p>
                  <div className="absolute -right-8 -top-9 h-40 w-40 rounded-full bg-tomato p-5 shadow-lg rotate-6" aria-hidden="true">
                    <div className="relative h-full w-full rounded-full border-[9px] border-[#d99b42] bg-[#efc46d]">
                      {[[22, 22], [63, 18], [40, 58], [72, 66]].map(([left, top], index) => <span key={index} className="absolute h-5 w-5 rounded-full bg-[#bf3826]" style={{ left, top }} />)}
                    </div>
                  </div>
                </div>
                <div className="border-t border-ink/10 p-4">
                  <h3 className="text-sm font-extrabold">{t.shareTitle}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-ink/50">{t.shareIntro}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={shareRecipe} className="rounded-xl bg-tomato px-3 py-3 text-xs font-extrabold text-white transition active:scale-[.98]">{t.shareRecipe}</button>
                    <button type="button" onClick={shareToWhatsApp} className="rounded-xl bg-[#25D366] px-3 py-3 text-xs font-extrabold text-white transition active:scale-[.98]">{t.shareWhatsApp}</button>
                    <button type="button" onClick={copyRecipeLink} className="col-span-2 rounded-xl border border-ink/15 bg-white px-3 py-3 text-xs font-extrabold text-ink transition active:scale-[.98]">{t.copyLink}</button>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-white/10 pt-5">
                {recipeNotice && <p className="mb-3 rounded-xl bg-leaf/30 px-3 py-2 text-xs font-bold text-white/80">{recipeNotice}</p>}
                {showSaveForm ? (
                  <div>
                    <label htmlFor="recipe-name" className="mb-2 block text-xs font-bold text-white/60">{t.recipeName}</label>
                    <input id="recipe-name" type="text" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveCurrentRecipe(); }} placeholder={t.recipeNamePlaceholder} autoFocus className="h-12 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:ring-4 focus:ring-tomato/25" />
                    <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setShowSaveForm(false); setRecipeName(""); }} className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-bold text-white/60">{t.cancel}</button><button type="button" onClick={saveCurrentRecipe} disabled={!recipeName.trim()} className="rounded-xl bg-tomato px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40">{t.save}</button></div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setShowSaveForm(true); setRecipeNotice(""); }} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-cream">{t.saveRecipe}</button>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.04] px-5 py-4 sm:px-7">
              <p className="flex items-start gap-2 text-xs leading-5 text-white/45"><svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.01"/></svg>{t.note}</p>
            </div>
          </aside>
        </div>

        <section id="instructions" className="mt-8 rounded-[1.75rem] bg-leaf p-5 text-white shadow-card sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/50">03 · DoughTools</p><h2 className="mt-2 font-display text-3xl font-semibold">{t.instructionsTitle}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">{t.instructionsIntro} {t.startClock}</p></div>
            <Link href={planHref} className="shrink-0 rounded-2xl bg-white px-5 py-4 text-center text-sm font-extrabold text-leaf shadow-lg transition active:scale-[.98]">{t.openPlan} →</Link>
          </div>
        </section>

        <section id="my-recipes" className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7">
          <div className="flex items-center justify-between gap-4"><h2 className="font-display text-3xl font-semibold">{t.myRecipes}</h2><span className="grid h-8 min-w-8 place-items-center rounded-full bg-ink px-2 text-xs font-extrabold text-white">{savedRecipes.length}</span></div>
          {savedRecipes.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-sm text-ink/45">{t.noRecipes}</p> : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {savedRecipes.map((savedRecipe) => (
                <article key={savedRecipe.id} className="rounded-2xl border border-ink/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">{savedRecipe.name}</h3><p className="mt-1 text-[10px] font-semibold text-ink/40">{t.savedOn} {new Intl.DateTimeFormat(locale === "fi" ? "fi-FI" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(savedRecipe.createdAt))}</p></div><span className="rounded-full bg-tomato/10 px-2.5 py-1 text-xs font-extrabold text-tomato">{Math.round(savedRecipe.ingredients.total)} g</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"><span className="text-ink/45">{t.pizzas}</span><strong className="text-right">{savedRecipe.settings.pizzas} × {savedRecipe.settings.ballWeight} g</strong><span className="text-ink/45">{t.hydration}</span><strong className="text-right">{savedRecipe.settings.hydration} %</strong><span className="text-ink/45">{t.fermentation}</span><strong className="text-right">{t.ferment[savedRecipe.settings.fermentation][0]}</strong><span className="text-ink/45">{t.flourChoice}</span><strong className="truncate text-right">{flourById(savedRecipe.settings.flourId ?? "caputo-pizzeria").brand} {flourById(savedRecipe.settings.flourId ?? "caputo-pizzeria").name}</strong><span className="text-ink/45">{t.yeastType}</span><strong className="truncate text-right">{t.yeasts[savedRecipe.settings.yeastType][1]}</strong></div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => openSavedRecipe(savedRecipe)} className="rounded-xl bg-ink px-3 py-2.5 text-xs font-bold text-white">{t.openRecipe}</button><button type="button" onClick={() => deleteSavedRecipe(savedRecipe.id)} className="rounded-xl border border-tomato/20 px-3 py-2.5 text-xs font-bold text-tomato">{t.deleteRecipe}</button></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <div className="flex flex-col gap-3 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between"><p>{t.footer}</p><Link href="/guide" className="font-bold text-tomato sm:hidden">{t.guide} →</Link><p>{t.bakers}</p></div>
          <div className="mt-4 border-t border-ink/5 pt-4"><AppSignature locale={locale} /></div>
        </footer>
      </div>
    </main>
  );
}

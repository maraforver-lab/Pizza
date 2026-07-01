"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppSignature from "@/components/AppSignature";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import EditableNumberInput from "@/components/EditableNumberInput";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import InstallAppPrompt from "@/components/InstallAppPrompt";
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
import {
  calculatorControlGroups,
  getCalculatorDisclosureMode,
  hasAdvancedCalculatorValues,
} from "@/lib/calculator-progressive-disclosure";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { buildPlanningResult } from "@/lib/planning-engine";
import type { PlanningInput } from "@/lib/planning-input";
import type { FermentationMode, PlanningMixingMethod } from "@/lib/planning-types";
import {
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { getHomepageExperienceCopy } from "@/lib/homepage-experience-copy";
import { createBakeResult, createBakingSnapshot, createRecipeSnapshot, createResultSnapshot } from "@/lib/bake-result";
import { homepageContent, type HomepageTool } from "@/lib/homepage";
import { addLocalBakeResult, BAKE_RESULTS_LOCAL_ONLY_COPY } from "@/lib/local-bake-results";
import { defaultPizzaStyleId, pizzaStyleById, type PizzaStyleId } from "@/lib/pizza-styles";
import { getRecipeWorkflowHandoff, recipeWorkflowQueryHref } from "@/lib/recipe-workflow";

type Locale = "en" | "fi" | "sv";

const fermentationOptions: { value: Fermentation; hours: number; temperature: number }[] = [
  { value: "6h-room", hours: 6, temperature: 22 },
  { value: "12h-room", hours: 12, temperature: 22 },
  { value: "24h-room", hours: 24, temperature: 22 },
  { value: "24h-cold", hours: 24, temperature: 4 },
  { value: "48h-cold", hours: 48, temperature: 4 },
];

const saveRecipeValueByLevel: Record<ExperienceLevel, string> = {
  beginner: "Beginner: save the recipe you used so you can make the same pizza again without remembering every number.",
  enthusiast: "Enthusiast: save repeatable setups so you can compare flour, hydration, fermentation and bake results over time.",
  pizza_nerd: "Pizza Nerd: preserve the variables for controlled testing, repeatability and later troubleshooting.",
};

const quickFermentationOptions: Fermentation[] = ["6h-room", "12h-room", "24h-room", "24h-cold", "48h-cold"];

const planningMixingMethods: { value: PlanningMixingMethod; label: string; description: string }[] = [
  { value: "hand_mixing", label: "Hand mixing", description: "Best for learning dough feel." },
  { value: "stand_mixer", label: "Stand mixer / kitchen machine", description: "Useful, but keep it gentle." },
  { value: "spiral_mixer", label: "Spiral mixer", description: "Repeatable for larger batches." },
];

type AdvancedDoughType = "neapolitan_direct" | "same_day_neapolitan" | "cold_neapolitan";

const advancedDoughTypes: { value: AdvancedDoughType; label: string; description: string; fermentation: Fermentation; goal: PizzaGoal }[] = [
  { value: "neapolitan_direct", label: "Neapolitan-style direct dough", description: "A simple direct dough with flour, water, salt and yeast.", fermentation: "12h-room", goal: "balanced" },
  { value: "same_day_neapolitan", label: "Same-day Neapolitan-style dough", description: "Useful when bake time is soon, with more timing compromise.", fermentation: "6h-room", goal: "balanced" },
  { value: "cold_neapolitan", label: "Cold fermented Neapolitan-style dough", description: "A longer, cooler plan for more flavor and timing flexibility.", fermentation: "24h-cold", goal: "airy" },
];

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultBakeDateValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatDateInputValue(date);
};

const bakeTargetDateTime = (dateValue: string, timeValue: string) => {
  const candidate = new Date(`${dateValue}T${timeValue || "18:00"}:00`);
  return Number.isFinite(candidate.getTime()) ? candidate : new Date(Date.now() + 24 * 3_600_000);
};

const flourSuitabilityNote = (flour: ReturnType<typeof flourById>) => {
  const summary = `${flour.brand} ${flour.name} · ${flour.type} · ${flour.strength}`;
  if (flour.hydration[1] >= 74) return `${summary}. Stronger flour is useful for longer fermentation or higher hydration, but can become chewy if pushed too hard.`;
  if (flour.fermentationHours[1] <= 12) return `${summary}. Good for shorter plans; use caution with very long fermentation or high hydration.`;
  if (flour.type.includes("00")) return `${summary}. Tipo 00 / pizza flour is a good fit for Neapolitan-style dough, especially with high heat.`;
  return `${summary}. Workable and forgiving; watch dough feel before chasing high hydration.`;
};

const optionalPlanningNumber = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const planningFermentationModeFromRecipe = (fermentation: Fermentation): FermentationMode => (
  fermentation.endsWith("cold") ? "cold" : "room"
);

const readablePlanningValue = (value: string | null | undefined) => (
  value ? value.replaceAll("_", " ") : "not selected"
);

const formatPlanningDateTime = (value: string | null, locale: Locale) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const planningInputFromCalculator = (input: {
  currentDateTime: Date;
  desiredBakeDateTime: Date;
  ovenType: OvenType;
  fermentation: Fermentation;
  experienceLevel: ExperienceLevel;
  flourId: FlourId;
  pizzas: number;
  ballWeight: number;
  hydration: number;
  salt: number;
  doughStyle: AdvancedDoughType;
  yeastType: YeastType;
  calculatedFlourGrams?: number;
  calculatedYeastGrams?: number;
  planningMixingMethod: PlanningMixingMethod;
  planningRoomTemperature: number;
  planningFridgeTemperature: number;
  proteinPercent?: number;
  wValue?: number;
  targetDoughTemperature?: number;
  mixerFrictionHeat?: number;
}): PlanningInput => {
  return {
    currentDateTime: input.currentDateTime,
    desiredBakeDateTime: input.desiredBakeDateTime,
    userLevel: input.experienceLevel,
    ovenType: input.ovenType === "gas" ? "pizza_oven" : "home_oven",
    roomTemperature: input.planningRoomTemperature,
    fridgeTemperature: input.planningFridgeTemperature,
    flourSelection: { type: "known_flour_id", flourId: input.flourId },
    doughBallCount: input.pizzas,
    doughBallWeight: input.ballWeight,
    hydration: input.hydration,
    salt: input.salt,
    doughStyle: input.doughStyle,
    selectedFermentationMode: planningFermentationModeFromRecipe(input.fermentation),
    mixingMethod: input.planningMixingMethod,
    yeastType: input.yeastType,
    calculatedFlourGrams: input.calculatedFlourGrams,
    calculatedYeastGrams: input.calculatedYeastGrams,
    proteinPercent: input.proteinPercent,
    wValue: input.wValue,
    targetDoughTemperature: input.targetDoughTemperature,
    mixerFrictionHeat: input.mixerFrictionHeat,
  };
};

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
    toolkit: "Baker's toolkit", guide: "Guide & glossary", calculator: "Calculator", planner: "Planner", doctor: "Dough Doctor", styles: "Pizza styles", journal: "Journal", eyebrow: "Dough recipe builder", title: "Build the dough recipe.",
    intro: "Choose a pizza style, oven and fermentation. DoughTools calculates the batch with baker's percentages.", build: "Fine-tune your batch",
    quickTitle: "What kind of pizza do you want?", quickIntro: "Choose the result, fermentation time and environment, and oven. The calculator builds a sensible medium-size starting recipe.", schedule: "Fermentation time and environment",
    oven: "Which oven do you use?", homeOven: "Electric oven", homeOvenNote: "Stone or steel", gasOven: "Gas pizza oven", gasOvenNote: "Ooni, Chef Matteo, etc.", bakeGuide: "Baking recommendation", bakeTemperature: "Temperature", bakeTime: "Baking time", homePreheat: "Preheat the stone or steel thoroughly, usually 45–60 minutes.", gasPreheat: "Heat the stone fully and adjust the flame while turning the pizza.", panGasNote: "For pan pizza, verify that the pan is rated for this temperature and gas flame.", recommendation: "Recommended setup", flourStrength: "Flour strength", mediumSize: "Medium size", tune: "Fine-tune recipe", hideTune: "Hide fine-tuning", flourChoice: "Choose your pizza flour", flourIntro: "The flour profile suggests a suitable hydration and fermentation range.", protein: "Protein", suggestedHydration: "Hydration", suggestedTime: "Fermentation", bestFor: "Best for", applyFlour: "Use flour suggestion", flourApplied: "Flour suggestion applied", estimatedData: "Approximate profile — check the current values printed on your bag.", makerInfo: "Manufacturer information",
    goals: { balanced: ["Balanced", "Soft with a crisp base"], airy: ["Very airy", "Open, light crust"], crispy: ["Thin & crispy", "Low, crunchy profile"], pan: ["Airy pan", "Soft, tall and fluffy"] },
    pizzas: "Number of pizzas", panPizzas: "Number of pan pizzas", panOvenLocked: "Pan pizza uses an electric oven. The gas-oven option is locked for a safe, predictable beginner setup.", ballWeight: "Dough ball weight", hydration: "Hydration", salt: "Salt", waste: "Extra for waste",
    yeastType: "Leavening type", fermentation: "Fermentation", temperature: "Room temperature", coldTemperature: "Refrigerator temperature", coldFixed: "Fixed by the cold-fermentation preset",
    yeasts: {
      cy: ["CY", "Compressed yeast"], ady: ["ADY", "Active dry yeast"], idy: ["IDY", "Instant dry yeast"],
      ssd: ["SSD", "Stiff sourdough (50%)"], lsd: ["LSD", "Liquid sourdough (100%)"],
    },
    ferment: {
      "6h-room": ["6 h at room temp", "About 22 °C"], "12h-room": ["12 h at room temp", "About 22 °C"], "24h-room": ["24 h at room temp", "About 22 °C"],
      "24h-cold": ["24 h in the fridge", "About 4 °C"], "48h-cold": ["48 h in the fridge", "About 4 °C"],
    },
    yourRecipe: "Your recipe", ready: "Ready to mix", total: "total", flour: "Flour", water: "Water",
    saveRecipe: "Save recipe", saveRecipeValueTitle: "Save the setup that worked", saveRecipeValueIntro: "A saved recipe keeps the exact calculator settings so you can repeat it, plan it again, troubleshoot it later or compare the next bake.", recipeName: "Recipe name", recipeNamePlaceholder: "Friday pizza", save: "Save", cancel: "Cancel", saved: "Recipe saved", myRecipes: "My recipes", noRecipes: "No saved recipes yet.", openRecipe: "Use again", deleteRecipe: "Delete", deleteConfirm: "Delete this saved recipe?", savedOn: "Saved", recipeOpened: "Recipe opened", savedRecipeLocal: "Saved locally in this browser. Use it again or send the same setup into another DoughTools step.", savedRecipeNextActions: "Next actions", savedRecipePlanner: "Planner", savedRecipeSauce: "Sauce", savedRecipeToppings: "Toppings", savedRecipeTimer: "Timer", savedRecipeDoctor: "Dough Doctor", savedRecipeJournal: "Journal note", saveBake: "Save this bake", bakeSaved: "Bake result saved locally", bakeRating: "Overall rating", bakeTimeSeconds: "Bake time", bakeOvenTemp: "Oven temperature", privateBakeNote: "Private note", privateBakePlaceholder: "What happened in the oven?", savedBakesLink: "View saved bakes", shareTitle: "Share your pizza", shareIntro: "Send a pizza card and recipe link to Instagram, WhatsApp or another app.", shareRecipe: "Share image", shareWhatsApp: "WhatsApp link", copyLink: "Copy recipe link", linkCopied: "Recipe link copied", shareText: "I’m making {style} pizza with DoughTools. Make your own pizza recipe:", shareFallback: "The recipe link was copied. You can paste it into Instagram or another app.",
    note: "Leavening is estimated from time and temperature. Flour strength, starter activity and actual dough temperature may require adjustment.",
    instructionsTitle: "Plan fermentation next", instructionsIntro: "Your dough numbers are ready. Open the planner for step-by-step instructions and exact clock times.", openPlan: "Open Fermentation Planner", startClock: "Start now or choose your desired baking time.",
    footer: "Made for better pizza nights.", bakers: "Baker's percentages are based on flour weight.", decrease: "Decrease number of pizzas", increase: "Increase number of pizzas",
  },
  fi: {
    toolkit: "Leipurin työkalut", guide: "Ohjeet ja terminologia", calculator: "Laskuri", planner: "Aikataulu", doctor: "Taikinalääkäri", styles: "Pizzatyylit", journal: "Päiväkirja", eyebrow: "Pizzataikinalaskuri", title: "Seuraava loistava pizzasi alkaa oikeista luvuista.",
    intro: "Valitse erän koko, tyyli ja kohotus. Me hoidamme leipurin laskut.", build: "Hienosäädä taikina",
    quickTitle: "Millaista pizzaa haluat?", quickIntro: "Valitse lopputulos, fermentaation kesto ja ympäristö sekä uuni. Laskuri rakentaa järkevän lähtöreseptin keskikokoiselle pizzalle.", schedule: "Fermentaation kesto ja ympäristö",
    oven: "Mitä uunia käytät?", homeOven: "Sähköuuni", homeOvenNote: "Kivi tai teräs", gasOven: "Kaasupizzauuni", gasOvenNote: "Ooni, Chef Matteo jne.", bakeGuide: "Paistosuositus", bakeTemperature: "Lämpötila", bakeTime: "Paistoaika", homePreheat: "Esilämmitä kiveä tai terästä kunnolla, yleensä 45–60 minuuttia.", gasPreheat: "Kuumenna kivi täysin ja säädä liekkiä pizzaa kääntäessäsi.", panGasNote: "Varmista pannupizzassa, että pannu kestää tämän lämpötilan ja kaasuliekin.", recommendation: "Suositeltu kokonaisuus", flourStrength: "Jauhon vahvuus", mediumSize: "Keskikoko", tune: "Hienosäädä reseptiä", hideTune: "Piilota hienosäätö", flourChoice: "Valitse pizzajauho", flourIntro: "Jauhoprofiili ehdottaa sille sopivaa hydraatiota ja kohotusaikaa.", protein: "Proteiini", suggestedHydration: "Hydraatio", suggestedTime: "Kohotus", bestFor: "Sopii parhaiten", applyFlour: "Käytä jauhosuositusta", flourApplied: "Jauhosuositus otettu käyttöön", estimatedData: "Arvioitu profiili – tarkista ajantasaiset arvot omasta jauhopussista.", makerInfo: "Valmistajan tiedot",
    goals: { balanced: ["Tasapainoinen", "Pehmeä ja rapeapohjainen"], airy: ["Erittäin ilmava", "Avoin ja kevyt reuna"], crispy: ["Ohut ja rapea", "Matala, rouskuva pohja"], pan: ["Ilmava pannupizza", "Pehmeä, korkea ja kuohkea"] },
    pizzas: "Pizzojen määrä", panPizzas: "Pannupizzojen määrä", panOvenLocked: "Pannupizza käyttää sähköuunia. Kaasupizzauuni on lukittu turvallisen ja ennustettavan aloittelija-asetuksen vuoksi.", ballWeight: "Taikinapallon paino", hydration: "Hydraatio", salt: "Suola", waste: "Hävikkivara",
    yeastType: "Kohotustapa", fermentation: "Kohotus", temperature: "Huonelämpötila", coldTemperature: "Jääkaapin lämpötila", coldFixed: "Kylmäkohotuksen vakioasetus",
    yeasts: {
      cy: ["CY", "Puristehiiva"], ady: ["ADY", "Aktiivikuivahiiva"], idy: ["IDY", "Pikakuivahiiva"],
      ssd: ["SSD", "Jäykkä juuri (50 %)"], lsd: ["LSD", "Nestemäinen juuri (100 %)"],
    },
    ferment: {
      "6h-room": ["6 h huoneessa", "Noin 22 °C"], "12h-room": ["12 h huoneessa", "Noin 22 °C"], "24h-room": ["24 h huoneessa", "Noin 22 °C"],
      "24h-cold": ["24 h jääkaapissa", "Noin 4 °C"], "48h-cold": ["48 h jääkaapissa", "Noin 4 °C"],
    },
    yourRecipe: "Reseptisi", ready: "Valmis sekoitettavaksi", total: "yhteensä", flour: "Jauhot", water: "Vesi",
    saveRecipe: "Tallenna resepti", recipeName: "Reseptin nimi", recipeNamePlaceholder: "Perjantain pizza", save: "Tallenna", cancel: "Peruuta", saved: "Resepti tallennettu", myRecipes: "Omat reseptit", noRecipes: "Ei vielä tallennettuja reseptejä.", openRecipe: "Avaa", deleteRecipe: "Poista", deleteConfirm: "Poistetaanko tämä tallennettu resepti?", savedOn: "Tallennettu", recipeOpened: "Resepti avattu", shareTitle: "Jaa pizzasi", shareIntro: "Lähetä pizzakortti ja reseptilinkki Instagramiin, WhatsAppiin tai muuhun sovellukseen.", shareRecipe: "Jaa kuva", shareWhatsApp: "WhatsApp-linkki", copyLink: "Kopioi reseptilinkki", linkCopied: "Reseptilinkki kopioitu", shareText: "Teen {style}-pizzaa DoughToolsilla. Tee oma pizzareseptisi:", shareFallback: "Reseptilinkki kopioitiin. Voit liittää sen Instagramiin tai muuhun sovellukseen.",
    note: "Kohotteen määrä arvioidaan ajan ja lämpötilan perusteella. Jauhon vahvuus, juuren aktiivisuus ja taikinan todellinen lämpötila voivat vaatia säätöä.",
    instructionsTitle: "Taikinasi valmistusohje", instructionsIntro: "Avaa kevyt suunnittelunäkymä, jossa ovat vaiheittaiset ohjeet ja tarkat kellonajat.", openPlan: "Avaa valmistusohje ja aikataulu", startClock: "Aloita nyt tai valitse haluamasi paistoaika.",
    footer: "Parempia pizzailtoja varten.", bakers: "Leipurin prosentit lasketaan jauhojen painosta.", decrease: "Vähennä pizzojen määrää", increase: "Lisää pizzojen määrää",
  },
  sv: {
    toolkit: "Bagarens verktyg", guide: "Guide och terminologi", calculator: "Kalkylator", planner: "Tidsplan", doctor: "Degläkaren", styles: "Pizzastilar", journal: "Dagbok", eyebrow: "Pizzadegskalkylator", title: "Din nästa fantastiska pizza börjar med rätt siffror.",
    intro: "Välj satsstorlek, stil och jäsning. Vi sköter bagarens matematik.", build: "Finjustera degen",
    quickTitle: "Vilken pizza vill du baka?", quickIntro: "Välj resultat, jästid och temperatur samt ugn. Kalkylatorn skapar ett vettigt startrecept för en mellanstor pizza.", schedule: "Jäsningstid och temperatur",
    oven: "Vilken ugn använder du?", homeOven: "Elektrisk ugn", homeOvenNote: "Sten eller stål", gasOven: "Gaseldad pizzaugn", gasOvenNote: "Ooni, Chef Matteo m.fl.", bakeGuide: "Bakrekommendation", bakeTemperature: "Temperatur", bakeTime: "Baktid", homePreheat: "Förvärm stenen eller stålet ordentligt, vanligtvis 45–60 minuter.", gasPreheat: "Värm stenen helt och justera lågan medan du roterar pizzan.", panGasNote: "Kontrollera att formen tål temperaturen och gaslågan.", recommendation: "Rekommenderad inställning", flourStrength: "Mjölets styrka", mediumSize: "Mellanstor", tune: "Finjustera receptet", hideTune: "Dölj finjustering", flourChoice: "Välj pizzamjöl", flourIntro: "Mjölprofilen föreslår lämplig hydrering och jästid.", protein: "Protein", suggestedHydration: "Hydrering", suggestedTime: "Jäsning", bestFor: "Passar bäst för", applyFlour: "Använd mjölförslaget", flourApplied: "Mjölförslaget har använts", estimatedData: "Ungefärlig profil – kontrollera aktuella värden på din mjölpåse.", makerInfo: "Tillverkarens information",
    goals: { balanced: ["Balanserad", "Mjuk med krispig botten"], airy: ["Mycket luftig", "Öppen och lätt kant"], crispy: ["Tunn och krispig", "Låg och knaprig botten"], pan: ["Luftig pannpizza", "Mjuk, hög och fluffig"] },
    pizzas: "Antal pizzor", panPizzas: "Antal pannpizzor", panOvenLocked: "Pannpizza bakas i elektrisk ugn. Gasugnen är låst för en säker och förutsägbar nybörjarinställning.", ballWeight: "Degbollens vikt", hydration: "Hydrering", salt: "Salt", waste: "Reserv för svinn",
    yeastType: "Jästyp", fermentation: "Jäsning", temperature: "Rumstemperatur", coldTemperature: "Kylskåpstemperatur", coldFixed: "Fast inställning för kalljäsning",
    yeasts: { cy: ["CY", "Färsk jäst"], ady: ["ADY", "Aktiv torrjäst"], idy: ["IDY", "Snabbtorrjäst"], ssd: ["SSD", "Fast surdeg (50 %)"], lsd: ["LSD", "Flytande surdeg (100 %)"] },
    ferment: { "6h-room": ["6 h · rum", "Cirka 22 °C"], "12h-room": ["12 h · rum", "Cirka 22 °C"], "24h-room": ["24 h · rum", "Cirka 22 °C"], "24h-cold": ["24 h · kyl", "Cirka 4 °C"], "48h-cold": ["48 h · kyl", "Cirka 4 °C"] },
    yourRecipe: "Ditt recept", ready: "Redo att blandas", total: "totalt", flour: "Mjöl", water: "Vatten",
    saveRecipe: "Spara recept", recipeName: "Receptets namn", recipeNamePlaceholder: "Fredagspizza", save: "Spara", cancel: "Avbryt", saved: "Receptet sparades", myRecipes: "Mina recept", noRecipes: "Inga sparade recept ännu.", openRecipe: "Öppna", deleteRecipe: "Radera", deleteConfirm: "Radera det sparade receptet?", savedOn: "Sparat", recipeOpened: "Receptet öppnades", shareTitle: "Dela din pizza", shareIntro: "Skicka ett pizzakort och receptlänk till Instagram, WhatsApp eller en annan app.", shareRecipe: "Dela bild", shareWhatsApp: "WhatsApp-länk", copyLink: "Kopiera receptlänk", linkCopied: "Receptlänken kopierades", shareText: "Jag bakar {style}-pizza med DoughTools. Skapa ditt eget pizzarecept:", shareFallback: "Receptlänken kopierades. Klistra in den i Instagram eller en annan app.",
    note: "Mängden jäsmedel uppskattas från tid och temperatur. Mjölets styrka, surdegens aktivitet och degens verkliga temperatur kan kräva justering.",
    instructionsTitle: "Din degplan", instructionsIntro: "Öppna den tydliga planeringsvyn med stegvisa instruktioner och exakta klockslag.", openPlan: "Öppna instruktioner och tidsplan", startClock: "Börja nu eller välj önskad baktid.",
    footer: "För bättre pizzakvällar.", bakers: "Bagarprocent beräknas utifrån mjölets vikt.", decrease: "Minska antalet pizzor", increase: "Öka antalet pizzor",
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value || 0));
const steppedValue = (value: number, direction: -1 | 1, step: number, min: number, max: number) => {
  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return clamp(Number((value + direction * step).toFixed(decimals)), min, max);
};
const grams = (value: number, locale: Locale, precise = false) => new Intl.NumberFormat(locale === "fi" ? "fi-FI" : locale === "sv" ? "sv-SE" : "en-US", {
  maximumFractionDigits: precise ? (value < 10 ? 2 : 1) : (value < 10 ? 1 : 0),
}).format(value);

const percentValue = (value: number | null | undefined, locale: Locale) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "not available";
  return `${new Intl.NumberFormat(locale === "fi" ? "fi-FI" : locale === "sv" ? "sv-SE" : "en-US", {
    maximumFractionDigits: value < 0.1 ? 4 : 2,
  }).format(value)}%`;
};

const normalizeRiskLabel = (value: string | null | undefined) => readablePlanningValue(value);

const riskTone = (value: string | null | undefined) => {
  const normalized = value ?? "";
  if (normalized === "high_risk" || normalized === "not_recommended") return "high";
  if (normalized === "caution") return "caution";
  if (normalized === "not_enough_information") return "info";
  if (normalized === "low" || normalized === "good_fit" || normalized === "workable" || normalized === "reasonable") return "low";
  return "neutral";
};

const riskBadgeClasses = (value: string | null | undefined) => {
  switch (riskTone(value)) {
    case "high":
      return "border-tomato/25 bg-tomato/[.12] text-tomato";
    case "caution":
      return "border-[#e8a11f]/30 bg-[#fff5dd] text-[#9b5b00]";
    case "info":
      return "border-ink/10 bg-ink/[.05] text-ink/55";
    case "low":
      return "border-leaf/20 bg-leaf/[.10] text-leaf";
    default:
      return "border-ink/10 bg-white text-ink/55";
  }
};

const guidanceCardClasses = (value: string | null | undefined) => {
  switch (riskTone(value)) {
    case "high":
      return "border-tomato/25 bg-tomato/[.06]";
    case "caution":
      return "border-[#e8a11f]/25 bg-[#fff8e8]";
    case "info":
      return "border-ink/10 bg-ink/[.04]";
    case "low":
      return "border-leaf/20 bg-leaf/[.07]";
    default:
      return "border-white/80 bg-white/75";
  }
};

function RiskBadge({ value, label = "Risk" }: { value: string | null | undefined; label?: string }) {
  const tone = riskTone(value);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] ${riskBadgeClasses(value)}`}>
      <span aria-hidden="true">{tone === "high" ? "!" : tone === "caution" ? "•" : tone === "info" ? "i" : "✓"}</span>
      {label}: {normalizeRiskLabel(value)}
    </span>
  );
}

function PlanningMetric({ label, value, risk }: { label: string; value: string; risk?: string | null }) {
  return (
    <div className={`rounded-2xl border p-4 ${guidanceCardClasses(risk)}`}>
      <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">{label}</span>
      <strong className="mt-2 block text-sm text-ink">{value}</strong>
    </div>
  );
}

const loadCardImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new window.Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Pizza image could not be loaded"));
  image.src = source;
});

const drawCoverImage = (context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
};

const shareCardFile = async (title: string, subtitle: string, details: string[], imageSource: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#f6f3ea";
  context.fillRect(0, 0, 1080, 1080);
  const pizzaImage = await loadCardImage(imageSource);
  drawCoverImage(context, pizzaImage, 0, 0, 470, 975);
  const shade = context.createLinearGradient(0, 0, 470, 0);
  shade.addColorStop(0, "rgba(24,34,27,.04)");
  shade.addColorStop(1, "rgba(24,34,27,.28)");
  context.fillStyle = shade;
  context.fillRect(0, 0, 470, 975);
  context.fillStyle = "#18221b";
  context.font = "800 39px Arial, sans-serif";
  context.fillText("Dough", 530, 105);
  context.fillStyle = "#e34a2c";
  context.fillText("Tools", 658, 105);
  context.fillStyle = "#18221b";
  context.font = "700 69px Georgia, serif";
  context.fillText(title, 530, 430);
  context.fillStyle = "rgba(24,34,27,.62)";
  context.font = "500 30px Arial, sans-serif";
  context.fillText(subtitle, 530, 485);
  details.forEach((line, index) => {
    context.fillStyle = index === 0 ? "#e34a2c" : "#18221b";
    context.font = `${index === 0 ? "800" : "700"} 29px Arial, sans-serif`;
    context.fillText(line, 530, 620 + index * 58);
  });
  context.fillStyle = "#18221b";
  context.fillRect(0, 975, 1080, 105);
  context.fillStyle = "#fff";
  context.font = "600 30px Arial, sans-serif";
  context.fillText("doughtools — make your own pizza recipe", 72, 1040);

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
        {stepper && <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(steppedValue(value, -1, step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:scale-95 disabled:opacity-30">−</button>}
        <div className="relative min-w-0">
          <EditableNumberInput id={id} min={min} max={max} value={value} onValueChange={onChange}
            className={`h-14 min-w-0 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 ${stepper ? "text-center" : "pr-12"}`} />
          {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/40">{suffix}</span>}
        </div>
        {stepper && <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(steppedValue(value, 1, step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:scale-95 disabled:opacity-30">+</button>}
      </div>
    </div>
  );
}

function AdvancedCalculatorTopSummary({
  doughTypeLabel,
  bakeDate,
  bakeTime,
  planningResult,
  locale,
}: {
  doughTypeLabel: string;
  bakeDate: string;
  bakeTime: string;
  planningResult: ReturnType<typeof buildPlanningResult>;
  locale: Locale;
}) {
  const combinedRisk = planningResult.combinedRiskSummary;
  const bakeTargetIso = bakeTargetDateTime(bakeDate, bakeTime).toISOString();

  return (
    <section className={`mb-5 rounded-[1.75rem] border p-4 shadow-card backdrop-blur sm:p-5 ${guidanceCardClasses(combinedRisk?.overallRiskLevel)}`} aria-labelledby="calculator-top-summary">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Top summary bar</p>
          <h1 id="calculator-top-summary" className="mt-1 font-display text-3xl font-semibold">Calculator v1</h1>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[44rem] lg:grid-cols-4">
          <div className="rounded-2xl bg-white/80 p-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Pizza style</span>
            <strong className="mt-1 block text-ink">{doughTypeLabel}</strong>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Bake target</span>
            <strong className="mt-1 block text-ink">{formatPlanningDateTime(bakeTargetIso, locale)}</strong>
            <span className="mt-1 block text-xs text-ink/45">{planningResult.availableFermentationHours} h available</span>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <RiskBadge value={combinedRisk?.overallRiskLevel} label="Overall risk" />
          </div>
          <div className="rounded-2xl bg-leaf/[.08] p-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">What to adjust first</span>
            <strong className="mt-1 block text-sm leading-5 text-ink">{combinedRisk?.suggestedFirstAdjustment ?? "No immediate adjustment needed."}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdvancedCalculatorStandaloneControls({
  bakeDate,
  onBakeDateChange,
  bakeTime,
  onBakeTimeChange,
  doughType,
  onDoughTypeChange,
  pizzas,
  onPizzasChange,
  ballWeight,
  onBallWeightChange,
  goal,
  onGoalChange,
  ovenType,
  onOvenTypeChange,
  fermentation,
  onFermentationChange,
  mixingMethod,
  onMixingMethodChange,
  yeastType,
  onYeastTypeChange,
  flourId,
  onFlourIdChange,
  hydration,
  onHydrationChange,
  salt,
  onSaltChange,
  roomTemperature,
  onRoomTemperatureChange,
  fridgeTemperature,
  onFridgeTemperatureChange,
  targetDoughTemperature,
  onTargetDoughTemperatureChange,
  mixerFrictionHeat,
  onMixerFrictionHeatChange,
  proteinPercent,
  onProteinPercentChange,
  wValue,
  onWValueChange,
  activeFlour,
  totalDough,
  locale,
  t,
}: {
  bakeDate: string;
  onBakeDateChange: (value: string) => void;
  bakeTime: string;
  onBakeTimeChange: (value: string) => void;
  doughType: AdvancedDoughType;
  onDoughTypeChange: (type: AdvancedDoughType) => void;
  pizzas: number;
  onPizzasChange: (value: number) => void;
  ballWeight: number;
  onBallWeightChange: (value: number) => void;
  goal: PizzaGoal;
  onGoalChange: (goal: PizzaGoal) => void;
  ovenType: OvenType;
  onOvenTypeChange: (ovenType: OvenType) => void;
  fermentation: Fermentation;
  onFermentationChange: (fermentation: Fermentation) => void;
  mixingMethod: PlanningMixingMethod;
  onMixingMethodChange: (method: PlanningMixingMethod) => void;
  yeastType: YeastType;
  onYeastTypeChange: (yeastType: YeastType) => void;
  flourId: FlourId;
  onFlourIdChange: (flourId: FlourId) => void;
  hydration: number;
  onHydrationChange: (value: number) => void;
  salt: number;
  onSaltChange: (value: number) => void;
  roomTemperature: number;
  onRoomTemperatureChange: (value: number) => void;
  fridgeTemperature: number;
  onFridgeTemperatureChange: (value: number) => void;
  targetDoughTemperature: string;
  onTargetDoughTemperatureChange: (value: string) => void;
  mixerFrictionHeat: string;
  onMixerFrictionHeatChange: (value: string) => void;
  proteinPercent: string;
  onProteinPercentChange: (value: string) => void;
  wValue: string;
  onWValueChange: (value: string) => void;
  activeFlour: ReturnType<typeof flourById>;
  totalDough: number;
  locale: Locale;
  t: typeof copy.en;
}) {
  const selectedDoughType = advancedDoughTypes.find((type) => type.value === doughType) ?? advancedDoughTypes[0];
  const availableHours = Math.max(0, (bakeTargetDateTime(bakeDate, bakeTime).getTime() - Date.now()) / 3_600_000);

  return (
    <div className="grid gap-5" aria-labelledby="advanced-calculator-title">
      <section className="rounded-[1.75rem] border border-ink/10 bg-ink p-5 text-white shadow-card sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">Bake target</p>
            <h1 id="advanced-calculator-title" className="mt-2 font-display text-4xl font-semibold leading-tight">Calculator v1</h1>
          </div>
          <span className="w-fit rounded-full bg-white/[.08] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-white/60">Full-control lab</span>
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">When do you want to bake pizza?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
          Set the bake target first, then tune the variables that affect dough strength, timing risk and ingredient amounts.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Bake date</span>
            <input
              type="date"
              value={bakeDate}
              onChange={(event) => onBakeDateChange(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white px-4 text-base font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/25"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Bake time</span>
            <input
              type="time"
              value={bakeTime}
              onChange={(event) => onBakeTimeChange(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white px-4 text-base font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/25"
            />
          </label>
          <div className="rounded-2xl bg-white/[.08] px-4 py-3">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">Available time</span>
            <strong className="mt-1 block text-lg tabular-nums text-white">{new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(availableHours)} h</strong>
          </div>
        </div>
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.06] p-3 text-xs leading-5 text-white/65">
          Recommendations use your actual time until bake. Presets are only shortcuts — 8h, 10h, 26h or 41h plans are valid too.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="standalone-pizza-style">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Essential setup</p>
          <h2 id="standalone-pizza-style" className="mt-2 font-display text-2xl font-semibold">Choose the dough direction</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">Start with the broad pizza style so the calculator can explain timing, flour and oven fit in plain language.</p>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-ink/70">Dough type / style</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {advancedDoughTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={doughType === type.value}
                onClick={() => onDoughTypeChange(type.value)}
                className={`rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${doughType === type.value ? "border-tomato bg-tomato/[.08]" : "border-ink/10 bg-white hover:border-ink/25"}`}
              >
                <span className="block text-sm font-extrabold text-ink">{type.label}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/50">{type.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-2xl bg-leaf/[.08] p-3 text-xs leading-5 text-ink/55">
            Current direction: <strong className="text-ink">{selectedDoughType.label}</strong>. This is a broad v1 planning concept, not a new formula engine.
          </p>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-ink/70">Dough style target</legend>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {(["balanced", "airy", "crispy", "pan"] as PizzaGoal[]).map((option) => (
              <button key={option} type="button" onClick={() => onGoalChange(option)} aria-pressed={goal === option} className={`rounded-2xl border p-3 text-left transition ${goal === option ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white hover:border-ink/25"}`}>
                <span className="block text-sm font-extrabold">{t.goals[option][0]}</span>
                <span className={`mt-1 block text-[11px] leading-4 ${goal === option ? "text-white/70" : "text-ink/45"}`}>{t.goals[option][1]}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="standalone-pizza-amount">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Pizza amount</p>
          <h2 id="standalone-pizza-amount" className="mt-2 font-display text-2xl font-semibold">Set the batch size</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">Choose how many dough balls you need and the weight of each ball. Total dough updates from the existing calculator formula.</p>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <NumberField id="standalone-pizzas" label="Dough balls / pizzas" value={pizzas} min={1} max={50} stepper onChange={onPizzasChange} />
          <NumberField id="standalone-ball-weight" label="Dough ball weight" value={ballWeight} min={100} max={1000} step={5} suffix="g" stepper onChange={onBallWeightChange} />
          <div className="rounded-2xl border border-ink/10 bg-ink/[.035] p-4">
            <span className="block text-sm font-semibold text-ink/70">Total dough</span>
            <strong className="mt-2 block text-3xl font-extrabold tabular-nums text-ink">
              {grams(totalDough, locale, false)} <span className="text-base text-ink/40">g</span>
            </strong>
            <span className="mt-1 block text-xs leading-5 text-ink/45">Calculated from dough balls, ball weight and waste.</span>
          </div>
        </div>

        <div className="mt-6 border-t border-ink/10 pt-6" aria-labelledby="standalone-dough-formula">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Formula tuning</p>
            <h3 id="standalone-dough-formula" className="mt-2 font-display text-2xl font-semibold">Dough formula</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">These visible defaults drive ingredient amounts. Planning guidance reads them, but does not rewrite the formula.</p>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <NumberField id="standalone-hydration" label="Hydration" value={hydration} min={40} max={100} step={0.5} suffix="%" stepper onChange={onHydrationChange} />
            <NumberField id="standalone-salt" label="Salt %" value={salt} min={0} max={10} step={0.1} suffix="%" stepper onChange={onSaltChange} />
          </div>
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold text-ink/70">Yeast type</legend>
            <div className="grid h-14 grid-cols-5 rounded-2xl bg-ink/5 p-1">
              {(["cy", "ady", "idy", "ssd", "lsd"] as YeastType[]).map((type) => (
                <button key={type} type="button" title={t.yeasts[type][1]} aria-label={t.yeasts[type][1]} aria-pressed={yeastType === type} onClick={() => onYeastTypeChange(type)}
                  className={`rounded-xl text-xs font-extrabold transition ${yeastType === type ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{t.yeasts[type][0]}</button>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/50">{t.yeasts[yeastType][1]}</p>
          </fieldset>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="standalone-dough-setup">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Dough plan parameters</p>
          <h2 id="standalone-dough-setup" className="mt-2 font-display text-2xl font-semibold">Define the planning context</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Flour type stays here as a main planning variable. These values explain timing, risk and fit without changing the calculator math.
          </p>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Flour type / suitability</span>
            <select value={flourId} onChange={(event) => onFlourIdChange(event.target.value as FlourId)} className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10">
              {flourProfiles.map((flour) => <option key={flour.id} value={flour.id}>{flour.brand} {flour.name} · {flour.type} · {flour.strength}</option>)}
            </select>
            <span className="mt-2 block rounded-2xl bg-ink/[.04] p-3 text-xs leading-5 text-ink/55">{flourSuitabilityNote(activeFlour)}</span>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink/70">Oven type</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["gas", "home"] as OvenType[]).map((option) => (
                <button key={option} type="button" onClick={() => onOvenTypeChange(option)} aria-pressed={ovenType === option} className={`rounded-2xl border p-3 text-left transition ${ovenType === option ? "border-leaf bg-leaf/[.09]" : "border-ink/10 bg-white hover:border-ink/25"}`}>
                  <span className="block text-sm font-extrabold">{option === "home" ? "Home oven" : "Pizza oven"}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/50">{option === "home" ? "Stone, steel or tray." : "High-heat oven such as Ooni or Gozney."}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink/70">Fermentation mode</legend>
            <p className="mb-3 text-xs leading-5 text-ink/50">These modes are planning shortcuts and reference ranges. The recommendation still adapts to the real available time from your bake date and time.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fermentationOptions.map((option) => (
                <button key={option.value} type="button" onClick={() => onFermentationChange(option.value)} aria-pressed={fermentation === option.value}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${fermentation === option.value ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white text-ink hover:border-ink/25"}`}>
                  <span className="block text-sm font-bold">{t.ferment[option.value][0]}</span>
                  <span className={`mt-1 block text-[10px] font-medium ${fermentation === option.value ? "text-white/70" : "text-ink/40"}`}>{t.ferment[option.value][1]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink/70">Mixing method</legend>
            <div className="grid gap-2">
              {planningMixingMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  aria-pressed={mixingMethod === method.value}
                  onClick={() => onMixingMethodChange(method.value)}
                  className={`rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${mixingMethod === method.value ? "border-leaf bg-leaf/[.09]" : "border-ink/10 bg-white hover:border-ink/25"}`}
                >
                  <span className="block text-sm font-extrabold text-ink">{method.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/50">{method.description}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <NumberField id="planning-room-temperature" label="Room temperature" value={roomTemperature} min={10} max={35} step={1} suffix="°C" stepper onChange={onRoomTemperatureChange} />
          <NumberField id="planning-fridge-temperature" label="Fridge temperature" value={fridgeTemperature} min={0} max={12} step={1} suffix="°C" stepper onChange={onFridgeTemperatureChange} />
        </div>
      </section>

      <details className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="standalone-optional-variables">
        <summary className="cursor-pointer list-none">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Advanced optional variables</p>
          <h2 id="standalone-optional-variables" className="mt-2 font-display text-2xl font-semibold">Optional technical assumptions</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Target dough temperature, mixer friction heat, Protein % and W-value stay available here as secondary context.
          </p>
          <span className="mt-3 inline-flex rounded-full bg-ink/[.06] px-3 py-1.5 text-xs font-extrabold text-ink/55">Show optional fields ↓</span>
        </summary>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Target dough temperature <span className="text-ink/35">(optional)</span></span>
            <input
              id="planning-target-dough-temperature"
              inputMode="decimal"
              value={targetDoughTemperature}
              onChange={(event) => onTargetDoughTemperatureChange(event.target.value)}
              placeholder="e.g. 24"
              className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Mixer friction heat <span className="text-ink/35">(optional)</span></span>
            <input
              id="planning-mixer-friction-heat"
              inputMode="decimal"
              value={mixerFrictionHeat}
              onChange={(event) => onMixerFrictionHeatChange(event.target.value)}
              placeholder="e.g. 2"
              className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Protein % <span className="text-ink/35">(optional)</span></span>
            <input
              id="planning-protein-percent"
              inputMode="decimal"
              value={proteinPercent}
              onChange={(event) => onProteinPercentChange(event.target.value)}
              placeholder="e.g. 12.5"
              className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink/70">W-value <span className="text-ink/35">(optional)</span></span>
            <input
              id="planning-w-value"
              inputMode="numeric"
              value={wValue}
              onChange={(event) => onWValueChange(event.target.value)}
              placeholder="e.g. 280"
              className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
            />
          </label>
        </div>
        <p className="mt-4 rounded-2xl bg-ink/[.04] p-3 text-xs leading-5 text-ink/55">
          These values are optional and do not change the ingredient formula in v1. Protein % and W-value are treated as user-defined context for future advanced guidance. DoughTools does not pretend exact flour behavior from these values yet.
        </p>
      </details>
    </div>
  );
}

function AdvancedCalculatorPlanningShell({
  recipe,
  planningResult,
  yeastLabel,
  locale,
}: {
  recipe: ReturnType<typeof calculateDoughIngredients>;
  planningResult: ReturnType<typeof buildPlanningResult>;
  yeastLabel: string;
  locale: Locale;
}) {
  const warnings = planningResult.warnings;
  const mixing = planningResult.mixingGuidance;
  const timeline = planningResult.fermentationTimeline;
  const fermentationSetup = planningResult.fermentationSetupRecommendation;
  const startWindow = planningResult.startWindowRecommendation;
  const combinedRisk = planningResult.combinedRiskSummary;
  const doughTypeGuidance = planningResult.doughTypeGuidance;
  const formulaFitGuidance = planningResult.formulaFitGuidance;
  const flourGuidance = planningResult.flourGuidance;
  const yeastGuidance = planningResult.yeastGuidance;
  const temperature = planningResult.temperatureGuidance;

  return (
    <section className="grid gap-4" aria-labelledby="advanced-calculator-planning">
      <div className="rounded-[1.75rem] border border-ink/10 bg-ink p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">Planning Engine v1</p>
        <h2 id="advanced-calculator-planning" className="mt-2 font-display text-3xl font-semibold">Results and recommendations</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
          Ingredient amounts, the main risk and the next adjustment stay upfront. Secondary guidance is available below without turning this into a full workflow.
        </p>
      </div>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="advanced-ingredient-amounts">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Current calculator output</p>
        <h3 id="advanced-ingredient-amounts" className="mt-2 font-display text-2xl font-semibold">Ingredient amounts</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { name: "Total dough", value: recipe.total, precise: false },
            { name: "Flour", value: recipe.flour, precise: false },
            { name: "Water", value: recipe.water, precise: false },
            { name: "Salt", value: recipe.salt, precise: false },
            { name: yeastLabel, value: recipe.leavener, precise: true },
          ].map((ingredient) => (
            <div key={ingredient.name} className="rounded-2xl border border-ink/10 bg-white p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">{ingredient.name}</span>
              <strong className="mt-2 block text-2xl font-extrabold tabular-nums text-ink">
                {grams(ingredient.value, locale, ingredient.precise)} <span className="text-sm text-ink/40">g</span>
              </strong>
            </div>
          ))}
        </div>
      </section>

      {combinedRisk && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(combinedRisk.overallRiskLevel)}`} aria-labelledby="advanced-combined-risk">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Plan risk summary</p>
              <h3 id="advanced-combined-risk" className="mt-2 font-display text-2xl font-semibold">What to adjust first</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{combinedRisk.summary}</p>
            </div>
            <RiskBadge value={combinedRisk.overallRiskLevel} label="Overall risk" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Main reason</span>
              <p className="mt-2 text-sm leading-6 text-ink/60">{combinedRisk.primaryRiskReason}</p>
            </div>
            <div className="rounded-2xl bg-leaf/[.08] p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested first adjustment</span>
              <p className="mt-2 text-sm leading-6 text-ink/60">{combinedRisk.suggestedFirstAdjustment ?? "No immediate adjustment needed."}</p>
            </div>
          </div>
          {combinedRisk.secondaryRiskReasons.length > 0 && (
            <div className="mt-4 rounded-2xl bg-tomato/[.06] p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Other signals</span>
              <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                {combinedRisk.secondaryRiskReasons.slice(0, 3).map((reason) => <li key={reason}>• {reason}</li>)}
              </ul>
            </div>
          )}
          {combinedRisk.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{combinedRisk.technicalNote}</p>}
        </section>
      )}

      {formulaFitGuidance && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(formulaFitGuidance.overallFit)}`} aria-labelledby="advanced-formula-fit">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Dough formula fit</p>
              <h3 id="advanced-formula-fit" className="mt-2 font-display text-2xl font-semibold">Hydration, salt &amp; oven fit</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{formulaFitGuidance.summary}</p>
            </div>
            <RiskBadge value={formulaFitGuidance.overallFit} label="Overall formula fit" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Hydration fit" value={readablePlanningValue(formulaFitGuidance.hydrationFit)} risk={formulaFitGuidance.hydrationFit} />
            <PlanningMetric label="Salt fit" value={readablePlanningValue(formulaFitGuidance.saltFit)} risk={formulaFitGuidance.saltFit} />
            <PlanningMetric label="Oven fit" value={readablePlanningValue(formulaFitGuidance.ovenFit)} risk={formulaFitGuidance.ovenFit} />
          </div>
          {(formulaFitGuidance.cautions.length > 0 || formulaFitGuidance.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {formulaFitGuidance.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {formulaFitGuidance.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{formulaFitGuidance.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {formulaFitGuidance.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{formulaFitGuidance.technicalNote}</p>}
        </section>
      )}

      {startWindow && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(startWindow.riskLevel)}`} aria-labelledby="advanced-start-window">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Start window</p>
              <h3 id="advanced-start-window" className="mt-2 font-display text-2xl font-semibold">When to start</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{startWindow.summary}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] px-4 py-3 text-left sm:min-w-48">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Bake target</span>
              <strong className="mt-1 block text-xl text-ink">{formatPlanningDateTime(startWindow.desiredBakeDateTimeIso, locale)}</strong>
              <span className="mt-1 block text-xs text-ink/45">{startWindow.availableFermentationHours} h available</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Recommended window" value={startWindow.startWindowLabel} risk={startWindow.riskLevel} />
            <PlanningMetric label="Window fit" value={readablePlanningValue(startWindow.fitLevel)} risk={startWindow.fitLevel} />
            <PlanningMetric label="Window risk" value={readablePlanningValue(startWindow.riskLevel)} risk={startWindow.riskLevel} />
          </div>
          <div className="mt-4 rounded-2xl bg-ink/[.04] p-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Broad start range</span>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              {formatPlanningDateTime(startWindow.earliestRecommendedStartIso, locale)} – {formatPlanningDateTime(startWindow.latestRecommendedStartIso, locale)}
            </p>
            <p className="mt-1 text-xs leading-5 text-ink/45">{startWindow.relativeStartRecommendation}</p>
          </div>
          {(startWindow.cautions.length > 0 || startWindow.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {startWindow.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {startWindow.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{startWindow.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {startWindow.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{startWindow.technicalNote}</p>}
        </section>
      )}

      {fermentationSetup && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(fermentationSetup.riskLevel)}`} aria-labelledby="advanced-fermentation-setup">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Fermentation setup</p>
              <h3 id="advanced-fermentation-setup" className="mt-2 font-display text-2xl font-semibold">Recommended setup</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{fermentationSetup.summary}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] px-4 py-3 text-left sm:min-w-48">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Available time until bake</span>
              <strong className="mt-1 block text-xl tabular-nums text-ink">{fermentationSetup.availableTimeHours} h</strong>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Recommended setup" value={readablePlanningValue(fermentationSetup.recommendedSetup)} risk={fermentationSetup.riskLevel} />
            <PlanningMetric label="Selected setup fit" value={readablePlanningValue(fermentationSetup.fitLevel)} risk={fermentationSetup.fitLevel} />
            <PlanningMetric label="Risk level" value={readablePlanningValue(fermentationSetup.riskLevel)} risk={fermentationSetup.riskLevel} />
          </div>
          {(fermentationSetup.cautions.length > 0 || fermentationSetup.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {fermentationSetup.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {fermentationSetup.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{fermentationSetup.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {fermentationSetup.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{fermentationSetup.technicalNote}</p>}
        </section>
      )}

      <details className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6">
        <summary className="cursor-pointer list-none">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Details / guidance</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Open advanced guidance cards</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">Yeast, flour, dough style, temperature, formula fit, mixing and planning summary stay available here as supporting context.</p>
          <span className="mt-3 inline-flex rounded-full bg-ink/[.06] px-3 py-1.5 text-xs font-extrabold text-ink/55">Show guidance ↓</span>
        </summary>
        <div className="mt-5 grid gap-4">

      {doughTypeGuidance && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(doughTypeGuidance.riskLevel)}`} aria-labelledby="advanced-dough-type-guidance">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Dough style guidance</p>
              <h3 id="advanced-dough-type-guidance" className="mt-2 font-display text-2xl font-semibold">{doughTypeGuidance.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{doughTypeGuidance.summary}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] px-4 py-3 text-left sm:min-w-48">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Selected dough type</span>
              <strong className="mt-1 block text-xl text-ink">{doughTypeGuidance.doughTypeLabel}</strong>
              <span className="mt-1 block text-xs text-ink/45">{readablePlanningValue(doughTypeGuidance.selectedFermentationMode)}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Style fit" value={readablePlanningValue(doughTypeGuidance.fitLevel)} risk={doughTypeGuidance.fitLevel} />
            <PlanningMetric label="Style risk" value={readablePlanningValue(doughTypeGuidance.riskLevel)} risk={doughTypeGuidance.riskLevel} />
            <PlanningMetric label="Time window" value={`${doughTypeGuidance.availableFermentationHours} h`} risk={doughTypeGuidance.riskLevel} />
          </div>
          {(doughTypeGuidance.cautions.length > 0 || doughTypeGuidance.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {doughTypeGuidance.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {doughTypeGuidance.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{doughTypeGuidance.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {doughTypeGuidance.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{doughTypeGuidance.technicalNote}</p>}
        </section>
      )}

      {flourGuidance && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(flourGuidance.riskLevel)}`} aria-labelledby="advanced-flour-guidance">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Flour guidance</p>
              <h3 id="advanced-flour-guidance" className="mt-2 font-display text-2xl font-semibold">{flourGuidance.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{flourGuidance.summary}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] px-4 py-3 text-left sm:min-w-48">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Selected flour</span>
              <strong className="mt-1 block text-xl text-ink">{flourGuidance.flourType}</strong>
              <span className="mt-1 block text-xs text-ink/45">{readablePlanningValue(flourGuidance.flourCategory)}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Suitability" value={readablePlanningValue(flourGuidance.suitabilityLevel)} risk={flourGuidance.suitabilityLevel} />
            <PlanningMetric label="Flour risk" value={readablePlanningValue(flourGuidance.riskLevel)} risk={flourGuidance.riskLevel} />
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Advanced context</span>
              <strong className="mt-2 block text-sm text-ink">
                {[
                  flourGuidance.proteinPercent === null ? null : `${flourGuidance.proteinPercent}% protein`,
                  flourGuidance.wValue === null ? null : `W ${flourGuidance.wValue}`,
                ].filter(Boolean).join(" · ") || "optional"}
              </strong>
            </div>
          </div>
          {(flourGuidance.cautions.length > 0 || flourGuidance.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {flourGuidance.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {flourGuidance.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{flourGuidance.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {flourGuidance.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{flourGuidance.technicalNote}</p>}
        </section>
      )}

      {yeastGuidance && (
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(yeastGuidance.riskLevel)}`} aria-labelledby="advanced-yeast-guidance">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Yeast guidance</p>
              <h3 id="advanced-yeast-guidance" className="mt-2 font-display text-2xl font-semibold">{yeastGuidance.title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{yeastGuidance.summary}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] px-4 py-3 text-left sm:min-w-48">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Selected yeast</span>
              <strong className="mt-1 block text-xl text-ink">{yeastLabel}</strong>
              <span className="mt-1 block text-xs text-ink/45">
                {yeastGuidance.calculatedYeastGrams === null ? "Amount not available" : `${grams(yeastGuidance.calculatedYeastGrams, locale, true)} g`}
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PlanningMetric label="Broad fit / risk" value={readablePlanningValue(yeastGuidance.riskLevel)} risk={yeastGuidance.riskLevel} />
            <PlanningMetric label="Recipe yeast %" value={percentValue(yeastGuidance.calculatedYeastPercentOfFlour, locale)} risk={yeastGuidance.riskLevel} />
            <PlanningMetric label="Fresh yeast equivalent" value={percentValue(yeastGuidance.calculatedFreshYeastEquivalentPercent, locale)} risk={yeastGuidance.riskLevel} />
          </div>
          {(yeastGuidance.cautions.length > 0 || yeastGuidance.suggestedAdjustments.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {yeastGuidance.cautions.length > 0 && (
                <div className="rounded-2xl bg-tomato/[.06] p-4">
                  <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">Watch out</span>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-ink/55">
                    {yeastGuidance.cautions.slice(0, 2).map((caution) => <li key={caution}>• {caution}</li>)}
                  </ul>
                </div>
              )}
              <div className="rounded-2xl bg-leaf/[.08] p-4">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Suggested adjustment</span>
                <p className="mt-2 text-xs leading-5 text-ink/55">{yeastGuidance.suggestedAdjustments[0]}</p>
              </div>
            </div>
          )}
          {yeastGuidance.technicalNote && <p className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/50">{yeastGuidance.technicalNote}</p>}
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${warnings.length > 0 ? "border-tomato/20 bg-tomato/[.05]" : "border-white/80 bg-white/75"}`} aria-labelledby="advanced-planning-warnings">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Warnings</p>
          <h3 id="advanced-planning-warnings" className="mt-2 font-display text-2xl font-semibold">Planning warnings</h3>
          {warnings.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {warnings.slice(0, 4).map((warning) => (
                <li key={warning.id} className="rounded-2xl border border-tomato/15 bg-tomato/[.06] p-4">
                  <strong className="block text-sm text-ink">{warning.userMessage}</strong>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[.14em] text-tomato">{warning.severity.replace("_", " ")}</span>
                  <p className="mt-2 text-xs leading-5 text-ink/55">{warning.suggestedFix}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-leaf/20 bg-leaf/[.08] p-4 text-sm leading-6 text-ink/60">
              No major planning warnings for this conservative v1 setup.
            </p>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="advanced-mixing-guidance">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Mixing</p>
          <h3 id="advanced-mixing-guidance" className="mt-2 font-display text-2xl font-semibold">{mixing?.title ?? "Mixing guidance"}</h3>
          <p className="mt-3 text-sm leading-6 text-ink/60">{mixing?.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-ink/[.04] p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">What to watch</span>
              <p className="mt-2 text-xs leading-5 text-ink/55">{mixing?.doughFeel}</p>
            </div>
            <div className="rounded-2xl bg-ink/[.04] p-4">
              <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Avoid</span>
              <p className="mt-2 text-xs leading-5 text-ink/55">{mixing?.avoid.slice(0, 2).join(" ")}</p>
            </div>
          </div>
          {mixing && (
            <p className="mt-4 rounded-2xl border border-ink/10 bg-white p-4 text-xs leading-5 text-ink/55">
              <strong className="text-ink">Mixing impact:</strong> {mixing.stopWhen}
            </p>
          )}
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="advanced-planning-summary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Planning summary</p>
            <h3 id="advanced-planning-summary" className="mt-2 font-display text-2xl font-semibold">Variables that affect this plan</h3>
          </div>
          <span className="rounded-full bg-ink/[.06] px-3 py-1.5 text-xs font-extrabold text-ink/55">
            {planningResult.availableFermentationHours} h available · {planningResult.recommendedFermentationMode.replace("_", " ")}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Fermentation direction</span>
            <strong className="mt-2 block text-sm text-ink">{planningResult.recommendedFermentationMode.replace("_", " ")}</strong>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Flour category</span>
            <strong className="mt-2 block text-sm text-ink">{planningResult.recommendedFlourCategory.replace("_", " ")}</strong>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Quality signal</span>
            <strong className="mt-2 block text-sm text-ink">{planningResult.qualityScore.label.replace("_", " ")}</strong>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Process outline</span>
            <strong className="mt-2 block text-sm text-ink">{timeline?.steps.map((step) => step.title).slice(0, 4).join(" → ")}</strong>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-leaf/[.08] p-4 text-xs leading-5 text-ink/55">
          This is a calculator-oriented planning summary, not a full dough-making workflow. Exact work phases can come later after the engine is proven.
        </p>
      </section>

      <section className={`rounded-[1.75rem] border p-5 shadow-card backdrop-blur sm:p-6 ${guidanceCardClasses(temperature?.riskLevel)}`} aria-labelledby="advanced-temperature-guidance">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Temperature</p>
        <h3 id="advanced-temperature-guidance" className="mt-2 font-display text-2xl font-semibold">Temperature guidance</h3>
        <p className="mt-3 text-sm leading-6 text-ink/60">{temperature?.summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PlanningMetric label="Room" value={temperature?.roomCategory.replace("_", " ") ?? "not available"} risk={temperature?.riskLevel} />
          <PlanningMetric label="Fridge" value={temperature?.fridgeCategory.replace("_", " ") ?? "not available"} risk={temperature?.riskLevel} />
          <PlanningMetric label="Risk" value={temperature?.riskLevel.replace("_", " ") ?? "not available"} risk={temperature?.riskLevel} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p className="rounded-2xl bg-white/70 p-4 text-xs leading-5 text-ink/55">{temperature?.roomTemperatureNote}</p>
          <p className="rounded-2xl bg-white/70 p-4 text-xs leading-5 text-ink/55">{temperature?.fridgeTemperatureNote}</p>
        </div>
      </section>
        </div>
      </details>
    </section>
  );
}

type HomeCalculatorWorkspaceProps = {
  variant?: "full" | "entry";
};

export default function HomeCalculatorWorkspace({ variant = "full" }: HomeCalculatorWorkspaceProps) {
  const focusedEntry = variant === "entry";
  const locale: Locale = "en";
  const [goal, setGoal] = useState<PizzaGoal>("balanced");
  const [pizzaStyleId, setPizzaStyleId] = useState<PizzaStyleId>("neapolitan");
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
  const [showBakeForm, setShowBakeForm] = useState(false);
  const [bakeRating, setBakeRating] = useState(0);
  const [bakeTimeSeconds, setBakeTimeSeconds] = useState("");
  const [bakeOvenTemperature, setBakeOvenTemperature] = useState("");
  const [bakeNote, setBakeNote] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [recipeNotice, setRecipeNotice] = useState("");
  const [urlReady, setUrlReady] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [advancedBakeDate, setAdvancedBakeDate] = useState(defaultBakeDateValue);
  const [advancedBakeTime, setAdvancedBakeTime] = useState("18:00");
  const [advancedDoughType, setAdvancedDoughType] = useState<AdvancedDoughType>("cold_neapolitan");
  const [planningMixingMethod, setPlanningMixingMethod] = useState<PlanningMixingMethod>("hand_mixing");
  const [planningRoomTemperature, setPlanningRoomTemperature] = useState(22);
  const [planningFridgeTemperature, setPlanningFridgeTemperature] = useState(4);
  const [targetDoughTemperature, setTargetDoughTemperature] = useState("");
  const [mixerFrictionHeat, setMixerFrictionHeat] = useState("");
  const [proteinPercent, setProteinPercent] = useState("");
  const [wValue, setWValue] = useState("");
  const t = copy.en;
  const levelCopy = getHomepageExperienceCopy(experienceLevel);
  const experienceConfig = getExperienceLevelConfig(experienceLevel);
  const isColdFermentation = fermentation.endsWith("cold");
  const activeBake = bakeFor(goal, ovenType);
  const ovenTemperature = activeBake.temperature;
  const activePreset = presetFor(goal, ovenTemperature, fermentation);
  const disclosure = getCalculatorDisclosureMode(experienceLevel);
  const advancedOpen = !focusedEntry && (disclosure.showAdvancedByDefault || showAdvanced);
  const recommendedOpen = disclosure.showRecommendedByDefault || advancedOpen;
  const activeFlour = flourById(flourId);
  const activePizzaStyle = pizzaStyleById(pizzaStyleId, goal);
  const activePizzaName = activePizzaStyle.nameEn;
  const selectedAdvancedDoughType = advancedDoughTypes.find((type) => type.value === advancedDoughType) ?? advancedDoughTypes[0];
  const hasActiveAdvancedValues = hasAdvancedCalculatorValues(
    { ballWeight, waste, hydration, salt, yeastType, temperature, flourId },
    activePreset,
  );

  useEffect(() => {
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  useEffect(() => {
    setSavedRecipes(loadSavedRecipes());
  }, []);

  useEffect(() => {
    if (focusedEntry) {
      setUrlReady(false);
      return;
    }

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
    if (shared.pizzaStyleId !== undefined) setPizzaStyleId(shared.pizzaStyleId);
    else if (shared.goal !== undefined) setPizzaStyleId(defaultPizzaStyleId(shared.goal));
    if (shared.goal === "pan") setOvenType("home");
    else if (shared.ovenType !== undefined) setOvenType(shared.ovenType);
    if (shared.flourId !== undefined) setFlourId(shared.flourId);
    setUrlReady(true);
  }, [focusedEntry]);

  const applyPreset = (nextGoal: PizzaGoal, nextOvenType = ovenType, nextFermentation = fermentation) => {
    const safeOvenType: OvenType = nextGoal === "pan" ? "home" : nextOvenType;
    const nextOvenTemperature = bakeFor(nextGoal, safeOvenType).temperature;
    const preset = presetFor(nextGoal, nextOvenTemperature, nextFermentation);
    setGoal(nextGoal);
    if (nextGoal !== goal) {
      setPizzaStyleId(defaultPizzaStyleId(nextGoal));
      setPizzas(nextGoal === "pan" ? 1 : 6);
    }
    setOvenType(safeOvenType);
    setBallWeight(preset.ballWeight);
    setHydration(preset.hydration);
    setSalt(preset.salt);
    setFermentation(preset.fermentation);
    setTemperature(preset.temperature);
    setYeastType("idy");
  };

  const applyAdvancedDoughType = (nextType: AdvancedDoughType) => {
    const doughType = advancedDoughTypes.find((type) => type.value === nextType) ?? advancedDoughTypes[0];
    setAdvancedDoughType(nextType);
    applyPreset(doughType.goal, ovenType, doughType.fermentation);
  };

  const currentSettings = useMemo(() => ({
    pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation, temperature, goal, ovenType, flourId, pizzaStyleId,
  }), [pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation, temperature, goal, ovenType, flourId, pizzaStyleId]);
  const recipe = useMemo(() => calculateDoughIngredients(currentSettings), [currentSettings]);
  const planningResult = useMemo(() => buildPlanningResult(planningInputFromCalculator({
    currentDateTime: new Date(),
    desiredBakeDateTime: bakeTargetDateTime(advancedBakeDate, advancedBakeTime),
    ovenType,
    fermentation,
    experienceLevel,
    flourId,
    pizzas,
    ballWeight,
    hydration,
    salt,
    doughStyle: advancedDoughType,
    yeastType,
    calculatedFlourGrams: recipe.flour,
    calculatedYeastGrams: recipe.leavener,
    planningMixingMethod,
    planningRoomTemperature,
    planningFridgeTemperature,
    proteinPercent: optionalPlanningNumber(proteinPercent),
    wValue: optionalPlanningNumber(wValue),
    targetDoughTemperature: optionalPlanningNumber(targetDoughTemperature),
    mixerFrictionHeat: optionalPlanningNumber(mixerFrictionHeat),
  })), [
    ovenType,
    experienceLevel,
    fermentation,
    flourId,
    pizzas,
    ballWeight,
    hydration,
    salt,
    advancedDoughType,
    yeastType,
    recipe.flour,
    recipe.leavener,
    planningMixingMethod,
    planningRoomTemperature,
    planningFridgeTemperature,
    proteinPercent,
    wValue,
    targetDoughTemperature,
    mixerFrictionHeat,
    advancedBakeDate,
    advancedBakeTime,
  ]);

  const recipeQuery = recipeParams(currentSettings).toString();
  const toolHref = (tool: HomepageTool) => tool.preserveRecipe ? `${tool.href}?${recipeQuery}` : tool.href;
  const planHref = `/plan?${recipeQuery}`;
  const doctorHref = `/doctor?${recipeQuery}`;
  const sauceHref = `/sauce?${recipeQuery}`;
  const toppingsHref = `/toppings?${recipeQuery}`;
  const timerHref = `/timer?${recipeQuery}`;
  const recipeWorkflow = getRecipeWorkflowHandoff(experienceLevel, recipeQuery);
  const stylesHref = "/styles";
  const journalHref = `/journal?${recipeQuery}`;

  useEffect(() => {
    if (focusedEntry) return;
    if (!urlReady) return;
    const query = recipeParams(currentSettings).toString();
    window.history.replaceState(null, "", `${window.location.pathname}?${query}`);
    window.dispatchEvent(new Event("doughtools:urlchange"));
  }, [currentSettings, focusedEntry, urlReady]);

  const copyRecipeLink = async () => {
    await navigator.clipboard.writeText(recipeUrl(currentSettings));
    setRecipeNotice(t.linkCopied);
  };

  const shareRecipe = async () => {
    const url = recipeUrl(currentSettings);
    const style = activePizzaName;
    const text = t.shareText.replace("{style}", style.toLowerCase());
    const card = await shareCardFile(
      style,
      `${pizzas} × ${ballWeight} g`,
      [`${hydration} % ${t.hydration.toLowerCase()}`, `${t.ferment[fermentation][0]} · ${activeBake.temperature} °C · ${activeBake.time}`],
      activePizzaStyle.image,
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
    const style = activePizzaName;
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

  const saveCurrentBake = () => {
    const ovenTemperatureValue = Number(bakeOvenTemperature);
    const bakeTimeValue = Number(bakeTimeSeconds);
    const bakingSnapshot = createBakingSnapshot({
      ovenType,
      ...(Number.isFinite(ovenTemperatureValue) && ovenTemperatureValue > 0 ? { ovenTemperatureCelsius: ovenTemperatureValue } : {}),
      ...(Number.isFinite(bakeTimeValue) && bakeTimeValue > 0 ? { bakeTimeSeconds: bakeTimeValue } : {}),
    });
    const hasResultDetails = bakeRating > 0 || Boolean(bakeNote.trim());
    const resultSnapshot = hasResultDetails ? createResultSnapshot({
      ...(bakeRating > 0 ? { overallRating: bakeRating } : {}),
      ...(bakeNote.trim() ? { resultNotes: bakeNote.trim() } : {}),
    }) : undefined;
    const bakeResult = createBakeResult({
      recipeSnapshot: createRecipeSnapshot(currentSettings, recipe),
      bakingSnapshot,
      ...(resultSnapshot ? { resultSnapshot } : {}),
      visibility: "private",
    });

    addLocalBakeResult(bakeResult);
    setBakeRating(0);
    setBakeTimeSeconds("");
    setBakeOvenTemperature("");
    setBakeNote("");
    setShowBakeForm(false);
    setRecipeNotice(t.bakeSaved);
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
    setPizzaStyleId(settings.pizzaStyleId ?? defaultPizzaStyleId(settings.goal));
    setOvenType(settings.goal === "pan" ? "home" : settings.ovenType);
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
        {!focusedEntry && (
        <>
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
            <Link href="/history" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink lg:block">Pizza history</Link>
            <Link href="/ovens" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink lg:block">Oven guide</Link>
            <Link href="/gear" className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">Gear</Link>
            <Link href={sauceHref} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">Sauce</Link>
            <Link href={`/costs?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">Costs</Link>
            <Link href={`/coach?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full bg-tomato px-3 py-2 text-xs font-bold text-white transition hover:bg-tomato/90 xl:block">Pizza Coach</Link>
            <Link href={`/community?${recipeParams(currentSettings).toString()}`} className="hidden rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink xl:block">Community</Link>
            <span className="hidden rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-leaf md:block">{t.toolkit}</span>
          </div>
        </header>

        <nav className="legacy-tool-nav mb-7 flex gap-2 overflow-x-auto pb-1 xl:hidden" aria-label={t.toolkit}>
          <a href="#top" className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.calculator}</a>
          <Link href={planHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.planner}</Link>
          <Link href={doctorHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.doctor}</Link>
          <Link href={stylesHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.styles}</Link>
          <Link href={journalHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">{t.journal}</Link>
          <Link href="/history" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Pizza history</Link>
          <Link href="/ovens" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Oven guide</Link>
          <Link href="/gear" className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Gear</Link>
          <Link href={sauceHref} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Sauce</Link>
          <Link href={`/costs?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Costs</Link>
          <Link href={`/coach?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full bg-tomato px-4 py-2 text-xs font-bold text-white">Pizza Coach</Link>
          <Link href={`/community?${recipeParams(currentSettings).toString()}`} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/60">Community</Link>
        </nav>

        <section className="mb-6 grid gap-5 rounded-[2rem] border border-white/80 bg-white/65 p-5 shadow-card backdrop-blur sm:p-7 lg:grid-cols-[1.1fr_.9fr] lg:items-center" aria-labelledby="homepage-title">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{homepageContent.hero.eyebrow}</p>
            <h1 id="homepage-title" className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{homepageContent.hero.h1}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">{homepageContent.hero.intro}</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">{levelCopy.heroIntro}</p>
            <Link
              href="/account"
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 transition hover:scale-[1.01] active:scale-[.98] ${experienceConfig.badgeClassName}`}
            >
              <span aria-hidden="true">{experienceConfig.marker}</span>
              {experienceConfig.label} guidance
            </Link>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <a href={homepageContent.hero.primaryCta.href} className="rounded-2xl bg-tomato px-5 py-4 text-center text-sm font-extrabold text-white shadow-lg shadow-tomato/15 transition active:scale-[.98]">{homepageContent.hero.primaryCta.label}</a>
              <Link href={homepageContent.hero.secondaryCta.href} className="rounded-2xl border border-ink/10 bg-white px-5 py-4 text-center text-sm font-extrabold text-ink transition hover:border-ink/25 active:scale-[.98]">{homepageContent.hero.secondaryCta.label}</Link>
            </div>
            <Link href="/session/start" className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-leaf/20 bg-leaf/[.08] p-4 text-left transition hover:border-leaf/35 hover:bg-leaf/[.12] active:scale-[.99]">
              <span>
                <span className="block text-xs font-extrabold uppercase tracking-[.18em] text-leaf">New to DoughTools?</span>
                <span className="mt-1 block text-sm font-extrabold text-ink">Start Pizza Session</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">Pick home oven, pizza oven or pan pizza first. You do not need to tune every setting yet.</span>
              </span>
              <span className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-leaf">Start →</span>
            </Link>
          </div>
          <div className="rounded-[1.5rem] bg-ink p-5 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/40">DoughTools workflow</p>
            <div className="mt-4 grid gap-3">
              {["Level", "Dough", "Plan", "Improve"].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/[.06] p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-extrabold text-ink">{index + 1}</span>
                  <span className="font-display text-2xl font-semibold">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/45">{levelCopy.workflowHint}</p>
          </div>
        </section>

        <div id="experience-level" className="scroll-mt-24">
          <ExperienceLevelSelector
            value={experienceLevel}
            onChange={setExperienceLevel}
            title="Choose how DoughTools should guide you"
            intro="Pick the pizza-making level that feels like you today. Beginner keeps the path simple, Enthusiast explains the why, and Pizza Nerd exposes deeper technical context. The calculator, planner and help pages use the same local choice."
            className="mb-7"
          />
        </div>

        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Pizza-making workflow">
          {homepageContent.workflow.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm">
              <span className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Step {index + 1}</span>
              <h2 className="mt-2 font-display text-xl font-semibold">{step.title}</h2>
              <p className="mt-2 text-xs leading-5 text-ink/55">{step.description}</p>
            </article>
          ))}
        </section>

        <ContinuePizzaSessionCard className="mb-7" />

        <InstallAppPrompt compact className="mb-7" />

        <section className="mb-7 max-w-2xl sm:mb-10" aria-labelledby="calculator-intro">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p>
          <h2 id="calculator-intro" className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">{t.title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60 sm:text-base">{levelCopy.calculatorIntro}</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55">
            The calculator gives the numbers. The guidance explains what they mean, then Planner and Dough Doctor help with timing and troubleshooting.
          </p>
        </section>
        </>
        )}

        {focusedEntry && (
          <AdvancedCalculatorTopSummary
            doughTypeLabel={selectedAdvancedDoughType.label}
            bakeDate={advancedBakeDate}
            bakeTime={advancedBakeTime}
            planningResult={planningResult}
            locale={locale}
          />
        )}

        <div className={`grid min-w-0 items-start gap-5 ${focusedEntry ? "xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] xl:gap-6" : "lg:grid-cols-[1.2fr_.8fr] lg:gap-7"}`}>
          {!focusedEntry && (
          <section id="top" tabIndex={-1} className="scroll-mt-24 min-w-0 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur outline-none sm:p-7" aria-labelledby="recipe-settings">
            <div className="mb-2 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">1</span><h2 id="recipe-settings" className="font-display text-2xl font-semibold">{t.quickTitle}</h2></div>
            <p className="text-sm leading-6 text-ink/55">{levelCopy.quickIntro}</p>
            <div className={`my-5 rounded-2xl border p-4 ${experienceConfig.cardClassName}`}>
              <p className="text-xs font-extrabold uppercase tracking-[.16em]">{disclosure.statusLabel}</p>
              <p className="mt-2 text-sm leading-6 text-ink/60">{disclosure.intro}</p>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-ink/55 sm:grid-cols-3">
                {calculatorControlGroups.map((group) => (
                  <div key={group.id} className="rounded-xl bg-white/65 p-3">
                    <strong className="block text-ink">{group.title}</strong>
                    <span className="mt-1 block">{group.fields.slice(0, 3).join(" · ")}</span>
                  </div>
                ))}
              </div>
            </div>
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
              <NumberField id="quick-pizzas" label={goal === "pan" ? t.panPizzas : t.pizzas} value={pizzas} min={1} max={50} stepper decreaseLabel={t.decrease} increaseLabel={t.increase} onChange={setPizzas} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">{t.oven}</legend>
                <div className="grid h-14 grid-cols-2 rounded-2xl bg-ink/5 p-1">
                  {(["gas", "home"] as OvenType[]).map((option) => { const locked = goal === "pan" && option === "gas"; return <button key={option} type="button" disabled={locked} onClick={() => applyPreset(goal, option)} aria-pressed={ovenType === option} className={`rounded-xl px-2 text-left transition ${ovenType === option ? "bg-white text-ink shadow-sm" : "text-ink/45"} ${locked ? "cursor-not-allowed opacity-35" : ""}`}><span className="block text-xs font-extrabold">{locked ? "🔒 " : ""}{option === "home" ? t.homeOven : t.gasOven}</span><span className="mt-0.5 block truncate text-[9px] font-semibold opacity-60">{option === "home" ? t.homeOvenNote : t.gasOvenNote}</span></button>; })}
                </div>
                {goal === "pan" && <p className="mt-2 text-[10px] leading-4 text-ink/45">{t.panOvenLocked}</p>}
              </fieldset>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-leaf/[.08] p-4 text-center sm:grid-cols-4">
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.ballWeight}</span><strong className="mt-1 block text-sm">{activePreset.ballWeight} g</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.flourStrength}</span><strong className="mt-1 block text-sm">{activePreset.flourW}</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.mediumSize}</span><strong className="mt-1 block text-sm">{activePreset.diameter}</strong></div>
              <div><span className="block text-[10px] font-bold uppercase tracking-wide text-ink/40">{t.fermentation}</span><strong className="mt-1 block text-sm">{t.ferment[fermentation][0]}</strong></div>
            </div>
            {recommendedOpen && (
              <section className="mt-5 rounded-2xl border border-ink/10 bg-white p-4" aria-labelledby="recommended-settings">
                <div className="mb-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-leaf">Recommended settings</p>
                  <h3 id="recommended-settings" className="mt-1 text-sm font-extrabold">{t.flourChoice}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-ink/45">{levelCopy.flourIntro}</p>
                </div>
                <select id="flour-profile" aria-label={t.flourChoice} value={flourId} onChange={(event) => setFlourId(event.target.value as FlourId)} className="h-12 w-full rounded-xl border border-ink/10 bg-cream px-3 text-sm font-bold outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10">
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
                <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><strong className="text-sm">{t.bakeGuide}</strong><div className="flex gap-4 text-left sm:text-right"><span><small className="block text-[9px] font-bold uppercase tracking-wide text-white/40">{t.bakeTemperature}</small><b className="text-sm">{activeBake.temperature}°C</b></span><span><small className="block text-[9px] font-bold uppercase tracking-wide text-white/40">{t.bakeTime}</small><b className="text-sm">{activeBake.time}</b></span></div></div>
                  <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-5 text-white/45">{ovenType === "home" ? t.homePreheat : t.gasPreheat}{goal === "pan" && ovenType === "gas" ? ` ${t.panGasNote}` : ""}</p>
                </div>
              </section>
            )}
            {!focusedEntry && experienceLevel !== "pizza_nerd" && (
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                aria-expanded={advancedOpen}
                aria-controls="advanced-calculator-settings"
                className="mt-5 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {advancedOpen ? "Hide more settings" : disclosure.disclosureLabel} <span aria-hidden="true">{advancedOpen ? "↑" : "↓"}</span>
                <span className="mt-1 block text-xs font-medium text-ink/45">{advancedOpen ? disclosure.expandedHelp : disclosure.collapsedHelp}</span>
                {!advancedOpen && hasActiveAdvancedValues && <span className="mt-1 block text-xs font-extrabold text-tomato">More settings are active in this recipe link.</span>}
              </button>
            )}

            {advancedOpen && <div id="advanced-calculator-settings" className="mt-7 border-t border-ink/10 pt-7">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">2</span><h2 className="font-display text-2xl font-semibold">{t.build}</h2></div>
            <div className="mb-5 rounded-2xl bg-ink/[.04] p-4">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">{calculatorControlGroups[2].title}</p>
              <p className="mt-1 text-sm leading-6 text-ink/55">{calculatorControlGroups[2].description}</p>
              {disclosure.technicalNotes.length > 0 && (
                <ul className="mt-3 grid gap-2 text-xs leading-5 text-ink/55">
                  {disclosure.technicalNotes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField id="ball-weight" label={t.ballWeight} value={ballWeight} min={100} max={1000} step={5} suffix="g" stepper onChange={setBallWeight} />
              <NumberField id="hydration" label={t.hydration} value={hydration} min={40} max={100} step={0.5} suffix="%" stepper onChange={setHydration} />
              <NumberField id="salt" label={t.salt} value={salt} min={0} max={10} step={0.1} suffix="%" stepper onChange={setSalt} />
              <NumberField id="waste" label={t.waste} value={waste} min={0} max={25} step={0.5} suffix="%" stepper onChange={setWaste} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">{t.yeastType}</legend>
                <div className="grid h-14 grid-cols-5 rounded-2xl bg-ink/5 p-1">
                  {(["cy", "ady", "idy", "ssd", "lsd"] as YeastType[]).map((type) => <button key={type} type="button" title={t.yeasts[type][1]} aria-label={t.yeasts[type][1]} aria-pressed={yeastType === type} onClick={() => setYeastType(type)} className={`rounded-xl text-xs font-extrabold transition ${yeastType === type ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{t.yeasts[type][0]}</button>)}
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
          )}

          {focusedEntry && (
            <>
              <AdvancedCalculatorStandaloneControls
                bakeDate={advancedBakeDate}
                onBakeDateChange={setAdvancedBakeDate}
                bakeTime={advancedBakeTime}
                onBakeTimeChange={setAdvancedBakeTime}
                doughType={advancedDoughType}
                onDoughTypeChange={applyAdvancedDoughType}
                pizzas={pizzas}
                onPizzasChange={setPizzas}
                ballWeight={ballWeight}
                onBallWeightChange={setBallWeight}
                goal={goal}
                onGoalChange={(nextGoal) => applyPreset(nextGoal)}
                ovenType={ovenType}
                onOvenTypeChange={(nextOven) => applyPreset(goal, nextOven)}
                fermentation={fermentation}
                onFermentationChange={(nextFermentation) => applyPreset(goal, ovenType, nextFermentation)}
                mixingMethod={planningMixingMethod}
                onMixingMethodChange={setPlanningMixingMethod}
                yeastType={yeastType}
                onYeastTypeChange={setYeastType}
                flourId={flourId}
                onFlourIdChange={setFlourId}
                hydration={hydration}
                onHydrationChange={setHydration}
                salt={salt}
                onSaltChange={setSalt}
                roomTemperature={planningRoomTemperature}
                onRoomTemperatureChange={setPlanningRoomTemperature}
                fridgeTemperature={planningFridgeTemperature}
                onFridgeTemperatureChange={setPlanningFridgeTemperature}
                targetDoughTemperature={targetDoughTemperature}
                onTargetDoughTemperatureChange={setTargetDoughTemperature}
                mixerFrictionHeat={mixerFrictionHeat}
                onMixerFrictionHeatChange={setMixerFrictionHeat}
                proteinPercent={proteinPercent}
                onProteinPercentChange={setProteinPercent}
                wValue={wValue}
                onWValueChange={setWValue}
                activeFlour={activeFlour}
                totalDough={recipe.total}
                locale={locale}
                t={t}
              />
              <AdvancedCalculatorPlanningShell
                recipe={recipe}
                planningResult={planningResult}
                yeastLabel={t.yeasts[yeastType][1]}
                locale={locale}
              />
            </>
          )}

          {!focusedEntry && (
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
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/40">{experienceConfig.label} guidance</p>
                <h3 className="mt-2 text-sm font-extrabold text-white">{disclosure.resultHeading}</h3>
                <ul className="mt-3 grid gap-2 text-xs leading-5 text-white/60">
                  {levelCopy.resultDetails.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl bg-white/[.06] p-3">
                  <p className="text-xs font-bold leading-5 text-white/75">{disclosure.nextStep}</p>
                  <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-white/55">
                    {disclosure.causeAndEffect.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8c98a]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <section className="mt-4 rounded-2xl border border-white/10 bg-white/[.045] p-4" aria-labelledby="recipe-workflow-heading">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#e8c98a]">Workflow handoff</p>
                  <h3 id="recipe-workflow-heading" className="mt-2 text-base font-extrabold text-white">{recipeWorkflow.heading}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/65">{recipeWorkflow.intro}</p>
                  <p className="mt-2 text-[11px] leading-5 text-white/45">{recipeWorkflow.detail}</p>
                  <div className="mt-4 grid gap-2">
                    {recipeWorkflow.actions.map((action) => {
                      const isPrimary = action.id === recipeWorkflow.primaryActionId;
                      const className = isPrimary
                        ? "rounded-xl bg-white px-3 py-3 text-left text-xs font-extrabold text-ink transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
                        : "rounded-xl border border-white/15 px-3 py-3 text-left text-xs font-bold text-white/75 transition hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]";
                      const content = (
                        <>
                          <span className="block">{action.label}{action.href ? " →" : ""}</span>
                          <span className={`mt-1 block text-[11px] leading-4 ${isPrimary ? "font-semibold text-ink/55" : "font-medium text-white/45"}`}>{action.description}</span>
                          {action.preservesQuery && <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] ${isPrimary ? "bg-ink/[.06] text-ink/45" : "bg-white/[.06] text-white/35"}`}>Recipe context included</span>}
                        </>
                      );

                      return action.href ? (
                        <Link key={action.id} href={action.href} className={className}>
                          {content}
                        </Link>
                      ) : (
                        <div key={action.id} className="rounded-xl border border-white/10 px-3 py-3 text-left text-xs font-bold text-white/70">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
              <div className="mt-6 overflow-hidden rounded-2xl bg-cream text-ink">
                <div className="grid min-h-40 grid-cols-[42%_58%] overflow-hidden">
                  <div className="relative min-h-40"><Image src={activePizzaStyle.image} alt={activePizzaName} fill sizes="280px" className="object-cover"/></div>
                  <div className="flex min-w-0 flex-col justify-center p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">DoughTools</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-none">{activePizzaName}</h3>
                    <p className="mt-2 text-[11px] font-semibold leading-4 text-ink/55">{pizzas} × {ballWeight} g · {hydration} % · {t.ferment[fermentation][0]}</p>
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
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
                  <h3 className="text-sm font-extrabold text-white">{t.saveRecipeValueTitle}</h3>
                  <p className="mt-1 text-[11px] leading-5 text-white/55">{t.saveRecipeValueIntro}</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#e8c98a]">{saveRecipeValueByLevel[experienceLevel]}</p>
                </div>
                {showSaveForm ? (
                  <div>
                    <label htmlFor="recipe-name" className="mb-2 block text-xs font-bold text-white/60">{t.recipeName}</label>
                    <input id="recipe-name" type="text" value={recipeName} onChange={(event) => setRecipeName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveCurrentRecipe(); }} placeholder={t.recipeNamePlaceholder} autoFocus className="h-12 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:ring-4 focus:ring-tomato/25" />
                    <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setShowSaveForm(false); setRecipeName(""); }} className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-bold text-white/60">{t.cancel}</button><button type="button" onClick={saveCurrentRecipe} disabled={!recipeName.trim()} className="rounded-xl bg-tomato px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40">{t.save}</button></div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setShowSaveForm(true); setRecipeNotice(""); }} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-cream">{t.saveRecipe}</button>
                )}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{t.saveBake}</h3>
                      <p className="mt-1 text-[10px] leading-4 text-white/45">{levelCopy.saveBakeHelp} {BAKE_RESULTS_LOCAL_ONLY_COPY}</p>
                    </div>
                    <button type="button" onClick={() => { setShowBakeForm((current) => !current); setRecipeNotice(""); }} aria-expanded={showBakeForm} className="shrink-0 rounded-xl bg-tomato px-3 py-2 text-xs font-extrabold text-white">{showBakeForm ? t.cancel : t.save}</button>
                  </div>
                  {showBakeForm && <div className="mt-3 grid gap-2">
                    <fieldset>
                      <legend className="mb-2 text-[10px] font-bold text-white/50">{t.bakeRating}</legend>
                      <div className="flex gap-1.5">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => setBakeRating(rating)} aria-label={`Set overall bake rating to ${rating} out of 5`} aria-pressed={bakeRating === rating} className={`grid h-9 w-9 place-items-center rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${rating <= bakeRating ? "bg-tomato text-white" : "bg-white/10 text-white/35"}`}>★</button>)}</div>
                    </fieldset>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] font-bold text-white/50">{t.bakeTimeSeconds}<input inputMode="numeric" value={bakeTimeSeconds} onChange={(event) => setBakeTimeSeconds(event.target.value.replace(/[^\d]/g, ""))} placeholder="90" className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:ring-4 focus:ring-tomato/25" /></label>
                      <label className="text-[10px] font-bold text-white/50">{t.bakeOvenTemp}<input inputMode="numeric" value={bakeOvenTemperature} onChange={(event) => setBakeOvenTemperature(event.target.value.replace(/[^\d]/g, ""))} placeholder={String(activeBake.temperature)} className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-semibold text-ink outline-none focus:ring-4 focus:ring-tomato/25" /></label>
                    </div>
                    <label className="text-[10px] font-bold text-white/50">{t.privateBakeNote}<textarea value={bakeNote} onChange={(event) => setBakeNote(event.target.value)} placeholder={t.privateBakePlaceholder} rows={2} className="mt-1 w-full rounded-xl border border-white/10 bg-white p-3 text-sm text-ink outline-none focus:ring-4 focus:ring-tomato/25" /></label>
                    <button type="button" onClick={saveCurrentBake} className="rounded-xl bg-white px-3 py-3 text-xs font-extrabold text-ink">{t.saveBake}</button>
                    <Link href={journalHref} className="rounded-xl border border-white/15 px-3 py-3 text-center text-xs font-bold text-white/65">{t.savedBakesLink} →</Link>
                  </div>}
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.04] px-5 py-4 sm:px-7">
              <p className="flex items-start gap-2 text-xs leading-5 text-white/45"><svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.01"/></svg>{levelCopy.resultNote}</p>
            </div>
          </aside>
          )}
        </div>

        {!focusedEntry && (
        <>
        <section id="instructions" className="mt-8 rounded-[1.75rem] bg-leaf p-5 text-white shadow-card sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/50">03 · DoughTools</p><h2 className="mt-2 font-display text-3xl font-semibold">{t.instructionsTitle}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">{t.instructionsIntro} {t.startClock}</p></div>
            <Link href={planHref} className="shrink-0 rounded-2xl bg-white px-5 py-4 text-center text-sm font-extrabold text-leaf shadow-lg transition active:scale-[.98]">{t.openPlan} →</Link>
          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="core-tools">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Primary workflow</p>
            <h2 id="core-tools" className="font-display text-3xl font-semibold">Core pizza workflow tools</h2>
            <p className="mt-3 text-sm leading-6 text-ink/55">Use the dough recipe as the starting point, then continue into the tools that prepare the whole pizza night.</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {homepageContent.coreTools.map((tool) => (
              <article key={tool.name} className="flex min-h-48 flex-col rounded-2xl border border-ink/10 bg-white p-4">
                <h3 className="font-display text-2xl font-semibold">{tool.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-ink/55">{tool.description}</p>
                {tool.href.startsWith("#") ? (
                  <a href={tool.href} className="mt-4 rounded-xl bg-ink px-4 py-3 text-center text-xs font-extrabold text-white transition active:scale-[.98]">{tool.action} →</a>
                ) : (
                  <Link href={toolHref(tool)} className="mt-4 rounded-xl bg-ink px-4 py-3 text-center text-xs font-extrabold text-white transition active:scale-[.98]">{tool.action} →</Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 rounded-[1.75rem] border border-white/80 bg-white/55 p-5 shadow-card backdrop-blur sm:p-7 lg:grid-cols-[.8fr_1.2fr] lg:items-start" aria-labelledby="why-doughtools">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Why it works</p>
            <h2 id="why-doughtools" className="font-display text-3xl font-semibold">A practical pizza workspace, not just one recipe.</h2>
          </div>
          <ul className="grid gap-3">
            {homepageContent.trust.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-ink/60">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf text-[10px] font-extrabold text-white">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-ink/10 bg-cream/70 p-5 sm:p-7" aria-labelledby="discover-tools">
          <h2 id="discover-tools" className="font-display text-2xl font-semibold">Explore the rest of the workshop</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {homepageContent.secondaryTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink">{tool.name}</Link>
            ))}
          </div>
        </section>

        <section id="my-recipes" className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7">
          <div className="flex items-center justify-between gap-4"><h2 className="font-display text-3xl font-semibold">{t.myRecipes}</h2><span className="grid h-8 min-w-8 place-items-center rounded-full bg-ink px-2 text-xs font-extrabold text-white">{savedRecipes.length}</span></div>
          {savedRecipes.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-sm text-ink/45">{t.noRecipes}</p> : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {savedRecipes.map((savedRecipe) => {
                const savedRecipeQuery = recipeParams(savedRecipe.settings).toString();
                const savedRecipeActions = [
                  { label: t.savedRecipePlanner, href: recipeWorkflowQueryHref("/plan", savedRecipeQuery) },
                  { label: t.savedRecipeSauce, href: recipeWorkflowQueryHref("/sauce", savedRecipeQuery) },
                  { label: t.savedRecipeToppings, href: recipeWorkflowQueryHref("/toppings", savedRecipeQuery) },
                  { label: t.savedRecipeTimer, href: recipeWorkflowQueryHref("/timer", savedRecipeQuery) },
                  { label: t.savedRecipeDoctor, href: recipeWorkflowQueryHref("/doctor", savedRecipeQuery) },
                  { label: t.savedRecipeJournal, href: recipeWorkflowQueryHref("/journal", savedRecipeQuery) },
                ];

                return (
                <article key={savedRecipe.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                  <div className="relative aspect-[2/1] bg-ink/5"><Image src={pizzaStyleById(savedRecipe.settings.pizzaStyleId, savedRecipe.settings.goal).image} alt={pizzaStyleById(savedRecipe.settings.pizzaStyleId, savedRecipe.settings.goal).nameEn} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover"/><span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-extrabold text-white">{pizzaStyleById(savedRecipe.settings.pizzaStyleId, savedRecipe.settings.goal).nameEn}</span></div>
                  <div className="p-4">
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">{savedRecipe.name}</h3><p className="mt-1 text-[10px] font-semibold text-ink/40">{t.savedOn} {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(savedRecipe.createdAt))}</p></div><span className="rounded-full bg-tomato/10 px-2.5 py-1 text-xs font-extrabold text-tomato">{Math.round(savedRecipe.ingredients.total)} g</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"><span className="text-ink/45">{t.pizzas}</span><strong className="text-right">{savedRecipe.settings.pizzas} × {savedRecipe.settings.ballWeight} g</strong><span className="text-ink/45">{t.hydration}</span><strong className="text-right">{savedRecipe.settings.hydration} %</strong><span className="text-ink/45">{t.fermentation}</span><strong className="text-right">{t.ferment[savedRecipe.settings.fermentation][0]}</strong><span className="text-ink/45">{t.flourChoice}</span><strong className="truncate text-right">{flourById(savedRecipe.settings.flourId ?? "caputo-pizzeria").brand} {flourById(savedRecipe.settings.flourId ?? "caputo-pizzeria").name}</strong><span className="text-ink/45">{t.yeastType}</span><strong className="truncate text-right">{t.yeasts[savedRecipe.settings.yeastType][1]}</strong></div>
                  <p className="mt-4 rounded-xl bg-cream/70 p-3 text-[11px] leading-5 text-ink/55">{t.savedRecipeLocal}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => openSavedRecipe(savedRecipe)} className="rounded-xl bg-ink px-3 py-2.5 text-xs font-bold text-white">{t.openRecipe}</button><button type="button" onClick={() => deleteSavedRecipe(savedRecipe.id)} className="rounded-xl border border-tomato/20 px-3 py-2.5 text-xs font-bold text-tomato">{t.deleteRecipe}</button></div>
                  <div className="mt-4 border-t border-ink/10 pt-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/35">{t.savedRecipeNextActions}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {savedRecipeActions.map((action) => (
                        <Link key={action.href} href={action.href} className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-center text-[11px] font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                          {action.label} →
                        </Link>
                      ))}
                    </div>
                  </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <div className="flex flex-col gap-3 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between"><p>{t.footer}</p><Link href="/guide" className="font-bold text-tomato sm:hidden">{t.guide} →</Link><p>{t.bakers}</p></div>
          <div className="mt-4 border-t border-ink/5 pt-4"><AppSignature /></div>
        </footer>
        </>
        )}
      </div>
    </main>
  );
}

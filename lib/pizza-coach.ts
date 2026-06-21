import type { FlourProfile } from "@/lib/flours";
import type { Fermentation, RecipeSettings } from "@/lib/saved-recipes";

export type CoachLocale = "fi" | "en";
export type CoachGoal = "airy" | "crispy" | "easy" | "flavor";
export type CoachIssue = "none" | "sticky" | "dense" | "tears" | "pale" | "soggy" | "burnt";
export type CoachAction = { title: string; body: string; priority: "now" | "next" | "watch" };

const hours: Record<Fermentation, number> = { "6h-room": 6, "12h-room": 12, "24h-room": 24, "24h-cold": 24, "48h-cold": 48 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function buildCoachAdvice(locale: CoachLocale, settings: RecipeSettings, flour: FlourProfile, goal: CoachGoal, issue: CoachIssue) {
  const fi = locale === "fi";
  const recommended: RecipeSettings = { ...settings };
  const actions: CoachAction[] = [];
  const warnings: string[] = [];
  const add = (titleFi: string, titleEn: string, bodyFi: string, bodyEn: string, priority: CoachAction["priority"] = "next") => actions.push({ title: fi ? titleFi : titleEn, body: fi ? bodyFi : bodyEn, priority });
  const flourName = `${flour.brand} ${flour.name}`;
  const selectedHours = hours[settings.fermentation];

  if (settings.hydration < flour.hydration[0] || settings.hydration > flour.hydration[1]) {
    warnings.push(fi ? `${settings.hydration} % hydraatio on jauhon ${flourName} suositusalueen ${flour.hydration[0]}–${flour.hydration[1]} % ulkopuolella.` : `${settings.hydration}% hydration is outside the ${flour.hydration[0]}–${flour.hydration[1]}% range suggested for ${flourName}.`);
  }
  if (selectedHours < flour.fermentationHours[0] || selectedHours > flour.fermentationHours[1]) {
    warnings.push(fi ? `${selectedHours} tunnin kohotus ei osu jauhon arvioituun ${flour.fermentationHours[0]}–${flour.fermentationHours[1]} tunnin alueeseen.` : `${selectedHours} hours falls outside the flour's estimated ${flour.fermentationHours[0]}–${flour.fermentationHours[1]} hour range.`);
  }

  if (goal === "airy") {
    recommended.hydration = clamp(Math.max(settings.hydration, flour.recommendedHydration), flour.hydration[0], flour.hydration[1]);
    add("Suojele reunaan jäävä kaasu", "Protect the gas in the rim", "Avaa pallo keskeltä ulospäin ja jätä 1–2 cm reunus koskematta. Älä käytä kaulinta.", "Open from the centre outward and leave a 1–2 cm rim untouched. Do not use a rolling pin.", "now");
    add("Nosta vettä vain jauhon rajoissa", "Raise water only within the flour's range", `Kokeile ${recommended.hydration} % hydraatiota. Lisää loppuvesi vähitellen vasta, kun taikinassa on jo sitkoa.`, `Try ${recommended.hydration}% hydration. Add the final water gradually after the dough has developed strength.`);
    add("Anna pallojen lämmetä", "Let the dough balls warm", "Kylmäkohotuksen jälkeen pallon pitäisi olla rento ja hieman ilmava ennen avaamista. Varaa yleensä 2–4 tuntia huoneen lämmöstä riippuen.", "After cold fermentation, the ball should feel relaxed and slightly airy before opening. Usually allow 2–4 hours depending on room temperature.", "watch");
  } else if (goal === "crispy") {
    recommended.hydration = clamp(settings.hydration - 2, flour.hydration[0], flour.hydration[1]);
    recommended.ballWeight = Math.max(200, settings.ballWeight - 20);
    add("Tee ohuempi keskusta", "Build a thinner centre", `Kokeile ${recommended.ballWeight} g palloa ja avaa keskusta tasaisesti. Liian paksu keskusta pitää kosteuden sisällä.`, `Try a ${recommended.ballWeight} g ball and open the centre evenly. A thick centre traps moisture.`, "now");
    add("Vähennä vettä maltillisesti", "Reduce water gently", `Laske hydraatio noin ${recommended.hydration} prosenttiin. Pieni muutos auttaa rapeudessa ilman että taikinasta tulee kova.`, `Lower hydration to about ${recommended.hydration}%. A small change helps crispness without making the dough hard.`);
    add("Kuivaa täytteet", "Control topping moisture", "Valuta mozzarella, käytä kastiketta ohuesti ja vältä täytteiden kasaamista keskustaan.", "Drain mozzarella, spread sauce thinly and avoid piling toppings in the centre.", "watch");
  } else if (goal === "easy") {
    recommended.hydration = clamp(Math.min(settings.hydration, flour.recommendedHydration), flour.hydration[0], flour.hydration[1]);
    recommended.fermentation = flour.recommendedFermentation;
    add("Valitse jauhon keskialue", "Use the middle of the flour's range", `${recommended.hydration} % hydraatio on jauholle ${flourName} hallittava lähtökohta.`, `${recommended.hydration}% hydration is a manageable starting point for ${flourName}.`, "now");
    add("Käytä ennustettavaa aikataulua", "Use a predictable schedule", `${recommended.fermentation.replaceAll("-", " ")} sopii tämän jauhon profiiliin. Pidä lämpötila mitattuna.`, `${recommended.fermentation.replaceAll("-", " ")} suits this flour profile. Measure the actual temperature.`);
    add("Harjoittele yhdellä muutoksella", "Practise one change at a time", "Pidä jauho, pallopaino ja uuni samoina kolme paistokertaa. Muuta vain yhtä asiaa ja kirjaa tulos päiväkirjaan.", "Keep flour, ball weight and oven unchanged for three bakes. Change one variable and record it in the journal.", "watch");
  } else {
    recommended.fermentation = flour.fermentationHours[1] >= 48 ? "48h-cold" : flour.recommendedFermentation;
    add("Anna ajan tehdä maku", "Let time build flavour", `Kokeile ${recommended.fermentation.replaceAll("-", " ")} -kohotusta ja pidä jääkaappi todella noin 4 °C:ssa.`, `Try ${recommended.fermentation.replaceAll("-", " ")} fermentation and keep the fridge genuinely near 4°C.`, "now");
    add("Älä lisää hiivaa maun vuoksi", "Do not add yeast for flavour", "Pidempi aika tarvitsee yleensä vähemmän hiivaa, ei enemmän. Liika hiiva voi tehdä mausta terävän ja rakenteesta heikon.", "Longer time usually needs less yeast, not more. Excess yeast can make flavour harsh and structure weak.");
    add("Paahda, älä polta", "Toast, do not scorch", "Anna reunaan tummaa paahteisuutta, mutta käännä pizzaa ennen kuin yksi kohta hiiltyy katkeraksi.", "Allow dark toasted notes on the rim, but turn before one area chars bitter.", "watch");
  }

  if (issue === "sticky") { recommended.hydration = clamp(recommended.hydration - 2, flour.hydration[0], flour.hydration[1]); add("Tahmeus: jäähdytä ja vahvista", "Sticky dough: cool and strengthen", "Tee yksi taittelukierros märin käsin, anna levätä 20 minuuttia ja vältä ylimääräisen jauhon vaivaamista taikinaan.", "Make one fold with wet hands, rest 20 minutes and avoid kneading extra flour into the dough.", "now"); }
  if (issue === "dense") add("Tiivis reuna: tarkista kypsyys", "Dense rim: check proofing", "Paina palloa kevyesti: hitaasti osittain palautuva painauma on hyvä merkki. Täysin kimmoisa pallo tarvitsee usein lisää aikaa.", "Press the ball lightly: an indentation that returns slowly and partly is a good sign. A very springy ball often needs more time.", "now");
  if (issue === "tears") { recommended.hydration = clamp(recommended.hydration - 2, flour.hydration[0], flour.hydration[1]); add("Repeily: anna sitkolle lepo", "Tearing: rest the gluten", "Peitä taikina ja odota 15–20 minuuttia ennen uutta venytystä. Jos ongelma toistuu, vähennä vettä tai lyhennä kohotusta.", "Cover and wait 15–20 minutes before stretching again. If it repeats, lower water or shorten fermentation.", "now"); }
  if (issue === "pale") add("Vaalea pinta: lisää ylälämpöä", "Pale top: increase top heat", "Esilämmitä uuni ja kivi täysin. Kaasuuunissa nosta liekkiä juuri ennen pizzaa; kotiuunissa käytä grillivastusta hallitusti.", "Fully preheat oven and stone. In gas, raise the flame just before launch; at home, use the broiler carefully.", "now");
  if (issue === "soggy") add("Vetinen keskusta: vähennä kosteutta", "Soggy centre: reduce moisture", "Valuta juusto, vähennä kastiketta 10–20 g pizzaa kohti ja jätä märät täytteet vähemmälle.", "Drain cheese, reduce sauce by 10–20 g per pizza and use fewer wet toppings.", "now");
  if (issue === "burnt") add("Palaminen: tasaa tuli ja pohja", "Burning: balance flame and floor", "Mittaa kivi ennen paistoa, pienennä liekkiä pizzan noston jälkeen ja käännä useammin pienin liikkein.", "Measure the floor before launch, lower the flame after launching and turn more often in small movements.", "now");

  const unique = actions.filter((action, index, all) => all.findIndex(item => item.title === action.title) === index).slice(0, 4);
  return {
    summary: fi ? `Valmentajan lähtökohta: ${settings.pizzas} × ${settings.ballWeight} g, ${settings.hydration} % hydraatio, ${flourName} ja ${settings.ovenType === "gas" ? "kaasupizzauuni" : "keittiöuuni"}.` : `Coach starting point: ${settings.pizzas} × ${settings.ballWeight} g, ${settings.hydration}% hydration, ${flourName}, and a ${settings.ovenType === "gas" ? "gas pizza oven" : "home oven"}.`,
    actions: unique, warnings, recommended,
  };
}

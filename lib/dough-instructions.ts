import type { FlourProfile } from "@/lib/flours";
import type { Fermentation, PizzaGoal, RecipeSettings, YeastType } from "@/lib/saved-recipes";

export type InstructionLocale = "fi" | "sv" | "en";

export type DoughInstruction = {
  id: string;
  title: string;
  timing: string;
  description: string;
};

type InstructionInput = {
  locale: InstructionLocale;
  settings: RecipeSettings;
  flour: FlourProfile;
  bake: { temperature: number; time: string };
};

const yeastDirections: Record<InstructionLocale, Record<YeastType, string>> = {
  fi: {
    cy: "Liuota tuorehiiva osaan vedestä.",
    ady: "Aktivoi aktiivikuivahiiva pakkauksen ohjeen mukaan pienessä osassa vedestä.",
    idy: "Sekoita pikakuivahiiva tasaisesti jauhoihin.",
    ssd: "Käytä huipussaan olevaa jäykkää juurta ja revi se pieniksi paloiksi veteen.",
    lsd: "Käytä aktiivista, huipussaan olevaa nestemäistä juurta ja sekoita se veteen.",
  },
  en: {
    cy: "Dissolve the fresh yeast in part of the water.",
    ady: "Activate the active dry yeast in a small portion of water according to its package directions.",
    idy: "Distribute the instant dry yeast evenly through the flour.",
    ssd: "Use stiff starter at peak activity and tear it into small pieces in the water.",
    lsd: "Use liquid starter at peak activity and mix it into the water.",
  },
  sv: {
    cy: "Lös upp färsk jäst i en del av vattnet.",
    ady: "Aktivera torrjästen i en liten del av vattnet enligt anvisningen på förpackningen.",
    idy: "Fördela snabbtorrjästen jämnt i mjölet.",
    ssd: "Använd fast surdeg vid maximal aktivitet och riv den i små bitar i vattnet.",
    lsd: "Använd aktiv flytande surdeg vid maximal aktivitet och blanda den i vattnet.",
  },
};

const fermentationPlan: Record<Fermentation, { bulk: string; final: string; cold?: string; warm?: string }> = {
  "6h-room": { bulk: "3–3.5 h", final: "2 h" },
  "12h-room": { bulk: "8 h", final: "3 h" },
  "24h-room": { bulk: "18 h", final: "5 h" },
  "24h-cold": { bulk: "1 h", cold: "19–21 h", warm: "2–3 h", final: "" },
  "48h-cold": { bulk: "1 h", cold: "43–45 h", warm: "2–3 h", final: "" },
};

const styleFinish: Record<InstructionLocale, Record<PizzaGoal, string>> = {
  fi: {
    balanced: "Avaa pallo keskeltä ulospäin ja jätä reunaan ilmaa. Älä käytä kaulinta.",
    airy: "Käsittele taikinaa erityisen hellästi ja säilytä reunaan kertynyt kaasu.",
    crispy: "Avaa taikina tavallista ohuemmaksi. Kevyt kaulinta on mahdollinen, jos tavoitteena on hyvin matala ja rapea pohja.",
    pan: "Öljyä pannu, levitä taikina siihen varovasti ja anna sen rentoutua ennen lopullista venytystä.",
  },
  en: {
    balanced: "Open the ball from the centre outwards and preserve air in the rim. Do not use a rolling pin.",
    airy: "Handle the dough very gently and preserve the gas collected in the rim.",
    crispy: "Open the dough thinner than usual. A light rolling pin is possible when the goal is a very low, crisp base.",
    pan: "Oil the pan, ease the dough into it, and let it relax before the final stretch.",
  },
  sv: {
    balanced: "Öppna bollen från mitten utåt och bevara luften i kanten. Använd inte kavel.",
    airy: "Hantera degen mycket varsamt och bevara gasen som samlats i kanten.",
    crispy: "Öppna degen tunnare än vanligt. En lätt kavel kan användas för en mycket låg och krispig botten.",
    pan: "Olja formen, bred försiktigt ut degen och låt den slappna av före den sista sträckningen.",
  },
};

export function buildDoughInstructions({ locale, settings, flour, bake }: InstructionInput) {
  const fi = locale === "fi";
  const plan = fermentationPlan[settings.fermentation];
  const cold = settings.fermentation.endsWith("cold");
  const highHydration = settings.hydration >= 70;
  const warnings: string[] = [];

  if (settings.hydration < flour.hydration[0] || settings.hydration > flour.hydration[1]) {
    warnings.push(fi
      ? `${settings.hydration} % hydraatio on jauhon suositusalueen ${flour.hydration[0]}–${flour.hydration[1]} % ulkopuolella.`
      : `${settings.hydration}% hydration is outside this flour’s suggested ${flour.hydration[0]}–${flour.hydration[1]}% range.`);
  }
  const selectedHours = Number(settings.fermentation.match(/^\d+/)?.[0] ?? 0);
  if (selectedHours < flour.fermentationHours[0] || selectedHours > flour.fermentationHours[1]) {
    warnings.push(fi
      ? `${selectedHours} tunnin kohotus on jauhon suositusalueen ${flour.fermentationHours[0]}–${flour.fermentationHours[1]} h ulkopuolella.`
      : `${selectedHours} hours is outside this flour’s suggested ${flour.fermentationHours[0]}–${flour.fermentationHours[1]} h fermentation range.`);
  }

  const steps: DoughInstruction[] = [
    {
      id: "prepare",
      title: fi ? "Valmistele ja punnitse" : "Prepare and weigh",
      timing: fi ? "Aloitus" : "Start",
      description: fi
        ? `Punnitse kaikki ainekset tarkasti. Käytät jauhoa ${flour.brand} ${flour.name} (${flour.strength}). ${yeastDirections.fi[settings.yeastType]}`
        : `Weigh every ingredient accurately. You are using ${flour.brand} ${flour.name} (${flour.strength}). ${yeastDirections.en[settings.yeastType]}`,
    },
    {
      id: "mix",
      title: fi ? "Sekoita taikina" : "Mix the dough",
      timing: "5–8 min",
      description: highHydration
        ? (fi ? "Lisää aluksi noin 90–95 % vedestä. Sekoita kuivien kohtien katoamiseen ja säästä loppuvesi myöhemmin lisättäväksi." : "Start with about 90–95% of the water. Mix until no dry flour remains and reserve the rest for later addition.")
        : (fi ? "Yhdistä jauhot ja vesi tasaiseksi, karkeaksi taikinaksi. Älä tavoittele vielä täysin sileää rakennetta." : "Combine flour and water into an even, rough dough. Do not chase a completely smooth texture yet."),
    },
    {
      id: "rest",
      title: fi ? "Lepuuta" : "Rest",
      timing: highHydration ? "25–30 min" : "15–20 min",
      description: fi ? "Peitä taikina. Lyhyt lepo auttaa jauhoa sitomaan veden ja tekee vaivaamisesta helpompaa." : "Cover the dough. This short rest helps the flour absorb water and makes kneading easier.",
    },
    {
      id: "knead",
      title: fi ? "Lisää suola ja vaivaa" : "Add salt and knead",
      timing: highHydration ? "8–12 min" : "6–10 min",
      description: highHydration
        ? (fi ? "Lisää suola ja loppuvesi vähitellen. Tee 2–3 venytys- ja taittokierrosta 15 minuutin välein, kunnes taikina vahvistuu." : "Add salt and the reserved water gradually. Make 2–3 stretch-and-fold rounds at 15-minute intervals until the dough gains strength.")
        : (fi ? "Lisää suola ja vaivaa, kunnes taikina on yhtenäinen, joustava ja pinnaltaan melko sileä." : "Add salt and knead until the dough is cohesive, elastic and reasonably smooth."),
    },
    {
      id: "bulk",
      title: fi ? "Esikohota yhtenä massana" : "Bulk ferment",
      timing: plan.bulk,
      description: fi
        ? `Peitä astia ja kohota noin ${cold ? "22" : settings.temperature} °C:ssa. Tavoittele selvästi elävämpää ja hieman kasvanutta taikinaa, älä välttämättä kaksinkertaista tilavuutta.`
        : `Cover and ferment at about ${cold ? "22" : settings.temperature}°C. Look for dough that is clearly livelier and somewhat expanded, not necessarily doubled.`,
    },
    {
      id: "ball",
      title: fi ? "Jaa ja pallota" : "Divide and ball",
      timing: fi ? `${settings.pizzas} × ${settings.ballWeight} g` : `${settings.pizzas} × ${settings.ballWeight} g`,
      description: fi ? "Jaa taikina tasakokoisiksi paloiksi ja kiristä sileiksi palloiksi repimättä pintaa. Laita pallot kannellisiin rasioihin." : "Divide evenly and tighten into smooth balls without tearing the surface. Place the balls in covered containers.",
    },
  ];

  if (cold) {
    steps.push({
      id: "cold",
      title: fi ? "Kylmäkohota" : "Cold ferment",
      timing: plan.cold!,
      description: fi ? "Siirrä pallot 4 °C:n jääkaappiin. Jätä rasioihin hieman kasvutilaa ja pidä ne peitettyinä kuivumisen estämiseksi." : "Move the balls to a 4°C refrigerator. Leave room for expansion and keep the containers covered to prevent drying.",
    });
    steps.push({
      id: "warm",
      title: fi ? "Ota taikina lämpenemään" : "Warm the dough",
      timing: fi ? `${plan.warm} ennen paistoa` : `${plan.warm} before baking`,
      description: fi ? "Pidä pallot peitettyinä huoneenlämmössä. Ne ovat valmiita, kun taikina on rento, ilmava ja avautuu ilman voimakasta palautumista." : "Keep the balls covered at room temperature. They are ready when relaxed, airy and able to open without springing back strongly.",
    });
  } else {
    steps.push({
      id: "final",
      title: fi ? "Loppukohota palloina" : "Final proof as balls",
      timing: plan.final,
      description: fi ? `Kohota peitettynä noin ${settings.temperature} °C:ssa. Seuraa taikinaa kellon lisäksi: valmiin pallon pinta on elävä ja painauma palautuu hitaasti.` : `Proof covered at about ${settings.temperature}°C. Watch the dough as well as the clock: a ready ball looks lively and an indentation returns slowly.`,
    });
  }

  steps.push({
    id: "bake",
    title: fi ? "Avaa, täytä ja paista" : "Open, top and bake",
    timing: `${bake.temperature} °C · ${bake.time}`,
    description: `${styleFinish[locale][settings.goal]} ${settings.ovenType === "home"
      ? (fi ? "Esilämmitä kivi tai teräs 45–60 minuuttia ja käytä uunin ylintä mahdollista lämpöä." : "Preheat the stone or steel for 45–60 minutes and use the oven’s highest practical heat.")
      : (fi ? "Kuumenna paistokivi täysin, käännä pizzaa paiston aikana ja säädä liekkiä pohjan mukaan." : "Heat the stone fully, turn the pizza during baking, and adjust the flame according to the base.")}`,
  });

  if (locale === "sv") {
    const swedish: Record<string, { title: string; description: string }> = {
      prepare: { title: "Förbered och väg", description: `Väg alla ingredienser noggrant. Du använder ${flour.brand} ${flour.name} (${flour.strength}). ${yeastDirections.sv[settings.yeastType]}` },
      mix: { title: "Blanda degen", description: highHydration ? "Börja med cirka 90–95 % av vattnet. Blanda tills inget torrt mjöl finns kvar och spara resten till senare." : "Blanda mjöl och vatten till en jämn, grov deg. Försök inte få den helt slät ännu." },
      rest: { title: "Låt vila", description: "Täck degen. Den korta vilan hjälper mjölet att ta upp vatten och gör knådningen lättare." },
      knead: { title: "Tillsätt salt och knåda", description: highHydration ? "Tillsätt salt och resten av vattnet gradvis. Gör 2–3 sträck- och vikomgångar med 15 minuters mellanrum." : "Tillsätt salt och knåda tills degen är sammanhängande, elastisk och ganska slät." },
      bulk: { title: "Jäs degen i en massa", description: `Täck behållaren och jäs vid cirka ${cold ? "22" : settings.temperature} °C. Degen ska bli tydligt livligare och något större, men behöver inte fördubblas.` },
      ball: { title: "Dela och forma bollar", description: "Dela degen jämnt och spänn till släta bollar utan att riva ytan. Lägg bollarna i behållare med lock." },
      cold: { title: "Kalljäs", description: "Flytta bollarna till kylskåp vid 4 °C. Lämna plats för tillväxt och håll dem täckta så att de inte torkar." },
      warm: { title: "Låt degen bli varm", description: "Håll bollarna täckta i rumstemperatur. De är klara när de är avslappnade, luftiga och kan öppnas utan att fjädra tillbaka kraftigt." },
      final: { title: "Slutjäs som bollar", description: `Jäs täckt vid cirka ${settings.temperature} °C. En färdig boll ser levande ut och en lätt intryckning återgår långsamt.` },
      bake: { title: "Öppna, toppa och grädda", description: `${styleFinish.sv[settings.goal]} ${settings.ovenType === "home" ? "Förvärm sten eller stål i 45–60 minuter och använd ugnens högsta praktiska värme." : "Värm stenen helt, rotera pizzan under gräddningen och justera lågan efter botten."}` },
    };
    return { steps: steps.map(step => ({ ...step, ...swedish[step.id] })), warnings: warnings.map(warning => warning.replace("hydration is outside this flour’s suggested", "hydrering ligger utanför mjölets rekommenderade").replace("hours is outside this flour’s suggested", "timmar ligger utanför mjölets rekommenderade")) };
  }
  return { steps, warnings };
}

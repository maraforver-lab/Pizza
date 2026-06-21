"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";

type Locale = "en" | "fi";

const flourProducts = [
  { maker: "W 220–240", name: "Caputo Classica", image: "/flours/caputo-classica.png", source: "https://www.mulinocaputo.it/prodotti/classica-5kg/" },
  { maker: "W 260–280", name: "Caputo Pizzeria", image: "/flours/caputo-pizzeria.png", source: "https://www.mulinocaputo.it/prodotti/pizzeria/" },
  { maker: "W 270–290", name: "Caputo Nuvola", image: "/flours/caputo-nuvola.png", source: "https://www.mulinocaputo.it/prodotti/nuvola/" },
  { maker: "W 320–340", name: "Caputo Nuvola Super", image: "/flours/caputo-nuvola-super.png", source: "https://www.mulinocaputo.it/prodotti/nuvola-super-5kg/" },
  { maker: "W 360–380", name: "Caputo Manitoba Oro", image: "/flours/caputo-manitoba.png", source: "https://www.mulinocaputo.it/prodotti/manitoba-oro/" },
] as const;

const content = {
  fi: {
    back: "Takaisin laskuriin", eyebrow: "DoughTools-opas", title: "Ohjeet ja terminologia",
    intro: "Mitä luvut tarkoittavat, miten resepti lasketaan ja missä kohtaa tarvitaan leipurin omaa harkintaa.",
    nav: [["Perusteet", "basics"], ["Jauhot", "flours"], ["Asetukset", "settings"], ["Kohotteet", "leavening"], ["Tarkkuus", "accuracy"]],
    basicsTitle: "1. Taikinan perusteet", flourChapter: "2. Jauhot ja vahvuus", settingsChapter: "3. Asetusten yhteispeli", leaveningChapter: "4. Hiiva ja juuri", accuracyChapter: "5. Mitä laskuri tietää?",
    sections: [
      {
        title: "Leipurin prosentit",
        body: "Jauhojen kokonaismäärä on aina 100 %. Vesi, suola ja kohote ilmoitetaan prosentteina jauhojen painosta. Esimerkiksi 65 % hydraatio tarkoittaa 650 g vettä jokaista 1 000 g jauhoa kohti.",
      },
      {
        title: "Näin kokonaisresepti lasketaan",
        body: "Tavoiteltu taikinamäärä on pizzojen määrä × pallon paino × hävikkivara. Jauhomäärä ratkaistaan niin, että jauhot, vesi, suola ja kohote muodostavat yhdessä täsmälleen tavoitellun kokonaismassan. Juuren sisältämä jauho ja vesi vähennetään erikseen lisättävistä määristä.",
      },
      {
        title: "Aika ja lämpötila",
        body: "Lämpimämpi taikina käy nopeammin ja tarvitsee vähemmän kohotetta; kylmempi taikina käy hitaammin. Huonekohotuksessa lämpötilaa voi säätää. Kylmäkohotuksen valmiit asetukset käyttävät 4°C jääkaappilämpötilaa. Tulokset ovat lähtöarvoja, sillä myös jauho, taikinan lämpötila ja jääkaapin todellinen lämpö vaikuttavat.",
      },
    ],
    yeastTitle: "Kohotustavat",
    yeasts: [
      ["CY", "Tuore- eli puristehiiva", "Pehmeä, jääkaapissa säilytettävä leivinhiiva. Tunnetaan myös nimillä fresh yeast ja compressed yeast."],
      ["ADY", "Aktiivikuivahiiva", "Kuivahiiva, joka tavallisesti aktivoidaan nesteessä ennen käyttöä. Englanniksi Active Dry Yeast."],
      ["IDY", "Pikakuivahiiva", "Suoraan jauhoihin sekoitettava tehokas kuivahiiva. Englanniksi Instant Dry Yeast. Suomessa tavallinen kuivahiiva on usein tätä tyyppiä."],
      ["SSD", "Jäykkä juuri, 50 %", "Hapanjuuri, jossa on puolet vettä jauhojen painosta. Lyhenne ei ole yleismaailmallinen; Italiassa käytetään myös nimiä lievito madre ja pasta madre."],
      ["LSD", "Nestemäinen juuri, 100 %", "Hapanjuuri, jossa on yhtä paljon vettä ja jauhoa. Tunnetaan myös nimillä liquid starter, liquid levain ja licoli."],
    ],
    flourTitle: "Eurooppalaiset vehnäjauhot",
    flourIntro: "Pussin tyyppinumero ja jauhon vahvuus eivät ole sama asia. Tyyppi kertoo yleensä jauhatusasteesta tai mineraalipitoisuudesta; W-arvo kertoo paremmin, kuinka vahvan ja kaasua pidättävän taikinan jauho muodostaa.",
    productTitle: "Oikeita pizzajauhoja eri vahvuuksilla", productIntro: "Saman valmistajan pussit näyttävät selvästi, ettei Tipo 00 yksin kerro vahvuutta. W-arvo valitaan kohotusajan, hydraation ja tavoitellun rakenteen mukaan. Tuotteet ovat esimerkkejä, eivät sponsoreita.", productLink: "Valmistajan tiedot",
    productNotes: ["Lyhyelle kohotukselle ja maltilliselle hydraatiolle. Sopii parhaiten saman päivän, ohuempaan tai vähemmän märkään taikinaan.", "Klassisen napolilaisen yleisvahvuus: tasapainoinen sitko, noin 60–68 % hydraatio ja lyhyt tai keskipitkä kohotus.", "Ilmavaan, hyvin hydratoituun contemporary-tyyliin. Hieman Pizzeriaa vahvempi ja suunniteltu avoimempaan reunarakenteeseen.", "Vahva jauho korkeaan hydraatioon ja pitkään kohotukseen. Sopii ilmavaan pizzaan, kun W 270–290 ei enää riitä ajalle tai vesimäärälle.", "Erittäin vahva jauho hyvin pitkään fermentaatioon tai jauhoseoksen vahvistamiseen. Yksin käytettynä tavallinen pizza voi jäädä turhan sitkeäksi."],
    flours: [
      ["Italia", "Tipo 00 / 0", "00 on hyvin hienoksi jauhettu ja vähätuhkainen, mutta voi olla heikko tai vahva. Pizzaan tarkista lisäksi W-arvo ja mahdollinen P/L-arvo."],
      ["Ranska", "T45 / T55 / T65", "T-luku perustuu mineraali- eli tuhkapitoisuuteen. T55 on yleinen vaalea jauho; pussin proteiini- tai vahvuustieto ratkaisee pitkän pizzakohotuksen sopivuuden."],
      ["Saksa ja Itävalta", "405 / 550 / 1050", "Numero kertoo mineraalipitoisuudesta. Type 550 on usein leipä- ja pizzakäyttöön sopivampi kuin 405, mutta vahvuus vaihtelee valmistajittain."],
      ["Suomi", "Erikoisvehnä / puolikarkea", "Nimet kertovat käyttötavasta ja jauhatuksesta, eivät tarkkaa W-arvoa. Tarkista proteiinipitoisuus ja valmistajan suositus; pitkä tai hyvin märkä taikina tarvitsee yleensä vahvemman jauhon."],
      ["Espanja ja Britannia", "Harina de fuerza / strong bread flour", "Nimi viittaa vahvaan, runsasproteiiniseen jauhoon. Se sopii tavallisesti pitkään kohotukseen ja korkeampaan hydraatioon, mutta W-arvo on proteiinilukua tarkempi mittari."],
    ],
    strengthTitle: "Mitä W-vahvuus muuttaa?",
    strengths: [
      ["Alle W 220", "Lyhyt kohotus, yleensä noin 55–63 % hydraatio. Liian pitkä tai märkä taikina voi levitä ja menettää kaasunsa."],
      ["W 220–280", "Monipuolinen alue klassiselle pizzalle, noin 60–68 % hydraatiolle ja lyhyelle tai keskipitkälle kohotukselle."],
      ["W 280–340", "Pitkät 24–72 tunnin kohotukset ja noin 65–75 % hydraatio. Taikina kestää enemmän vettä ja fermentaatiota."],
      ["Yli W 340", "Erittäin vahva jauho tai sekoite hyvin pitkiin ja märkiin taikinoihin. Tavallisessa taikinassa lopputulos voi jäädä turhan sitkeäksi."],
    ],
    relationTitle: "Miten asetukset liittyvät toisiinsa?",
    relations: [
      ["Hydraatio + jauho", "Lisävesi voi tehdä reunasta avoimemman ja pehmeämmän, mutta vain jos jauho ja käsittely pitävät kaasun. Vahvempi jauho sietää yleensä enemmän vettä."],
      ["Aika + jauho", "Mitä pidempi kohotus, sitä vahvempi jauhokehikko yleensä tarvitaan. Liian heikko jauho hajoaa; tarpeettoman vahva jauho voi olla tiukka ja sitkeä."],
      ["Suola + taikina", "Noin 2,5–3,0 % suolaa tuo maun lisäksi rakennetta ja hidastaa käymistä. Suolaa ei kannata käyttää jauhon heikkouden varsinaisena korjauksena."],
      ["Pallopaino + koko", "Pallopaino määrää pizzan paksuutta yhdessä halkaisijan kanssa. Tässä sovelluksessa keskikoko tarkoittaa 30–32 cm: noin 250–280 g napolilaiseen, 280–330 g New York -tyyliin, 200–230 g ohueen ja 350–500 g pannupizzaan."],
      ["Uuni + tyyli", "400–500°C suosii nopeasti paistuvaa napolilaista ja kohtuullista hydraatiota. 250–300°C kotiuunissa pidempi paisto hyötyy usein hieman erilaisesta taikinasta; pannupizza kestää hyvin korkean hydraation."],
    ],
    setupTitle: "Esimerkkikokonaisuuksia keskikokoiselle pizzalle",
    setups: [
      ["Tasapainoinen kotiuuni", "270 g · 65 % · suola 2,8 % · W 260–300 · 24 h kylmä"],
      ["Erittäin ilmava kotiuuni", "280 g · 72 % · suola 2,8 % · W 300–340 · 48 h kylmä"],
      ["Klassinen kuuma pizzauuni", "260 g · 64 % · suola 2,8 % · W 250–290 · 12 h huone"],
      ["Ohut ja rapea", "230 g · 62 % · suola 2,6 % · W 240–280 · 48 h kylmä"],
      ["Ilmava 28 cm pannupizza", "450 g · 75 % · suola 2,8 % · W 300–350 · 48 h kylmä"],
    ],
    ovenTitle: "Ooni, Chef Matteo ja muut kaasupizzauunit",
    ovenIntro: "Merkki ei yksin määrää pallopainoa: ratkaisevia ovat tavoiteltu halkaisija ja pizzatyyli. Kuuma 400–500°C uuni vaikuttaa enemmän hydraatioon ja paistoaikaan kuin pallon kokoon.",
    ovens: [["12” / 30 cm", "250–260 g", "Hyvä keskikoko Ooni 12 -uuneihin ja kaikkiin suurempiin uuneihin."], ["14” / 35 cm", "noin 300 g", "Sopii 16-tuumaiseen Ooni- tai Chef Matteo -uuniin, kun haluat isomman pizzan."], ["16” / 40 cm", "noin 350 g", "Oonin oma lähtöpaino 16-tuumaiseen pizzaan; vaatii 16” paistopinnan kuten Chef Matteo Crosta 16."], ["Ohut 30–32 cm", "200–230 g", "Kun tavoite on matala ja rapea pizza tavallisen napolilaisen reunan sijaan."]],
    exactTitle: "Tarkka laskenta vai arvio?",
    exact: "Ainesmassojen ja leipurin prosenttien laskenta on tarkkaa matematiikkaa. Kohotteen määrä on käytännön arvio, joka perustuu valittuun aikaan, lämpötilaan ja kohotteen tyyppiin. Erityisesti hapanjuuren aktiivisuus vaihtelee, joten ensimmäistä paistoa kannattaa käyttää oman keittiön kalibrointiin.",
  },
  en: {
    back: "Back to calculator", eyebrow: "DoughTools guide", title: "Guide and glossary",
    intro: "What the numbers mean, how the recipe is calculated, and where a baker's judgement still matters.",
    nav: [["Basics", "basics"], ["Flours", "flours"], ["Settings", "settings"], ["Leavening", "leavening"], ["Accuracy", "accuracy"]],
    basicsTitle: "1. Dough basics", flourChapter: "2. Flour and strength", settingsChapter: "3. How settings interact", leaveningChapter: "4. Yeast and starter", accuracyChapter: "5. What does the calculator know?",
    sections: [
      { title: "Baker's percentages", body: "Total flour is always 100%. Water, salt and leavening are expressed as percentages of flour weight. For example, 65% hydration means 650 g of water for every 1,000 g of flour." },
      { title: "How the complete recipe is calculated", body: "Target dough equals pizza count × ball weight × waste allowance. Flour is solved so flour, water, salt and leavening add up to exactly the target mass. Flour and water already present in a sourdough starter are deducted from the amounts added separately." },
      { title: "Time and temperature", body: "Warmer dough ferments faster and needs less leavening; colder dough ferments more slowly. Room temperature can be adjusted. The cold-fermentation presets use a fixed refrigerator temperature of 4°C. Results are starting points because flour, actual dough temperature and refrigerator temperature also matter." },
    ],
    yeastTitle: "Leavening types",
    yeasts: [
      ["CY", "Compressed or fresh yeast", "Soft refrigerated baker's yeast, also known as cake yeast."],
      ["ADY", "Active Dry Yeast", "Dry yeast that is normally activated in liquid before use."],
      ["IDY", "Instant Dry Yeast", "Fast-acting dry yeast that can be mixed directly into flour."],
      ["SSD", "Stiff sourdough, 50%", "A starter containing half as much water as flour. SSD is not a universal abbreviation; lievito madre and pasta madre are also used."],
      ["LSD", "Liquid sourdough, 100%", "A starter containing equal weights of flour and water, also called liquid starter, liquid levain or licoli."],
    ],
    flourTitle: "European wheat flours",
    flourIntro: "A flour type number and flour strength are not the same thing. Type usually describes refinement or mineral content; the W value is a better guide to how strongly the dough can hold fermentation gas.",
    productTitle: "Real pizza flours at different strengths", productIntro: "Bags from one mill make it clear that Tipo 00 alone does not define strength. Choose W according to fermentation time, hydration and the intended structure. Products are examples, not sponsors.", productLink: "Manufacturer details",
    productNotes: ["For short fermentation and moderate hydration. Best suited to same-day, thinner or less hydrated dough.", "A classic Neapolitan all-round strength: balanced gluten, roughly 60–68% hydration, and short to medium fermentation.", "For airy, well-hydrated contemporary pizza. Slightly stronger than Pizzeria and designed for a more open rim structure.", "Strong flour for high hydration and long fermentation. Useful for airy pizza when W 270–290 no longer supports the time or water level.", "Very strong flour for extremely long fermentation or strengthening a flour blend. Used alone, it may make an ordinary pizza unnecessarily chewy."],
    flours: [
      ["Italy", "Tipo 00 / 0", "00 is finely milled and low in ash, but it can be weak or strong. For pizza, also check the W value and, when available, P/L."],
      ["France", "T45 / T55 / T65", "The T number is based on mineral or ash content. T55 is a common white flour; protein or strength information determines suitability for long pizza fermentation."],
      ["Germany and Austria", "405 / 550 / 1050", "The number describes mineral content. Type 550 is often more suitable for bread and pizza than 405, but strength still varies by mill."],
      ["Finland", "Erikoisvehnä / puolikarkea", "The names describe use and milling rather than an exact W value. Check protein and the mill's recommendation; long or wet dough normally needs stronger flour."],
      ["Spain and Britain", "Harina de fuerza / strong bread flour", "These names indicate strong, higher-protein flour. They are often suitable for long fermentation and more water, although W is more precise than protein alone."],
    ],
    strengthTitle: "What does W strength change?",
    strengths: [
      ["Below W 220", "Short fermentation and commonly about 55–63% hydration. Too much time or water can make the dough spread and lose gas."],
      ["W 220–280", "A versatile range for classic pizza, roughly 60–68% hydration, and short to medium fermentation."],
      ["W 280–340", "Long 24–72 hour fermentation and roughly 65–75% hydration. The dough tolerates more water and fermentation."],
      ["Above W 340", "Very strong flour or blends for extremely long and wet doughs. It may feel unnecessarily tight or chewy in an ordinary recipe."],
    ],
    relationTitle: "How do the settings work together?",
    relations: [
      ["Hydration + flour", "More water can create a softer, more open crust, but only when flour and handling retain the gas. Stronger flour generally tolerates more water."],
      ["Time + flour", "Longer fermentation generally needs a stronger gluten network. Weak flour can break down; unnecessarily strong flour may remain tight and chewy."],
      ["Salt + dough", "Around 2.5–3.0% salt adds structure and slows fermentation as well as adding flavour. Salt should not be used as the main fix for flour that is too weak."],
      ["Ball weight + size", "Ball weight controls thickness together with diameter. In this app, medium means 30–32 cm: about 250–280 g for Neapolitan, 280–330 g for New York, 200–230 g for thin crust, and 350–500 g for pan pizza."],
      ["Oven + style", "400–500°C suits fast-baked Neapolitan pizza with moderate hydration. A 250–300°C home oven bakes longer and often benefits from a different setup; pan pizza handles high hydration well."],
    ],
    setupTitle: "Example medium-pizza setups",
    setups: [
      ["Balanced home oven", "270 g · 65% · salt 2.8% · W 260–300 · 24h cold"],
      ["Very airy home oven", "280 g · 72% · salt 2.8% · W 300–340 · 48h cold"],
      ["Classic hot pizza oven", "260 g · 64% · salt 2.8% · W 250–290 · 12h room"],
      ["Thin and crispy", "230 g · 62% · salt 2.6% · W 240–280 · 48h cold"],
      ["Airy 28 cm pan pizza", "450 g · 75% · salt 2.8% · W 300–350 · 48h cold"],
    ],
    ovenTitle: "Ooni, Chef Matteo and other gas pizza ovens",
    ovenIntro: "Brand alone does not determine ball weight: target diameter and pizza style do. A hot 400–500°C oven affects hydration and baking time more than ball size.",
    ovens: [["12” / 30 cm", "250–260 g", "A good medium size for Ooni 12 ovens and every larger oven."], ["14” / 35 cm", "about 300 g", "Fits a 16-inch Ooni or Chef Matteo oven when you want a larger pizza."], ["16” / 40 cm", "about 350 g", "Ooni's own starting weight for a 16-inch pizza; requires a 16-inch cooking surface such as Chef Matteo Crosta 16."], ["Thin 30–32 cm", "200–230 g", "For a low, crisp pizza instead of a classic Neapolitan rim."]],
    exactTitle: "Exact calculation or estimate?",
    exact: "Ingredient masses and baker's percentages are exact mathematics. The amount of leavening is a practical estimate based on time, temperature and leavening type. Sourdough activity varies especially widely, so use the first bake to calibrate the calculator to your kitchen.",
  },
} as const;

export default function Guide() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = content[locale];

  useEffect(() => {
    const saved = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const detected: Locale = navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const nextLocale = saved === "fi" || saved === "en" ? saved : detected;
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("doughtools-locale", nextLocale);
    document.documentElement.lang = nextLocale;
  };

  return (
    <main className="guide-page min-h-screen px-4 py-5 sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-ink/65 transition hover:text-ink"><span aria-hidden="true">←</span>{t.back}</Link>
          <div className="flex rounded-full border border-ink/10 bg-white/80 p-1 shadow-sm backdrop-blur" aria-label="Language">
            {(["fi", "en"] as Locale[]).map((language) => <button key={language} type="button" onClick={() => changeLocale(language)} aria-pressed={locale === language} className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase transition ${locale === language ? "bg-ink text-white" : "text-ink/45"}`}>{language}</button>)}
          </div>
        </header>

        <section className="guide-hero relative mb-5 overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-xl">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-[#e8c98a]">{t.eyebrow}</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">{t.title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65 sm:text-base">{t.intro}</p>
          </div>
        </section>

        <nav className="sticky top-2 z-20 -mx-1 mb-10 overflow-x-auto rounded-2xl border border-white/80 bg-cream/90 p-1.5 shadow-lg shadow-ink/5 backdrop-blur" aria-label="Guide chapters">
          <div className="flex min-w-max gap-1">
            {t.nav.map(([label, id], index) => <a key={id} href={`#${id}`} className="rounded-xl px-3 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink"><span className="mr-1 text-tomato">{index + 1}.</span>{label}</a>)}
          </div>
        </nav>

        <section id="basics" className="scroll-mt-20">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{t.basicsTitle}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {t.sections.map((section, index) => <article key={section.title} className="rounded-3xl border border-white/90 bg-white/80 p-5 shadow-card backdrop-blur"><span className="mb-4 grid h-8 w-8 place-items-center rounded-full bg-leaf/10 text-xs font-extrabold text-leaf">{index + 1}</span><h2 className="font-display text-xl font-semibold">{section.title}</h2><p className="mt-3 text-sm leading-6 text-ink/60">{section.body}</p></article>)}
          </div>
        </section>

        <section id="flours" className="scroll-mt-20 pt-12">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{t.flourChapter}</p>
          <div className="rounded-[1.75rem] border border-white/90 bg-white/85 p-5 shadow-card backdrop-blur sm:p-7">
            <h2 className="font-display text-3xl font-semibold">{t.flourTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">{t.flourIntro}</p>
            <div className="mt-5 divide-y divide-ink/10">
              {t.flours.map(([region, types, description]) => <article key={region} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[10rem_10rem_1fr] sm:gap-4"><strong className="text-sm">{region}</strong><span className="text-sm font-bold text-tomato">{types}</span><p className="text-sm leading-6 text-ink/55">{description}</p></article>)}
            </div>
          </div>
          <div className="mt-8">
            <h2 className="font-display text-3xl font-semibold">{t.productTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">{t.productIntro}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flourProducts.map((product, index) => (
                <article key={product.maker} className="group overflow-hidden rounded-3xl border border-white/90 bg-white/85 shadow-card backdrop-blur">
                  <div className="relative h-56 bg-[#eee9dd] p-4">
                    <Image src={product.image} alt={`${product.maker} ${product.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]" />
                    <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">{product.maker}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold">{product.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-ink/55">{t.productNotes[index]}</p>
                    <a href={product.source} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-tomato transition hover:text-ink">{t.productLink} <span aria-hidden="true">↗</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <h2 className="mt-8 font-display text-3xl font-semibold">{t.strengthTitle}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {t.strengths.map(([range, description], index) => <article key={range} className="rounded-3xl border border-leaf/15 bg-[#edf0e8]/90 p-5"><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#b8a66b", "#7e9a72", "#54745a", "#334a38"][index] }} /><strong className="text-sm text-leaf">{range}</strong></div><p className="mt-2 text-sm leading-6 text-ink/60">{description}</p></article>)}
          </div>
        </section>

        <section id="settings" className="scroll-mt-20 pt-12">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{t.settingsChapter}</p>
          <div className="rounded-[1.75rem] bg-[#e8dfca]/95 p-5 shadow-card sm:p-7">
            <h2 className="font-display text-3xl font-semibold">{t.relationTitle}</h2>
            <div className="mt-5 grid gap-x-7 gap-y-5 sm:grid-cols-2">
              {t.relations.map(([title, description], index) => <article key={title} className="border-l-2 border-tomato/30 pl-4"><span className="text-[10px] font-extrabold text-tomato">0{index + 1}</span><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-ink/60">{description}</p></article>)}
            </div>
          </div>
          <h2 className="mt-8 font-display text-3xl font-semibold">{t.setupTitle}</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-ink/10 bg-white/85 shadow-card">
            {t.setups.map(([name, setup]) => <div key={name} className="grid gap-1 border-b border-ink/10 px-5 py-4 last:border-0 sm:grid-cols-[15rem_1fr]"><strong className="text-sm">{name}</strong><span className="text-sm text-ink/55">{setup}</span></div>)}
          </div>
          <div className="mt-8 rounded-[1.75rem] border border-tomato/15 bg-[#fff7ed]/90 p-5 shadow-card sm:p-7">
            <h2 className="font-display text-3xl font-semibold">{t.ovenTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">{t.ovenIntro}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.ovens.map(([size, weight, description]) => <article key={size} className="rounded-2xl bg-white/80 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{size}</strong><span className="rounded-full bg-tomato/10 px-2.5 py-1 text-xs font-extrabold text-tomato">{weight}</span></div><p className="mt-2 text-xs leading-5 text-ink/55">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="leavening" className="scroll-mt-20 pt-12">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{t.leaveningChapter}</p>
          <div className="rounded-[1.75rem] bg-ink p-5 text-white shadow-card sm:p-7">
            <h2 className="font-display text-3xl font-semibold">{t.yeastTitle}</h2>
            <div className="mt-5 divide-y divide-white/10">
              {t.yeasts.map(([code, name, description]) => <article key={code} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[4rem_13rem_1fr] sm:items-start"><span className="w-fit rounded-lg bg-tomato px-2 py-1 text-xs font-extrabold">{code}</span><h3 className="font-bold">{name}</h3><p className="text-sm leading-6 text-white/55">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="accuracy" className="scroll-mt-20 py-12">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{t.accuracyChapter}</p>
          <div className="rounded-3xl border border-tomato/20 bg-[#fff7ed]/90 p-5 shadow-card sm:p-7"><h2 className="font-display text-2xl font-semibold">{t.exactTitle}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">{t.exact}</p></div>
        </section>
        <footer className="mb-4 border-t border-ink/10 pt-5"><AppSignature locale={locale} /></footer>
      </div>
    </main>
  );
}

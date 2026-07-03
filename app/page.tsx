import Link from "next/link";
import Image from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry";

  return "full";
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f2e6d6] text-ink">
      <section
        className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-5 pb-8 pt-10 sm:px-8 sm:pb-12 sm:pt-12 lg:px-10 lg:pb-8 lg:pt-14"
        aria-labelledby="homepage-hero-heading"
      >
        {/* Patch 103: supplied Image 3 is the desktop background asset. */}
        <Image
          src="/images/homepage/hero-desktop-bg.png"
          alt="Pizza with basil, mozzarella and tomato sauce on a flour-dusted table"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 hidden object-cover object-[54%_center] md:block"
        />
        {/* Patch 103: supplied Image 4 is the mobile background asset. */}
        <Image
          src="/images/homepage/hero-mobile-bg.png"
          alt="Pizza with basil, mozzarella and tomato sauce on a flour-dusted table"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-[center_bottom] md:hidden"
        />
        <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(246,238,224,0.98)_0%,rgba(246,238,224,0.88)_31%,rgba(246,238,224,0.28)_56%,rgba(246,238,224,0)_78%)] md:block" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(246,238,224,0.98)_0%,rgba(246,238,224,0.88)_36%,rgba(246,238,224,0.34)_64%,rgba(246,238,224,0.72)_100%)] md:hidden" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#f2e6d6] to-transparent" />

        <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-[92rem] flex-col justify-between gap-8 lg:relative lg:min-h-[calc(100vh-8rem)]">
          <div className="max-w-[44rem] pt-4 sm:pt-8 lg:pt-12">
            <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
              {homepageContent.hero.eyebrow}
            </p>
            <h1 id="homepage-hero-heading" className="mt-5 max-w-[44rem] font-display text-[clamp(3rem,13vw,4.25rem)] font-semibold leading-[.9] tracking-[-.035em] text-ink sm:text-7xl lg:text-[5.5rem] xl:text-[5.9rem] 2xl:text-[6.5rem]">
              {homepageContent.hero.h1}
            </h1>
            <p className="mt-6 max-w-[20.5rem] text-base leading-7 text-ink/75 sm:max-w-xl sm:text-xl sm:leading-8">
              {homepageContent.hero.intro}
            </p>
            <div className="mt-7 max-w-[21rem] sm:max-w-none">
              <Link
                href={homepageContent.hero.primaryCta.href}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
              >
                {homepageContent.hero.primaryCta.label} →
              </Link>
            </div>
            <p className="mt-4 max-w-[20.5rem] text-xs leading-5 text-ink/45 sm:max-w-sm">
              Your session is saved locally in this browser/device. No cloud sync. No tracking.
            </p>

            <div className="mt-7 max-w-3xl sm:mt-8 lg:mt-10 lg:w-[39rem]">
              <HomepageGuidanceLevelSection />
            </div>
          </div>

          <ContinuePizzaSessionCard variant="hero" className="mt-2 sm:mt-4 lg:absolute lg:right-12 lg:top-12 lg:mt-0 lg:w-[34rem] xl:right-20" />
        </div>
      </section>
    </main>
  );
}

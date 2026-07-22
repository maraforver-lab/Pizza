import Link from "next/link";

const footerGroups = [
  {
    title: "Learn",
    links: [
      { label: "Pizza guides", href: "/guide" },
      { label: "Make the dough", href: "/guides/dough" },
      { label: "Make the sauce", href: "/sauce" },
      { label: "Choose your oven", href: "/ovens" },
      { label: "Choose your pizza", href: "/styles" },
      { label: "Fix pizza problems", href: "/guide/pizza-troubleshooting" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Plan a pizza", href: "/session/start" },
      { label: "Quick dough calculator", href: "/calculator/quick" },
      { label: "Party Orders", href: "/account/party-orders" },
      { label: "Pizza costs", href: "/costs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Updates", href: "/updates" },
      { label: "Contact", href: "/contact" },
      { label: "Methodology", href: "/methodology" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8" aria-label="DoughTools footer" data-site-footer>
      <div className="mx-auto grid max-w-7xl gap-7 border-t border-ink/10 pt-7 text-sm text-ink/58 sm:gap-8 sm:pt-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,.65fr)] lg:items-start">
        <section aria-labelledby="site-footer-brand">
          <h2 id="site-footer-brand" className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
            Made for better pizza nights.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink/52">
            Learn the craft, plan the evening, and keep the next useful page within reach.
          </p>
        </section>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-labelledby={`site-footer-${group.title.toLowerCase()}`}>
            <h2 id={`site-footer-${group.title.toLowerCase()}`} className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/42">
              {group.title}
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 md:grid-cols-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-9 items-center rounded-xl py-1.5 font-bold underline-offset-2 transition hover:text-tomato hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}

export { footerGroups as siteFooterGroups };

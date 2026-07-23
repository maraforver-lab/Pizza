import Link from "next/link";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

const securityItems = [
  {
    title: "Email and password",
    description: "Open Account to use the existing email and password access controls.",
    href: "/account",
    action: "Open Account access",
  },
  {
    title: "Sign out",
    description: "Open Account to sign out of this browser.",
    href: "/account",
    action: "Open Account",
  },
];

export default function AccountSettingsSecurityPage() {
  return (
    <AccountSettingsShell
      title="Security"
      description="Manage your email, password and account access."
      backHref="/account/settings"
      backLabel="Back to Settings"
    >
      <div className="space-y-4">
        <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="security-current-account-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Current account</p>
          <h2 id="security-current-account-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Account access
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Use the existing Account page for sign-in details and sign-out controls.
          </p>
        </section>

        <div className="grid gap-3">
          {securityItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-[1.5rem] border border-ink/10 bg-white/80 p-4 shadow-sm transition hover:border-tomato/25 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-5"
            >
              <span className="block font-display text-2xl font-semibold text-ink">{item.title}</span>
              <span className="mt-2 block text-sm font-bold leading-6 text-ink/60">{item.description}</span>
              <span className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white">
                {item.action}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AccountSettingsShell>
  );
}

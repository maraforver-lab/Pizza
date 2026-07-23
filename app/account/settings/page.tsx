import Link from "next/link";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

const settingsCategories = [
  {
    title: "Preferences",
    description: "Personalize how DoughTools works for you.",
    href: "/account/settings/preferences",
  },
  {
    title: "Privacy and data",
    description: "Download your data or permanently delete your account.",
    href: "/account/settings/privacy",
  },
  {
    title: "Security",
    description: "Manage your email, password and account access.",
    href: "/account/settings/security",
  },
];

export default function AccountSettingsPage() {
  return (
    <AccountSettingsShell
      title="Settings"
      description="Choose the account settings area you want to manage."
    >
      <div className="grid gap-3">
        {settingsCategories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group block rounded-[1.5rem] border border-ink/10 bg-white/80 p-4 shadow-sm transition hover:border-tomato/25 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-5"
          >
            <span className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span className="block font-display text-2xl font-semibold text-ink">
                  {category.title}
                </span>
                <span className="mt-2 block text-sm font-bold leading-6 text-ink/60">
                  {category.description}
                </span>
              </span>
              <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-cream text-lg font-extrabold text-ink/65 transition group-hover:border-tomato/25 group-hover:text-tomato" aria-hidden="true">
                &rarr;
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AccountSettingsShell>
  );
}

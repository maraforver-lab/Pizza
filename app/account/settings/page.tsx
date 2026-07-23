import Link from "next/link";
import { AccountAdminEntryCard } from "@/components/account/AccountAdminEntryCard";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";
import InstallAppPrompt from "@/components/InstallAppPrompt";

const settingsCategories = [
  {
    title: "Preferences",
    description: "Personalize how DoughTools works for you.",
    href: "/account/settings/preferences",
    action: "Open preferences",
  },
  {
    title: "Privacy and data",
    description: "Download your data or permanently delete your account.",
    href: "/account/settings/privacy",
    action: "Open privacy",
  },
  {
    title: "Security",
    description: "Manage your email, password and account access.",
    href: "/account/settings/security",
    action: "Open security",
  },
  {
    title: "App and device",
    description: "Install DoughTools on this device.",
    href: "#app-and-device",
    action: "View install options",
  },
];

export default function AccountSettingsPage() {
  return (
    <AccountSettingsShell
      title="Settings"
      description="Choose the account settings area you want to manage."
    >
      <div className="grid gap-3 sm:gap-4" aria-label="Settings categories">
        {settingsCategories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group block min-h-28 rounded-[1.5rem] border border-ink/10 bg-white/80 p-4 shadow-sm transition hover:border-tomato/25 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-5"
          >
            <span className="grid min-h-full gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <span className="min-w-0">
                <span className="block font-display text-2xl font-semibold text-ink">
                  {category.title}
                </span>
                <span className="mt-2 block text-sm font-bold leading-6 text-ink/60">
                  {category.description}
                </span>
              </span>
              <span className="inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream px-4 text-sm font-extrabold text-ink/70 transition group-hover:border-tomato/25 group-hover:text-tomato sm:w-auto sm:min-w-40">
                <span className="truncate">{category.action}</span>
                <span aria-hidden="true">&rarr;</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div id="app-and-device" className="mt-6">
        <InstallAppPrompt compact collapsible className="mt-0" />
      </div>
      <div className="mt-6 border-t border-ink/10 pt-5">
        <AccountAdminEntryCard title="Admin tools" />
      </div>
    </AccountSettingsShell>
  );
}

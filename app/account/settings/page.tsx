import Link from "next/link";
import type { ReactNode } from "react";
import { AccountAdminEntryCard } from "@/components/account/AccountAdminEntryCard";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import InstallAppPrompt from "@/components/InstallAppPrompt";

type SettingsRow = {
  title: string;
  description: string;
  href?: string;
};

type SettingsSection = {
  title: string;
  icon: DoughToolsIconName;
  rows: SettingsRow[];
};

const settingsSections: SettingsSection[] = [
  {
    title: "Preferences",
    icon: "experience-level",
    rows: [
      {
        title: "Guidance level",
        description: "Choose how much explanation DoughTools shows.",
        href: "/account/settings/preferences",
      },
      {
        title: "Bake timer sound",
        description: "Pick the sound theme used by newly opened timers.",
        href: "/account/settings/preferences",
      },
    ],
  },
  {
    title: "Privacy and data",
    icon: "download",
    rows: [
      {
        title: "Download my data",
        description: "Get a readable copy or the original JSON file.",
        href: "/account/settings/privacy",
      },
      {
        title: "Delete my account",
        description: "Permanently remove your account with confirmation.",
        href: "/account/settings/privacy",
      },
    ],
  },
  {
    title: "Security",
    icon: "account",
    rows: [
      {
        title: "Email",
        description: "View the email address connected to this account.",
        href: "/account/settings/security",
      },
      {
        title: "Change password",
        description: "Use the existing account access flow.",
        href: "/account/settings/security",
      },
      {
        title: "Sign out",
        description: "End this browser session.",
        href: "/account/settings/security",
      },
    ],
  },
  {
    title: "App and device",
    icon: "pizza",
    rows: [],
  },
];

function SettingsSectionCard({ section, children }: { section: SettingsSection; children?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-ink/10 bg-white/85 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3 sm:px-5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-tomato">
          <DoughToolsIcon name={section.icon} size={16} strokeWidth={2.1} />
        </span>
        <h2 className="font-display text-2xl font-semibold leading-tight text-ink">{section.title}</h2>
      </div>
      {section.rows.length > 0 ? (
        <div className="divide-y divide-ink/10">
          {section.rows.map((row) => (
            <SettingsNavigationRow key={`${section.title}-${row.title}`} row={row} />
          ))}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function SettingsNavigationRow({ row }: { row: SettingsRow }) {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink sm:text-base">{row.title}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-ink/55 sm:text-sm sm:leading-6">
          {row.description}
        </span>
      </span>
      {row.href ? (
        <DoughToolsIcon
          name="forward"
          size={20}
          className="shrink-0 text-ink/35 transition group-hover:text-tomato"
          strokeWidth={2.2}
        />
      ) : null}
    </>
  );

  if (!row.href) {
    return <div className="flex min-h-[4.25rem] items-center justify-between gap-4 px-4 py-3 sm:px-5">{content}</div>;
  }

  return (
    <Link
      href={row.href}
      className="group flex min-h-[4.5rem] items-center justify-between gap-4 px-4 py-3 transition hover:bg-cream/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tomato sm:min-h-[4.25rem] sm:px-5"
    >
      {content}
    </Link>
  );
}

export default function AccountSettingsPage() {
  const appSection = settingsSections.find((section) => section.title === "App and device");

  return (
    <AccountSettingsShell
      title="Settings"
      description="Manage your preferences, privacy, security, and app settings."
      headingVariant="open"
    >
      <div className="grid items-start gap-4 lg:grid-cols-2" aria-label="Settings categories">
        {settingsSections.map((section) => (
          <SettingsSectionCard key={section.title} section={section}>
            {section === appSection ? (
              <div id="app-and-device">
                <InstallAppPrompt collapsible variant="settings-row" />
              </div>
            ) : null}
          </SettingsSectionCard>
        ))}
      </div>

      <div className="mt-5">
        <AccountAdminEntryCard title="Admin tools" subtitle="Product admin" variant="wide" />
      </div>
    </AccountSettingsShell>
  );
}

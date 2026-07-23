import { AccountDataExportCard } from "@/components/account/AccountDataExportCard";
import { AccountDeleteAccountCard } from "@/components/account/AccountDeleteAccountCard";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

export default function AccountSettingsPrivacyPage() {
  return (
    <AccountSettingsShell
      title="Privacy and data"
      description="Download your data or permanently delete your account."
      backHref="/account/settings"
      backLabel="Back to Settings"
      showDeletionCompletion
    >
      <div className="space-y-4">
        <AccountDataExportCard />
        <AccountDeleteAccountCard />
      </div>
    </AccountSettingsShell>
  );
}

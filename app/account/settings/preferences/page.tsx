import { AccountBakeTimerSoundPreference } from "@/components/account/AccountBakeTimerSoundPreference";
import { AccountGuidancePreference } from "@/components/account/AccountGuidancePreference";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

export default function AccountSettingsPreferencesPage() {
  return (
    <AccountSettingsShell
      title="Preferences"
      description="Personalize how DoughTools works for you."
      backHref="/account/settings"
      backLabel="Back to Settings"
    >
      <div className="space-y-5">
        <AccountGuidancePreference />
        <AccountBakeTimerSoundPreference />
      </div>
    </AccountSettingsShell>
  );
}

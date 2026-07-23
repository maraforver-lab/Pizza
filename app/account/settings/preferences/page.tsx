import { AccountBakeTimerSoundPreference } from "@/components/account/AccountBakeTimerSoundPreference";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

export default function AccountSettingsPreferencesPage() {
  return (
    <AccountSettingsShell
      title="Preferences"
      description="Personalize how DoughTools works for you."
      backHref="/account/settings"
      backLabel="Back to Settings"
    >
      <AccountBakeTimerSoundPreference />
    </AccountSettingsShell>
  );
}

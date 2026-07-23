import { AccountSecurityControls } from "@/components/account/AccountSecurityControls";
import { AccountSettingsShell } from "@/components/account/AccountSettingsShell";

export default function AccountSettingsSecurityPage() {
  return (
    <AccountSettingsShell
      title="Security"
      description="Manage your email, password and account access."
      backHref="/account/settings"
      backLabel="Back to Settings"
    >
      <AccountSecurityControls />
    </AccountSettingsShell>
  );
}

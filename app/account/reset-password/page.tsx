import SiteFooter from "@/components/SiteFooter";
import { AccountResetPasswordForm } from "@/components/account/AccountResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-cream px-4 py-7 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <AccountResetPasswordForm />
        <SiteFooter />
      </div>
    </main>
  );
}

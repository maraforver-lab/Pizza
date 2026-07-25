import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { AccountForgotPasswordForm } from "@/components/account/AccountForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-cream px-4 py-7 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/account"
          className="inline-flex min-h-11 max-w-full items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          &larr; Back to sign in
        </Link>
        <div className="mt-5">
          <AccountForgotPasswordForm />
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}

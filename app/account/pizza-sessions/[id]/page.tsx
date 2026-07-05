import { CompletedPizzaSessionDetail } from "@/components/account/CompletedPizzaSessionDetail";

type CompletedPizzaSessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompletedPizzaSessionPage({ params }: CompletedPizzaSessionPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-cream px-4 py-10 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-4xl">
        <CompletedPizzaSessionDetail sessionId={id} />
      </div>
    </main>
  );
}

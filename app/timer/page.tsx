import { permanentRedirect } from "next/navigation";

type TimerRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function encodeTimerRedirectQuery(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function TimerRedirectPage({ searchParams }: TimerRedirectPageProps) {
  const query = encodeTimerRedirectQuery((await searchParams) ?? {});
  permanentRedirect(`/tools/bake-timer${query}`);
}

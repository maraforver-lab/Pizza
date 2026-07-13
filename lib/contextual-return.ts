export type ContextualReturnPath = "/session/kitchen";

const CONTEXTUAL_RETURN_LABELS: Record<ContextualReturnPath, string> = {
  "/session/kitchen": "Back to Kitchen Mode",
};

function firstParam(value?: string | string[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

export function getSafeContextualReturnPath(value?: string | string[] | null): ContextualReturnPath | null {
  const rawValue = firstParam(value);
  if (!rawValue) return null;

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(rawValue);
  } catch {
    return null;
  }

  if (decodedValue === "/session/kitchen") {
    return decodedValue;
  }

  return null;
}

export function contextualReturnLabelFor(path: ContextualReturnPath) {
  return CONTEXTUAL_RETURN_LABELS[path];
}

export function contextualReturnSupportTextFor(path: ContextualReturnPath) {
  if (path === "/session/kitchen") return "Return to your active step";
  return "Return to your active workflow";
}

export function buildContextualReturnHref(
  destination: string,
  returnTo: ContextualReturnPath = "/session/kitchen",
  returnLabel = contextualReturnLabelFor(returnTo),
) {
  if (!destination.startsWith("/") || destination.startsWith("//")) return destination;

  const [pathAndQuery, hash = ""] = destination.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("returnTo", returnTo);
  params.set("returnLabel", returnLabel);

  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

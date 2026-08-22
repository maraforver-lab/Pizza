import { getSiteUrl, hasConfiguredProductionSiteUrl } from "@/lib/seo-config";

export function SeoStructuredData() {
  if (!hasConfiguredProductionSiteUrl()) return null;

  const siteUrl = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "name": "DoughTools",
        "url": `${siteUrl}/`,
        "description": "Choose your pizza, timing and oven. Get one clear recipe, shopping list, schedule and baking plan.",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "DoughTools",
        "url": `${siteUrl}/`,
        "logo": `${siteUrl}/icons/icon-512.png`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      data-seo-structured-data
    />
  );
}

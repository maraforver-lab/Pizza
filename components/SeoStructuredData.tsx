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
        "description": "DoughTools is a pizza dough calculator and step-by-step pizza planner for calculating ingredients, fermentation timing and baking steps.",
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

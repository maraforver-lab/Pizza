import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DoughTools",
    short_name: "DoughTools",
    description: "Pizza dough calculator and step-by-step pizza planner for dough, fermentation, baking and improvement.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFF8F1",
    theme_color: "#FFF8F1",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

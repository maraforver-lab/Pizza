import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DoughTools",
    short_name: "DoughTools",
    description: "Practical pizza-making workspace for dough, planning, baking and improvement.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f3ea",
    theme_color: "#f6f3ea",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

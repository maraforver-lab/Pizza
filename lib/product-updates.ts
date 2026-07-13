export type ProductUpdate = {
  id: string;
  publishedAt: string;
  title: string;
  summary: string;
  sections?: Array<{
    heading: string;
    body: string;
  }>;
  highlights?: string[];
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export const productUpdates: readonly ProductUpdate[] = [];

export const updatesHeroImage = {
  src: "/images/homepage/doughtools-hero-desktop.webp",
  alt: "Fresh artisan pizza with dough and ingredients in a warm pizza-making workspace.",
  width: 2400,
  height: 1500,
} as const;

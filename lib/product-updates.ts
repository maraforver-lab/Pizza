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

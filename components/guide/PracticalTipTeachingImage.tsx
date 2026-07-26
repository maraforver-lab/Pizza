import Image from "next/image";
import { cardClass } from "@/components/design-system";

type PracticalTipTeachingImageProps = {
  src: string;
  alt: string;
  caption: string;
};

type PracticalTipImageStripItem = PracticalTipTeachingImageProps & {
  title: string;
};

export function PracticalTipTeachingImage({ src, alt, caption }: PracticalTipTeachingImageProps) {
  return (
    <figure className={cardClass({ className: "overflow-hidden p-0", variant: "default" })}>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1280px) 82vw, 960px"
        className="aspect-[3/2] w-full object-cover"
      />
      <figcaption className="border-t border-ink/10 bg-white px-4 py-3 text-sm font-bold leading-6 text-ink/62 sm:px-5">
        {caption}
      </figcaption>
    </figure>
  );
}

export function PracticalTipImageStrip({ items }: { items: readonly PracticalTipImageStripItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <figure key={item.title} className={cardClass({ className: "overflow-hidden p-0", variant: "default" })}>
          <Image
            src={item.src}
            alt={item.alt}
            width={900}
            height={675}
            sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) 30vw, 360px"
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="border-t border-ink/10 bg-white px-4 py-3">
            <span className="block font-display text-lg font-semibold text-ink">{item.title}</span>
            <span className="mt-1 block text-sm leading-6 text-ink/62">{item.caption}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

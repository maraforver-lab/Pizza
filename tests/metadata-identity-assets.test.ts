import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const publicFile = (path: string) => join(process.cwd(), "public", path);

function pngDimensions(path: string) {
  const buffer = readFileSync(path);

  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function icoSizes(path: string) {
  const buffer = readFileSync(path);

  expect(buffer.readUInt16LE(0)).toBe(0);
  expect(buffer.readUInt16LE(2)).toBe(1);
  const count = buffer.readUInt16LE(4);
  const sizes = new Set<string>();

  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    const width = buffer[offset] === 0 ? 256 : buffer[offset];
    const height = buffer[offset + 1] === 0 ? 256 : buffer[offset + 1];
    sizes.add(`${width}x${height}`);
  }

  return sizes;
}

describe("DoughTools public identity assets", () => {
  it("ships one canonical D timing mark and required favicon/app derivatives", () => {
    const iconFiles = [
      "icon.svg",
      "favicon.ico",
      "apple-touch-icon.png",
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/maskable-512.png",
      "brand/doughtools-d-timing-mark.svg",
    ];

    for (const file of iconFiles) {
      expect(existsSync(publicFile(file))).toBe(true);
    }

    expect(source("public/icon.svg")).toContain("DoughTools D timing mark");
    expect(source("public/icon.svg")).not.toContain("pizza mark");
    expect(source("public/brand/doughtools-d-timing-mark.svg")).toContain("DoughTools D timing mark");
    expect(pngDimensions(publicFile("apple-touch-icon.png"))).toEqual({ width: 180, height: 180 });
    expect(pngDimensions(publicFile("icons/icon-192.png"))).toEqual({ width: 192, height: 192 });
    expect(pngDimensions(publicFile("icons/icon-512.png"))).toEqual({ width: 512, height: 512 });
    expect(pngDimensions(publicFile("icons/maskable-512.png"))).toEqual({ width: 512, height: 512 });
    expect(icoSizes(publicFile("favicon.ico"))).toEqual(new Set(["16x16", "32x32", "48x48"]));
    expect(existsSync(publicFile("brand/doughtools-pizza-mark.svg"))).toBe(false);
  });

  it("ships the versioned static Open Graph image at the required dimensions", () => {
    const ogPath = publicFile("social/doughtools-og-v1.png");

    expect(existsSync(ogPath)).toBe(true);
    expect(pngDimensions(ogPath)).toEqual({ width: 1200, height: 630 });
    expect(readFileSync(ogPath).byteLength).toBeLessThan(500_000);
    expect(existsSync(join(process.cwd(), "app", "opengraph-image.tsx"))).toBe(false);
  });

  it("wires root icon metadata and manifest to local production identity assets", () => {
    const layout = source("app/layout.tsx");
    const manifest = source("app/manifest.ts");
    const seo = source("lib/seo-config.ts");

    expect(layout).toContain("/favicon.ico");
    expect(layout).not.toContain("/favicon.svg");
    expect(layout).toContain("/apple-touch-icon.png");
    expect(manifest).toContain("/icons/icon-192.png");
    expect(manifest).toContain("/icons/icon-512.png");
    expect(manifest).toContain("/icons/maskable-512.png");
    expect(manifest).toContain('purpose: "maskable"');
    expect(seo).toContain("/social/doughtools-og-v1.png");
    expect(seo).not.toContain("/opengraph-image");
  });
});

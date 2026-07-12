import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");

function localMarkdownLinks(path: string): string[] {
  const content = source(path);
  const matches = content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);

  return Array.from(matches)
    .map((match) => match[1])
    .filter((href) => href.startsWith("./") || href.startsWith("../") || href.startsWith("docs/"));
}

describe("DoughTools Experience Principles governance", () => {
  it("adds the authoritative Experience Principles document", () => {
    const docPath = "docs/experience-principles.md";
    const doc = source(docPath);

    expect(existsSync(join(root, docPath))).toBe(true);
    expect(doc).toContain("# DoughTools Experience Principles");
    expect(doc).toContain("Product mission");
    expect(doc).toContain("North Star");
    expect(doc).toContain("Product position");
    expect(doc).toContain("Homepage philosophy");
    expect(doc).toContain("Photography philosophy");
    expect(doc).toContain("Learning philosophy");
    expect(doc).toContain("Success metric");
  });

  it("requires future patches to respect the principles through AGENTS", () => {
    const agents = source("AGENTS.md");

    expect(agents).toContain("docs/experience-principles.md");
    expect(agents).toContain("Future product, UX, design, learning, and marketing patches must respect the Experience Principles");
  });

  it("references the principles from existing product-governance docs without duplicating the full document", () => {
    const design = source("docs/design-system.md");
    const visual = source("docs/visual-style-guide.md");
    const responsive = source("docs/global-responsive-ux-rules.md");

    expect(design).toContain("[Experience principles](./experience-principles.md)");
    expect(visual).toContain("[Experience principles](./experience-principles.md)");
    expect(responsive).toContain("docs/experience-principles.md");
    expect(design.match(/People don't come to DoughTools/g)).toBeNull();
    expect(visual.match(/Does this make someone more confident and excited/g)).toBeNull();
  });

  it("keeps local documentation links valid", () => {
    const docs = [
      "docs/experience-principles.md",
      "docs/design-system.md",
      "docs/visual-style-guide.md",
      "docs/global-responsive-ux-rules.md",
    ];

    for (const docPath of docs) {
      for (const href of localMarkdownLinks(docPath)) {
        const target = href.startsWith("docs/")
          ? join(root, href)
          : join(root, normalize(join(dirname(docPath), href)));

        expect(existsSync(target), `${docPath} -> ${href}`).toBe(true);
      }
    }
  });
});

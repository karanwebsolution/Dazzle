import { describe, expect, it } from "vitest";
import { generateLanding, lintComposition, listSections, listStyles, listThemes } from "../src/index.js";

describe("Dazzle generator", () => {
  it("generates a valid composition from a detailed creative brief", () => {
    const html = generateLanding({
      brand: "Northstar", tagline: "A clearer way forward", description: "Strategy for ambitious teams.",
      style: "editorial", layout: "split", theme: "paper", primaryColor: "#e4572e",
      sections: ["hero", "features", "stats", "faq", "cta", "footer"], effect3d: "gradient",
      features: [{ title: "Focused", description: "Less noise." }], stats: [{ value: "4.9/5", label: "love" }]
    });
    expect(html).toContain("Northstar"); expect(html).toContain("Focused"); expect(html).toContain('data-style="editorial"');
    expect(lintComposition(html)).toEqual([]);
  });
  it("is deterministic for the same brief", () => {
    const brief = { brand: "Acme", tagline: "Ship faster", style: "bento" as const, effect3d: "cube" as const };
    expect(generateLanding(brief)).toBe(generateLanding(brief));
  });
  it("exposes all customization catalogs", () => {
    expect(listThemes().length).toBeGreaterThanOrEqual(5); expect(listStyles()).toContain("luxury"); expect(listSections()).toContain("faq");
  });
});

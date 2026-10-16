import { describe, expect, it } from "vitest";
import { designDirector, generateLanding, lintComposition, listSections, listStyles, listThemes, redesignLanding } from "../src/index.js";

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
  it("makes contextual design decisions before generation", () => {
    const strategy = designDirector({ brand: "Ledger", product: "Secure finance API", audience: "enterprise engineering teams", goal: "book a demo" });
    expect(strategy.design.style).toBe("saas"); expect(strategy.conversion.cta).toBe("Book a demo"); expect(strategy.sections.some((section) => section.name === "faq")).toBe(true); expect(strategy.psychology.length).toBeGreaterThan(2);
  });
  it("redesigns a brief and returns valid HTML plus strategy", () => {
    const result = redesignLanding({ brand: "Ember", product: "Premium coffee subscription", goal: "make a sale" });
    expect(result.strategy.design.style).toBe("luxury"); expect(result.html).toContain("Ember"); expect(lintComposition(result.html)).toEqual([]);
  });
});

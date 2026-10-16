# Dazzle Creative Skills Playbook

Dazzle is not a single landing-page template. It is a strategy-first creative workflow. Claude should use these skills in sequence, skipping only the skills that do not fit the brief.

## Core thinking skills

1. **Brief decomposition** — turn a vague request into product, promise, audience, goal, constraints, and proof.
2. **Audience profiling** — identify visitor intent, awareness, anxieties, vocabulary, and decision context.
3. **Visitor journey mapping** — define arrival, orientation, proof, decision, and action moments.
4. **Human psychology** — apply cognitive fluency, progressive disclosure, social proof, loss reduction, and ethical choice architecture.
5. **Conversion architecture** — define one primary CTA, one respectful secondary path, and where each proof signal appears.
6. **Trust design** — match evidence to risk: outcomes, process, security, credibility, testimonials, or transparent limitations.
7. **Content hierarchy** — reduce feature dumping and build a clear promise → benefits → proof → objections → action narrative.
8. **Brand voice** — choose vocabulary, sentence rhythm, confidence, warmth, and specificity from the audience.
9. **Competitive differentiation** — avoid category sameness and identify one memorable visual or verbal point of view.
10. **Ethical persuasion** — never use fake urgency, fabricated testimonials, dark patterns, or misleading claims.

## Visual design skills

11. **Style direction** — choose SaaS, editorial, bento, glass, brutalist, luxury, or a deliberate hybrid.
12. **Theme direction** — choose midnight, aurora, sunset, paper, mono, or a context-specific custom palette.
13. **Color systems** — define background, foreground, muted, accent, surface, contrast, and semantic states.
14. **Typography direction** — pair display and utility type, set hierarchy, measure, tracking, and readable line length.
15. **Layout composition** — choose centered, split, immersive, bento, editorial grid, or asymmetric composition.
16. **Density control** — choose airy, balanced, or dense based on audience scanning behavior and information load.
17. **Spacing rhythm** — use a consistent scale instead of arbitrary gaps.
18. **Card systems** — choose borders, radius, depth, glass, editorial rules, or hard shadows with a reason.
19. **CTA design** — set label, size, contrast, shape, microcopy, hover behavior, and placement.
20. **Navigation design** — preserve information scent and keep navigation from competing with the promise.
21. **Hero composition** — make the first viewport explain what, who, why now, and what to do next.
22. **Section architecture** — add only sections that advance comprehension, trust, or action.
23. **Social proof placement** — put evidence beside the moment of doubt, not only at the bottom.
24. **Pricing design** — decide whether pricing helps qualification or distracts from an earlier CTA.
25. **FAQ design** — answer real objections with short, direct language.

## Media and motion skills

26. **Hero media selection** — choose CSS art, image, video, product UI, or Three.js based on comprehension value.
27. **Image direction** — define subject, crop, lighting, art direction, alt text, and responsive behavior.
28. **Video direction** — use silent short loops only where movement demonstrates value better than text.
29. **Three.js direction** — define one lightweight scene, a performance budget, and a static fallback.
30. **Motion choreography** — sequence reveal, emphasis, transition, and CTA settle without stealing attention.
31. **Reduced-motion design** — ensure meaning remains available when animation is disabled.
32. **Remotion planning** — create frame-accurate compositions, shots, and deterministic timing.
33. **HyperFrames planning** — map Dazzle clips into seekable timeline metadata.
34. **FFmpeg media inspection** — probe codecs, dimensions, duration, frame rate, and audio before export.
35. **FFmpeg frame extraction** — create representative frames for visual inspection.
36. **Render screenshot audit** — capture the actual webpage with headless Chromium, not just inspect source HTML.

## Quality and redesign skills

37. **Responsive audit** — inspect mobile, tablet, and desktop hierarchy, overflow, and CTA visibility.
38. **Accessibility audit** — check semantic headings, keyboard focus, contrast, alt text, reduced motion, and touch targets.
39. **Performance audit** — reserve media space, lazy-load heavy assets, cap Three.js DPR, and avoid blocking scripts.
40. **SEO audit** — define title, description, H1/H2 structure, canonical intent, and crawlable copy.
41. **Human visual review** — score clarity, relevance, trust, memorability, and actionability from rendered frames.
42. **Design comparison** — compare target and redesign screenshots by hierarchy, not by superficial decoration.
43. **Redesign preservation** — keep brand truth and useful content while replacing weak hierarchy and generic styling.
44. **Redesign critique loop** — render, inspect, list failures, revise, render again, then approve.
45. **Pre-submit gate** — no page is approved until composition, responsive, accessibility, media, and visual checks pass.
46. **Export hygiene** — produce deterministic HTML, image/video assets, metadata, and a clear handoff.

## Ownership model

The connected LLM is deliberately kept at one boundary. It translates a natural-language request into the `dazzle_build` input, inspects the returned rendered artifacts, and writes the critique. Dazzle owns deterministic strategy normalization, HTML generation, screenshots, FFmpeg/ffprobe, composition validation, manifests, and audit contracts. The 49 specialist tools are Dazzle's internal capabilities and should not force the user or model to manually orchestrate a long chain.

## Required agent workflow

### New page

1. Translate the user's plan into one `dazzle_build` call.
2. Let Dazzle run strategy, generation, composition validation, Chromium render, and artifact creation.
3. Use the returned screenshot and audit manifest with the same connected vision model.
4. Revise once or more if the visual result does not match the brief.

Use the specialist tools directly only when debugging a failed stage or when the user explicitly asks for a focused audit.

### Existing page redesign

1. Translate the target URL, business goal, and redesign intent into one `dazzle_build` call with `operation: "redesign"` and `targetUrl`.
2. Let Dazzle capture the target and generated page at the same viewport.
3. Inspect both returned images with the same connected vision model.
4. Run another `dazzle_build` call with the critique if the redesign is weak.
5. Only then submit or hand off the redesign.

## Tooling boundary

- **Dazzle MCP server** owns Chromium screenshots, FFmpeg/ffprobe inspection, deterministic rendering, and composition validation.
- **Claude, Gemini, or another connected model** owns visual judgment, copy reasoning, critique, and deciding which specialist tools to call.
- **Remotion and HyperFrames** are timeline planning/export targets; they are not substitutes for inspecting the actual rendered page.
- **FFmpeg** can extract and inspect frames, but a vision-capable model must look at those frames to judge beauty, hierarchy, and human appeal.

## Non-negotiable quality rules

- Do not reuse the same hero, cards, palette, or motion pattern blindly.
- Do not add Three.js, video, or particles merely because they are available.
- Do not let motion hide copy or delay the CTA.
- Do not claim a visual audit happened unless rendered screenshots or frames were actually inspected.
- Do not fabricate customer logos, testimonials, stats, or performance claims.
- Every animation needs a reduced-motion fallback.
- Every redesign must be materially better for the stated audience, not merely different.

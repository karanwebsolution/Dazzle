---
name: landing-page-conversion-audit
description: Audit landing pages, sales pages, product pages, opt-in pages, and checkout flows for conversion leaks. Use when reviewing a live page, diagnosing low conversion, checking paid-traffic message match, or improving a funnel before scaling.
---

# Landing Page Conversion Audit

Audit the rendered page, not only its source HTML. Return a short, ranked fix list tied to specific page elements, failure modes, and concrete changes.

## Evidence and limits

Gather evidence in this order:

1. Page URL or rendered mockup.
2. Traffic source, ad, or keyword for message-match analysis.
3. Sessions and conversions from the last 14–30 days.
4. Funnel-step drop-off data.
5. Device split, with mobile-first review when unknown.

State which inputs were unavailable. If only a URL is available, label quantitative statements as estimates. If there is no traffic, design or review the page instead of claiming a conversion diagnosis. If the offer or audience is fundamentally wrong, say the upstream problem limits what page edits can fix.

## Audit sequence

Prioritize revenue impact:

- **Message match:** headline and first viewport deliver the ad promise in the visitor's language.
- **Mobile above the fold:** one clear promise, one primary CTA, reachable action, acceptable loading, and no hero media blocking the offer.
- **Offer clarity:** a stranger can answer what it is, who it is for, price or qualification path, and what happens after clicking within five seconds.
- **Risk reversal:** trial, guarantee, cancellation, shipping, returns, security, or transparent limitations appear near the decision moment.
- **Form and checkout friction:** remove unnecessary fields, redirects, hidden payment methods, and late validation errors.
- **Trust at action:** use attributable proof, relevant evidence, and reassurance next to the CTA; reject anonymous filler.
- **Post-click path:** confirm delivery expectations, support, next step, upsell or order-bump logic, and a useful thank-you state.
- **Measurement:** verify conversion events and carry `fbclid`, `ttclid`, `gclid`, or `msclkid` through the order when applicable.

## Report format

Return exactly:

```markdown
## Verdict
<one paragraph: page problem, upstream problem, or insufficient evidence>

## Fix now (ordered by expected impact)
1. <element> — <failure mode> → <specific change> | effort: S/M/L | confidence: high/medium/low

## Test, don't guess
<changes that need an A/B test and the metric to judge>

## Not a problem
<checked elements that are working>

## Could not check
<missing evidence and how it limits the findings>
```

Cap the fix list at seven items. Do not promise percentage lifts; rank expected direction and confidence instead. If there are fewer than roughly 1,000 sessions or 30 conversions, state that the data cannot reliably separate signal from noise and rank changes by first-principles friction.

## Dazzle integration

When used inside Dazzle, fetch the target page, capture the full page and mobile first viewport with Chromium, attach the screenshots, and include the audit in the build manifest. Preserve brand truth and useful content during redesign. Never recommend fake urgency, fabricated testimonials, dark patterns, or unnecessary animation. Treat every section, sentence, button, image, video, transition, and form field as a hypothesis about comprehension, trust, retention, or action.

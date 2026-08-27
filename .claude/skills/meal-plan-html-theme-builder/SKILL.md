---
name: meal-plan-html-theme-builder
description: Rendering rules and the recipe-card / weekly-planner visual template for turning an approved meal-plan.md into a single standalone meal-plan.html. Use when rendering the final meal plan deliverable as HTML.
---

# Meal plan HTML theme

One self-contained `.html` file. No build step, no external requests — the user opens it from
disk, and it must render identically offline, printed, and on a phone.

## Hard constraints

- **Everything inline.** One `<style>` block in `<head>`. No CDN links, no external stylesheets,
  no webfonts, no images by URL, no JavaScript. A system font stack only.
- **Print-clean.** Add an `@media print` block: white background, no shadows, each day block
  `break-inside: avoid`.
- **Responsive.** Cards in a `grid` with `repeat(auto-fill, minmax(280px, 1fr))`; single column
  under 640px. Tables get their own `overflow-x: auto` wrapper — the body never scrolls sideways.
- **Theme-aware.** Define the full light palette as custom properties on bare `:root`, then
  override only those properties inside `@media (prefers-color-scheme: dark)`. Give `body` an
  explicit background; never leave it transparent.
- **Source links are real anchors** — `<a href="…" target="_blank" rel="noopener">` — carried
  verbatim from the plan. They are the deliverable's proof of provenance.

## Document structure

```
<header>      plan title, scope line (days · servings · time cap), generated date
<section>     summary strip: total cost vs budget, average kcal/day, total cook time
<section>     the week — one card per day
<section>     shopping list, grouped by store section
<section>     one-time pantry purchases, visually separated from the weekly list
<footer>      sources
```

### Day card

Day name as the card header. Then recipe title, a row of pills (total time · protein ·
kcal/serving), key ingredients, an "already have" line when the plan lists one, and the source
link at the foot. Keep the pill row to a single line at 280px.

## Palette

```css
:root {
  --bg: #fbfaf8; --surface: #ffffff; --ink: #1c1b19; --ink-soft: #5c5852;
  --line: #e4e0d9; --accent: #3f6f4e; --accent-soft: #eaf1eb; --warn: #9a5b2c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16171a; --surface: #1e2024; --ink: #eceae6; --ink-soft: #a4a09a;
    --line: #2e3137; --accent: #7fb08c; --accent-soft: #222c26; --warn: #d0954f;
  }
}
```

Accent carries the day headers, the pills, and the under-budget figure. `--warn` is for an
over-budget total only — if the plan passed its budget gate, `--warn` should not appear.

## Content rules

- **Render the approved plan, do not re-plan it.** No recipe, figure, day assignment, or cost
  that is not in the source artifacts.
- Restate the shopping list and budget from `shopping-list.md` and `budget.md` — those sections
  do not live in `meal-plan.md`.
- Keep the one-time pantry purchases visually separate from the week's food, with both subtotals
  shown. That split is the whole point of the section: it is what tells the user which part of
  the spend repeats next week.
- No internal filenames, agent names, or gate numbers anywhere in the output.

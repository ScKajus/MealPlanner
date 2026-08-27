---
name: recipe-html-builder
description: Rendering rules and visual template for turning a single recipe (name, ingredients, steps, nutrition, source) into one standalone recipe HTML page. Use when the deliverable is one recipe's own page, not a multi-day meal plan — including recipes outside the /plan-meals pipeline.
---

# Recipe HTML page

One self-contained `.html` file per recipe. No build step, no external requests — the user opens
it from disk, and it must render identically offline, printed, and on a phone. This is the
single-recipe counterpart to `meal-plan-html-theme-builder`: use that skill for a multi-day plan
with a shopping list and budget, use this one whenever the deliverable is just one dish.

This skill is not scoped to any particular run's recipes. Any recipe — from a `/plan-meals`
artifact, a user-supplied recipe, or one you looked up — renders through the same template below.

## Hard constraints

- **Everything inline.** One `<style>` block in `<head>`. No CDN links, no external stylesheets,
  no webfonts, no images by URL, no JavaScript. A system font stack only.
- **Print-clean.** Add an `@media print` block: white background, no shadows, `section { break-inside: avoid; }`.
- **Responsive.** Single-column body, `max-width` around 680px, centered. Ingredient list and
  nutrition stats reflow on narrow screens — no fixed widths that overflow on a phone.
- **Theme-aware.** Define the full light palette as custom properties on bare `:root`, then
  override only those properties inside `@media (prefers-color-scheme: dark)`. Give `body` an
  explicit background; never leave it transparent.
- **Never invent.** Ingredients, quantities, steps, nutrition and the source link must all trace
  to something actually retrieved (a fetched recipe page, or content the user gave you directly)
  — never filled in from a plausible guess. An honest "not published" beats an invented number.
- **The source link is a real anchor** — `<a href="…" target="_blank" rel="noopener">` — never a
  bare filename or omitted entirely, unless the recipe genuinely has no source (user-authored).
- **One file per recipe**, named for the dish (`kebab-case-recipe-name.html`), written wherever the
  user asked for it — never overwriting an existing multi-day `meal-plan.html`.

## Document structure

```
<header>   recipe title, a row of pills: total time · servings · primary protein · kcal/serving
<section>  Ingredients — one list, quantities scaled to the requested serving count
<section>  Instructions — numbered steps, in the order the source gives them
<section>  Nutrition — a small stat grid, per serving
<footer>   source link
```

Keep it to these four sections. Do not add a shopping list, a budget, or a weekly summary strip —
those belong to a full meal plan, not a single recipe page.

## Palette

```css
:root {
  --bg: #fbfaf8; --surface: #ffffff; --ink: #1c1b19; --ink-soft: #5c5852;
  --line: #e4e0d9; --accent: #3f6f4e; --accent-soft: #eaf1eb;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16171a; --surface: #1e2024; --ink: #eceae6; --ink-soft: #a4a09a;
    --line: #2e3137; --accent: #7fb08c; --accent-soft: #222c26;
  }
}
```

Same palette as `meal-plan-html-theme-builder`, so a recipe page and the weekly plan look like one
family if a user has both open. Accent carries the section-header underline and the pill/stat
values.

## Content rules

- **Scale ingredient quantities to the serving count actually wanted**, not the source page's
  native yield — state the scaling plainly (e.g. halved from a 4-serving source) rather than
  silently.
- **If a source ingredient was deliberately left out of a costed/purchased plan** (an optional
  extra the pantry footprint didn't include), say so in a short note rather than silently dropping
  it or silently including it as if it were bought.
- Steps are the source's own steps, reworded for the scaled ingredient amounts where a quantity is
  named inline — never re-ordered or invented.
- Nutrition is the source's published per-serving panel. If none was published, write "not
  published" — do not estimate.
- No internal filenames, agent names, or gate numbers anywhere in the output.

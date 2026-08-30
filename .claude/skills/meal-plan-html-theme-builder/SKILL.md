---
name: meal-plan-html-theme-builder
description: Rendering rules and the single-recipe visual template for turning an approved meal-plan.md — its ingredients, numbered method, nutrition and EUR costs — into a standalone meal-plan.html. Use when rendering the final meal deliverable as HTML.
---

# Meal HTML theme

One self-contained `.html` file for **one recipe**. No build step, no external requests — the user
opens it from disk, and it must render identically offline, printed, and on a phone propped
against a kitchen counter.

## Hard constraints

- **Everything inline.** One `<style>` block in `<head>`. No CDN links, no external stylesheets,
  no webfonts, no images by URL, no JavaScript. A system font stack only.
- **Print-clean.** Add an `@media print` block: white background, no shadows, each `<section>` and
  each instruction `<li>` `break-inside: avoid`.
- **Responsive.** The ingredient and shopping-list columns go in a `grid` with
  `repeat(auto-fill, minmax(280px, 1fr))`, single column under 640px. **Instructions stay one
  column at every width** — a numbered method split across columns is unreadable. Tables get their
  own `overflow-x: auto` wrapper; the body never scrolls sideways.
- **Theme-aware.** Define the full light palette as custom properties on bare `:root`, then
  override only those properties inside `@media (prefers-color-scheme: dark)`. Give `body` an
  explicit background; never leave it transparent.
- **The source link is a real anchor** — `<a href="…" target="_blank" rel="noopener">` — carried
  verbatim from the plan. It is the deliverable's proof of provenance.

## Document structure

```
<header>   recipe title; pill row: total time · servings · primary protein · kcal/serving · €/serving
<section>  summary strip: meal cost vs budget, kcal per serving, total time
<section>  Ingredients — scaled to the requested servings, "already have" marked
<section>  Instructions — a numbered <ol>, one <li> per step, in the plan's order
<section>  Nutrition — a small stat grid, per serving
<section>  Shopping list with EUR prices, grouped by store section
<section>  One-time pantry purchases, visually separated from the meal's food
<footer>   source link
```

### Instructions — the centre of the page

This is what a person reads while cooking, one hand busy, phone at arm's length. Give it the most
generous typography on the page: a comfortable measure (around 60–70 characters), line height near
1.7, step numbers large enough to find your place again after looking away, and clear vertical
separation between steps. It should be the section that still works when the page is scaled down
or printed and taped to a cupboard.

Render it as a real `<ol>`. Never a table, never styled `<div>`s — the numbering carries meaning.

### Ingredients

A real `<ul>`, quantities first so the amounts line up down the left. Mark on-hand items with a
quiet inline note (`--ink-soft`), not a strikethrough — the user still needs to see them to cook.

### Cost

Show the meal cost, the cost per serving, and the one-time pantry total as **separate figures**.
Never sum the meal cost and the one-time total into a single "cost" line: that split is what tells
the user which part of the spend is this dinner and which part stays on the shelf afterwards.

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

Accent carries the section headers, the pills, the step numbers, and the under-budget figure.
`--warn` is for an over-budget total only — if the meal passed its budget gate, `--warn` should
not appear.

## Content rules

- **Render the approved plan, do not re-plan it.** No ingredient, step, figure, or cost that is
  not in the source artifacts.
- **Carry the steps exactly** — same wording, same order, same count. Do not tidy them, merge
  short ones, split long ones, or add a step that seems missing. They passed a provenance gate in
  that exact form.
- Restate the shopping list and costs from `shopping-list.md` and `budget.md` — those sections do
  not live in `meal-plan.md`.
- No internal filenames, agent names, or gate numbers anywhere in the output.

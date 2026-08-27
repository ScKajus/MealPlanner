# Meal Planner

`/plan-meals <request>` turns a natural-language meal request into `meal-plan.html`, via a
coordinator and nine subagents. The coordinator's full operating manual is
`.claude/commands/plan-meals.md` — **only the coordinator needs it.** This file is loaded into
every subagent, so it holds only what every subagent needs. Keep it short.

## Artifact ownership

One agent, one artifact. Nothing else writes it; nothing else edits it to fix a problem.

| Agent | Owns | Reads |
|---|---|---|
| `requirements-formalizer` | `artifacts/requirements.md` | the request + coordinator-collected answers |
| `recipe-researcher` | `artifacts/candidate-recipes.md` | requirements |
| `pantry-matcher` | `artifacts/pantry-match.md` | requirements |
| `nutrition-checker` | `artifacts/nutrition.md` | candidate-recipes, requirements |
| `meal-plan-builder` | `artifacts/meal-plan.md` | requirements, candidate-recipes, nutrition, pantry-match, validation-report |
| `shopping-list-builder` | `artifacts/shopping-list.md` | meal-plan, candidate-recipes, pantry-match, requirements |
| `budget-aggregator` | `artifacts/budget.md` | shopping-list, requirements |
| `validator` | `artifacts/validation-report.md` | only the artifacts its current gate pass covers |
| `html-builder` | `meal-plan.html` (project root) | approved meal-plan, shopping-list, budget |

## Flow

```
requirements-formalizer
        ▼
[recipe-researcher, pantry-matcher]        parallel
        ▼
nutrition-checker
        ▼
validator  — pass A: gates 1, 2, 4, 5 over the candidate pool
        ▼
meal-plan-builder                          selects the N recipes and assigns days
        ▼
shopping-list-builder → budget-aggregator  scoped to the SELECTED recipes only
        ▼
validator  — pass B: gates 3, 6, 7 over the chosen week
        ▼
HUMAN APPROVAL  ──reject──▶ meal-plan-builder, then re-cost, then pass B again
        ▼ approve
html-builder
```

**Selection happens before costing.** The shopping list and the budget describe the chosen
week, never the candidate pool — costing a pool nobody will cook is the most expensive mistake
this pipeline can make.

## Quality gates

| # | Gate | Checked in pass |
|---|---|---|
| 1 | Every recipe's total time ≤ the stated max | A |
| 2 | No recipe violates a stated restriction or allergy (**safety gate**) | A |
| 3 | No repeated protein/recipe on consecutive days, if requested | B |
| 4 | Every recipe cites a real, retrieved source link | A |
| 5 | Nutrition roughly balanced; respects any stated target | A |
| 6 | Week's food cost ≤ the stated budget | B |
| 7 | Every requested day/meal slot is filled | B |

A gate whose inputs do not exist yet is `N/A`, never `PASS`.

## Rules every subagent follows

- **Never invent.** Recipes, nutrition figures and prices must trace to something retrieved in
  this run. A plausible-looking invented URL is worse than an honest gap.
- **You cannot talk to the user.** Only the coordinator can. Anything that blocks you goes under
  `## Blockers` in your artifact and in your hand-off.
- **Rewrite the whole file** on every invocation — no deltas, no changelog, no "v2" heading.
  Same inputs in, same file out.
- **Emit every section in your schema**, using the documented empty value (`none`,
  `not specified`) rather than omitting one. Downstream agents branch on presence.
- **Numeric fields are a bare number plus an explicit unit** — `25 minutes`, `500 g`, `480 kcal`,
  `$4.80`. Never `about half an hour`, `a bunch`, `cheap`.
- **Read only your declared inputs**, and read them from disk — the coordinator passes paths, not
  pasted contents.
- **Stay terse.** Your artifact is read by 2–5 other agents and re-read on every retry, so every
  paragraph you write is paid for several times over. Record decisions and figures, not
  reasoning. Policy that would be identical on every run belongs in your prompt, not in your
  artifact.
- **Never name a skill that does not exist**, and never substitute a different skill for one you
  were told to use. This pipeline uses exactly two: `artifact-validator` and
  `meal-plan-html-theme-builder`, both under `.claude/skills/`. A third skill,
  `recipe-html-builder`, also lives there for standalone single-recipe pages outside this
  pipeline — no subagent here should reach for it.
- Internal artifact filenames, agent names and gate numbers must never reach user-facing output.

## MCP

`spoonacular` (`mcp__spoonacular__*`), registered in `.mcp.json` with a `${SPOONACULAR_API_KEY}`
reference — no key is ever written into the repo. Free plan: 50 points/day.

It is a **secondary** source, not the primary one. In practice its recipe records report a
placeholder `readyInMinutes: 45` often enough that yield against a tight time cap is poor, and
`analyze_nutrition` has returned parsed-ingredient data with no macros. Web search plus a real
page fetch is the reliable path; query Spoonacular when it is cheap and useful, and do not spend
the quota confirming it is unhelpful twice in one run.

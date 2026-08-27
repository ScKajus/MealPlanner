---
name: artifact-validator
description: Structural and citation check for any Markdown artifact in the /plan-meals pipeline — verifies required sections are present, every recipe/claim carries a real source link, numeric fields are well-formed, and stated arithmetic holds. Use when validating a pipeline artifact before the next stage runs.
---

# Artifact validator

A structural pass over one Markdown artifact. It says whether the artifact is *well-formed
enough for the next agent to consume*. It does **not** judge whether the content is a good meal
plan — the seven quality gates do that, and they are the `validator` agent's own job.

Run this per artifact, then report per artifact. Never merge findings from two artifacts into
one line.

## 1. Required sections

Every artifact owner has a fixed schema. A section may be **empty** (`none`, `not specified`) —
downstream agents branch on presence, so an empty section is correct and a *missing* one is a
failure.

| Artifact | Required sections |
|---|---|
| `requirements.md` | Request, Scope, Servings, Pantry Items, Staples, Dietary Restrictions, Time Budget, Cooking Budget, Nutrition Targets, Cuisine Preferences, Repeat Avoidance, Assumptions, Open Questions |
| `candidate-recipes.md` | Search Method, Candidates, Assumptions, Blockers |
| `pantry-match.md` | Inventory, Coverage Notes, Assumptions, Blockers |
| `nutrition.md` | Method, Targets, Per Recipe, Rollups, Imbalance Flags, Blockers |
| `shopping-list.md` | Method, To Buy, One-Time Pantry Purchases, Already Covered, Notes, Assumptions, Blockers |
| `budget.md` | Method, Budget, Line Costs, Weekly Food Total, One-Time Pantry Total, Total, Verdict, Overage Drivers, Assumptions, Blockers |
| `meal-plan.md` | Overview, Plan, Nutrition Summary, Alternates, Blockers |

## 2. Citations

- Every `Source:` line is a well-formed absolute `http(s)` URL.
- Every recipe in `candidate-recipes.md` and every day block in `meal-plan.md` carries one.
- A URL that looks synthesized (a slug assembled from the recipe title against a domain that was
  never fetched in this run) is a **FAIL**, not a warning. Check it against the queries and
  fetches recorded in `## Search Method`.
- A day block's source URL must match its candidate's source URL character for character.

## 3. Numeric fields

Every numeric field is a bare number with an explicit unit. Prose is a failure.

| Good | Bad |
|---|---|
| `25 minutes` | `about half an hour`, `quick` |
| `4 servings` | `serves a family` |
| `500 g`, `250 ml`, `6 pieces` | `a bunch`, `some`, `to taste` |
| `480 kcal`, `42 g protein` | `high protein` |
| `$4.80` | `cheap`, `a few dollars` |

## 4. Arithmetic

Recompute, do not trust:

- `Total` time = prep + cook, per recipe.
- Line costs sum to `Weekly Food Total` and `One-Time Pantry Total`; those two sum to `Total`.
- Budget delta = weekly food total − stated budget, signed.
- Per-day nutrition rollups equal the sum of that day's per-serving figures.
- Scaled ingredient quantities equal native quantity × the stated scaling factor.

## 5. Report format

Return one block per artifact:

```
artifacts/candidate-recipes.md — PASS
  sections: all 4 present
  citations: 7/7 source URLs well-formed, all traceable to a recorded fetch
  numerics: 7/7 candidates carry Total, Yields, and quantified ingredients
  arithmetic: prep + cook = Total holds for 7/7

artifacts/budget.md — FAIL
  arithmetic: line costs sum to $54.10, "Weekly Food Total" states $51.90 (delta $2.20)
```

Cite the artifact and the specific row for every finding. `FAIL` with no row reference is not
actionable and is itself a defect in the report.

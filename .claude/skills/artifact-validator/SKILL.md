---
name: artifact-validator
description: Structural and citation check for any Markdown artifact in the /plan-meals pipeline — verifies required sections are present, every recipe/claim carries a real source link, numeric fields are well-formed, and stated arithmetic holds. Use when validating a pipeline artifact before the next stage runs.
---

# Artifact validator

A structural pass over one Markdown artifact. It says whether the artifact is *well-formed
enough for the next agent to consume*. It does **not** judge whether the content is a good meal —
the seven quality gates do that, and they are the `validator` agent's own job.

Run this per artifact, then report per artifact. Never merge findings from two artifacts into
one line.

## 1. Required sections

Every artifact owner has a fixed schema. A section may be **empty** (`none`, `not specified`) —
downstream agents branch on presence, so an empty section is correct and a *missing* one is a
failure.

| Artifact | Required sections |
|---|---|
| `requirements.md` | Request, Scope, Servings, Pantry Items, Staples, Dietary Restrictions, Time Budget, Cooking Budget, Nutrition Targets, Cuisine Preferences, Assumptions, Open Questions |
| `candidate-recipes.md` | Search Method, Candidates, Pantry Footprint, Assumptions, Blockers |
| `pantry-match.md` | Inventory, Coverage Notes, Assumptions, Blockers |
| `nutrition.md` | Method, Targets, Per Recipe, Rollups, Imbalance Flags, Blockers |
| `shopping-list.md` | Method, To Buy, One-Time Pantry Purchases, Already Covered, Notes, Assumptions, Blockers |
| `budget.md` | Method, Budget, Line Costs, Meal Cost, One-Time Pantry Total, Total, Verdict, Overage Drivers, Assumptions, Blockers |
| `meal-plan.md` | Overview, Recipe, Ingredients, Instructions, Nutrition, Alternates, Blockers |

### 1b. Per-candidate fields in `candidate-recipes.md`

Every `###` candidate block carries all of: `Cuisine`, `Primary protein`, `Prep`/`Cook`/`Total`,
`Yields`, `Completeness`, `Nutrition per serving`, `New pantry items`, `Source`, an `Ingredients:`
list and an `Instructions:` list. A missing line is a **FAIL** against that candidate.

`Completeness` reads either `complete meal` or `needs a side — <what>`. It is the only signal
telling the selection stage that a candidate's `Total` covers a component rather than a dinner, so
an absent or hedged value ("probably fine", "serves as a main") is a **FAIL** — silently, it
becomes a time-cap failure two stages later.

## 2. Citations

- Every `Source:` line is a well-formed absolute `http(s)` URL.
- Every recipe in `candidate-recipes.md`, and the `## Recipe` block in `meal-plan.md`, carries one.
- A URL that looks synthesized (a slug assembled from the recipe title against a domain that was
  never fetched in this run) is a **FAIL**, not a warning. Check it against the queries and
  fetches recorded in `## Search Method`.
- The plan's source URL must match its candidate's source URL character for character.

## 2b. Instructions provenance

`meal-plan.md` `## Instructions` is the part of the deliverable a person cooks from, and the part
most easily fabricated. Check it against the selected recipe's `Instructions:` block in
`candidate-recipes.md`, step by step:

- **Every plan step has a counterpart in the candidate block.** A step with no counterpart is a
  **FAIL** — an invented instruction. It will read as entirely reasonable; that is why this check
  exists rather than a judgement call.
- **The order matches.** A resequenced method is a **FAIL** even when every step is individually
  real.
- **No step is dropped.** A shorter method than the candidate's is a **FAIL** — an incomplete
  recipe is one the user cannot cook.
- **Rewording is permitted only for rescaled inline quantities** (`500 g` → `250 g` where the plan
  halves the recipe). Any reword that changes a technique, temperature or timing is a **FAIL**.
- An empty or placeholder `## Instructions` is a **FAIL** here and a completeness failure besides.

Cite the step number on every finding: "step 4 has no counterpart in the candidate block".

## 3. Numeric fields

Every numeric field is a bare number with an explicit unit. Prose is a failure.

| Good | Bad |
|---|---|
| `25 minutes` | `about half an hour`, `quick` |
| `4 servings` | `serves a family` |
| `500 g`, `250 ml`, `6 pieces` | `a bunch`, `some`, `to taste` |
| `480 kcal`, `42 g protein` | `high protein` |
| `€4.80` | `cheap`, `a few euro` |

Money is EUR unless `requirements.md` `## Cooking Budget` names another currency; the symbol goes
before the number. A mix of currencies within one artifact is a **FAIL**.

## 4. Arithmetic

Recompute, do not trust:

- `Total` time = prep + cook, per recipe.
- Line costs sum to `Meal Cost` and `One-Time Pantry Total`; those two sum to `Total`.
- Budget delta = meal cost − stated budget, signed.
- Cost per serving = meal cost ÷ `requirements.md` `## Servings`.
- Scaled ingredient quantities equal native quantity × the stated scaling factor.

## 5. Report format

Return one block per artifact:

```
artifacts/candidate-recipes.md — PASS
  sections: all 5 present
  candidates: 3/3 carry every required block field; Completeness 2 "complete meal", 1 "needs a
    side — rice or noodles"
  citations: 3/3 source URLs well-formed, all traceable to a recorded fetch
  numerics: 3/3 candidates carry Total, Yields, and quantified ingredients
  arithmetic: prep + cook = Total holds for 3/3

artifacts/meal-plan.md — FAIL
  instructions: step 4 ("deglaze the pan with a splash of white wine") has no counterpart in the
    candidate's Instructions block — 6 steps in the plan against 5 in the source

artifacts/budget.md — FAIL
  arithmetic: line costs sum to €6.42, "Meal Cost" states €6.02 (delta €0.40)
```

Cite the artifact and the specific row for every finding. `FAIL` with no row reference is not
actionable and is itself a defect in the report.

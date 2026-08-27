## Method

All 4 of 4 candidates carried a published `Nutrition per serving:` line in `candidate-recipes.md`
— including the replacement chicken candidate ("20-Minute Meal-Prep Chicken, Rice and Broccoli"),
whose panel was already captured by `recipe-researcher` on this attempt. No lookup was performed;
every figure below is copied from the candidate artifact and cited to that candidate's own source
URL (path: `from candidate artifact`).

All figures are per serving, at the 2-servings-per-meal size stated in `requirements.md`; none
required whole-recipe-to-per-serving derivation (source pages already report per-serving figures).

`meal-plan-builder` has not run, so no day assignment exists yet. Rollups are computed over the
full 4-candidate pool (this is a 2-dinner plan, so only 2 of these 4 will ultimately be selected);
imbalance flags are raised per-recipe against the pool rather than per-day.

## Targets

not specified

## Per Recipe

| Recipe | kcal | Protein | Carbs | Fat | Source |
|---|---|---|---|---|---|
| 20-Minute Meal-Prep Chicken, Rice and Broccoli | 356 kcal | 26 g | 41 g | 9 g | https://gimmedelicious.com/20-minute-meal-prep-chicken-rice-and-broccoli/ (from candidate artifact) |
| Ginger Beef Stir Fry | 333 kcal | 30 g | 18 g | 17 g | https://www.theslowroasteditalian.com/ginger-beef-stir-fry/ (from candidate artifact) |
| Lemon Garlic Baked Salmon | 301 kcal | 34 g | 1 g | 17 g | https://kristineskitchenblog.com/lemon-garlic-baked-salmon/ (from candidate artifact) |
| Garlic Butter Shrimp | 173 kcal | 24 g | 3 g | 7 g | https://downshiftology.com/recipes/garlic-butter-shrimp/ (from candidate artifact) |

## Rollups

- Pool mean (4 candidates, per serving): 291 kcal, 28.5 g protein, 15.75 g carbs, 12.5 g fat
- Range: 173–356 kcal per serving
- Any 2-dinner selection from this pool (2 servings each, 4 servings total) will land within this
  range per meal; no per-day totals yet since `meal-plan-builder` has not assigned recipes to nights.

## Imbalance Flags

- Garlic Butter Shrimp: 173 kcal / 3 g carbs per serving is the lowest in the pool by a wide
  margin (pool mean 291 kcal) and, per the candidate artifact's own note, this figure covers only
  the shrimp-and-butter component — the recipe is not a complete plated dinner as written and is
  expected to be paired with the pantry's rice and broccoli. If selected without that pairing
  reflected in the actual cooked meal, the plated dinner's real calories/carbs will run well above
  this table's figure; if paired, this row understates the night's true totals.
- Pool spread: 173–356 kcal per serving is roughly a 2x range across the 4 candidates. If the two
  lowest-calorie candidates (Garlic Butter Shrimp, Lemon Garlic Baked Salmon) were both selected
  for the two dinners, the plan's two nights would be calorie-light relative to the two
  higher-calorie candidates (Chicken, Beef) — worth checking once `meal-plan-builder` selects the
  pair.
- No stated calorie/macro target exists in `requirements.md`, so no external-target deviation is
  flagged; the above are internal-skew findings only.

## Blockers

none

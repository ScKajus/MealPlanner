## Search Method

`WebSearch` + `WebFetch` only (no Spoonacular query this run — web search yielded enough
qualifying pages before the quota was worth spending). Queries run this attempt (retry, gate 1
tightened constraint: replace "One-Pan Chicken and Rice with Broccoli" — its source page carried
an internally inconsistent Prep 15 + Cook 30 = 45 vs. headline "Total: 30 minutes" — with a chicken
candidate whose source states an unambiguous total ≤25 minutes): "20 minute chicken broccoli rice
skillet recipe total time", "one pan chicken rice broccoli 25 minutes recipe". Two shortlisted
pages fetched in full: gimmedelicious.com (Prep 5 + Cook 15 = Total 20 minutes, internally
consistent) and bunsinmyoven.com (Prep 5 + Cook 20 = Total 25 minutes, internally consistent).
Kept the gimmedelicious recipe: it matches all three named pantry items (chicken, rice, broccoli)
directly, has the shorter and internally-consistent total time, and needs no new specialty
pantry item beyond one small quantity of sugar. Discarded bunsinmyoven — same time cap
compliance, but adds shredded cheddar and carrots and would not have improved the pool.

Prior-attempt queries (from attempt 1, retained for the other three candidates, which the
validator did not fault): "30 minute salmon dinner recipe not spicy", "30 minute pork stir fry
recipe mild", "30 minute shrimp skillet dinner recipe", "30 minute garlic butter shrimp and rice
skillet recipe (no cayenne)", "30 minute beef stir fry recipe soy sauce garlic ginger mild",
"quick teriyaki salmon rice broccoli recipe 25 minutes", "15 minute lemon garlic shrimp recipe
olive oil (no soy sauce)", "20 minute lemon garlic butter salmon recipe simple ingredients",
"quick garlic butter shrimp recipe no red pepper flakes 15 minutes". Every shortlisted page was
opened with `WebFetch` for real prep/cook times, yield, quantified ingredients, spice content,
and published nutrition panel — nothing cited from a snippet in either attempt.

Discarded after fetch (attempt 1): pork stir fry (healthyrecipesblogs.com, total 35 min > 30 min
cap, also contains sriracha); shrimp and rice skillet (acouplecooks.com, contains cayenne);
garlic butter shrimp and rice with lemon (laughingspatula.com, total 35 min > cap); sheet-pan
teriyaki salmon (tamingofthespoon.com, no spice but needs 3 new specialty pantry items — soy
sauce, red miso paste, mirin — on top of an already-used soy sauce elsewhere, over budget for
pantry footprint); lemon garlic shrimp (feelgoodfoodie.net, contains crushed red pepper).

4 candidates kept, covering 4 different proteins (chicken, beef, salmon, shrimp) so gate 3 has
real room to sequence two non-repeating nights. All 4 have a published nutrition panel and a real,
internally-consistent, source-stated total time ≤ 30 minutes (chicken now ≤ 20 minutes).
Constraint applied throughout: total time ≤ 30 minutes, nothing spicy, no repeat protein across
the two nights, ≤ 3 net-new pantry items across the pool.

## Candidates

### 20-Minute Meal-Prep Chicken, Rice and Broccoli

- Cuisine: American
- Primary protein: chicken
- Prep: 5 minutes | Cook: 15 minutes | **Total: 20 minutes**
- Yields: 4 servings (halves cleanly to 2)
- Tags: meal-prep, mild, weeknight, uses-pantry-chicken-rice-broccoli
- Nutrition per serving: 356 kcal, 26 g protein, 41 g carbs, 9 g fat (published panel on source page)
- New pantry items: none (paprika, cumin, garlic powder are common supermarket-rack ground
  spices covered under Staples; salt, pepper and olive oil are staples; the 1 tsp of sugar the
  recipe calls for is treated as an ordinary household item rather than a specialty baking good —
  see Assumptions)
- Source: https://gimmedelicious.com/20-minute-meal-prep-chicken-rice-and-broccoli/ (retrieved via web fetch)

Ingredients:
- 2 cups water
- 1 cup jasmine rice
- 0.75 tsp salt
- 4 chicken breasts, boneless skinless (4-6 oz each)
- 1 tsp brown or granulated sugar
- 0.5 tsp paprika
- 0.5 tsp cumin
- 0.5 tsp garlic powder
- salt and pepper, to taste
- 1 tbsp olive oil
- 2-3 cups broccoli florets
- water, for steaming

### Ginger Beef Stir Fry

- Cuisine: Asian-inspired
- Primary protein: beef
- Prep: 10 minutes | Cook: 20 minutes | **Total: 30 minutes**
- Yields: 4 servings (halves cleanly to 2)
- Tags: one-pan, mild, weeknight
- Nutrition per serving: 333 kcal, 30 g protein, 18 g carbs, 17 g fat (published panel on source page)
- New pantry items: soy sauce, sesame oil, cornstarch
- Source: https://www.theslowroasteditalian.com/ginger-beef-stir-fry/ (retrieved via web fetch)

Ingredients:
- 1 lb skirt steak, thinly sliced into 1/4-inch strips
- 0.25 tsp kosher salt
- 0.5 tsp ground black pepper
- 0.25 cup cornstarch
- 2 tbsp olive oil
- 1 lb fresh green beans, trimmed
- 1 tbsp water
- 0.5 cup soy sauce
- 3 cloves garlic, minced
- 1 tbsp fresh ginger, grated
- 1 tsp sesame oil
- chopped green onions, for garnish
- sesame seeds, for garnish

### Lemon Garlic Baked Salmon

- Cuisine: American/Mediterranean-leaning
- Primary protein: salmon
- Prep: 10 minutes | Cook: 20 minutes | **Total: 30 minutes**
- Yields: 4 servings (halves cleanly to 2)
- Tags: oven, mild, weeknight, low-carb-as-written
- Nutrition per serving: 301 kcal, 34 g protein, 1 g carbs, 17 g fat (published panel on source page)
- New pantry items: none (butter, olive oil, lemon, garlic and fresh herbs are dairy/produce/fresh aromatics)
- Source: https://kristineskitchenblog.com/lemon-garlic-baked-salmon/ (retrieved via web fetch)

Ingredients:
- 4 salmon fillets, about 6 oz each, skin on
- 1 tbsp melted butter
- 1 tbsp olive oil
- zest of 1 lemon
- juice of half a lemon
- 3 cloves garlic, minced
- 0.5 tsp kosher salt
- ground black pepper, to taste
- chopped fresh herbs (dill, parsley, thyme or chives), for serving

### Garlic Butter Shrimp

- Cuisine: American
- Primary protein: shrimp
- Prep: 5 minutes | Cook: 5 minutes | **Total: 10 minutes**
- Yields: 6 servings (scales down to 2 — roughly a third of the batch)
- Tags: skillet, mild, weeknight, fast
- Nutrition per serving: 173 kcal, 24 g protein, 3 g carbs, 7 g fat (published panel on source page)
- New pantry items: none (butter, garlic, lemon and parsley are dairy/fresh aromatics/produce)
- Source: https://downshiftology.com/recipes/garlic-butter-shrimp/ (retrieved via web fetch)

Ingredients:
- 4 tbsp butter
- 6 cloves garlic, minced
- 1.5 lb large shrimp
- kosher salt and ground black pepper, to taste
- 1 lemon, juiced (about 3 tbsp)
- 2 tbsp chopped parsley

Note: this recipe is shrimp-and-sauce only; it needs a starch/veg side (the pantry's rice and
broccoli pair with it directly) to read as a full dinner.

## Pantry Footprint

Distinct net-new pantry items across the pool: **soy sauce, sesame oil, cornstarch** (3 items,
all from the Ginger Beef Stir Fry candidate only). All three other candidates — including the
replaced chicken candidate — add zero new pantry items. Pool total: 3 of 3 — at the cap, not over
it. If the beef candidate is not selected, the chosen pair's pantry footprint drops to zero.

## Assumptions

- 20-Minute Meal-Prep Chicken, Rice and Broccoli: source page states Prep 5 min + Cook 15 min =
  Total 20 minutes with no internal contradiction; adopted as-is (sourced, not inferred). The
  recipe's 1 tsp of brown or granulated sugar is treated as an ordinary household item rather
  than a specialty baking good for pantry-footprint purposes, given the negligible quantity and
  near-universal availability (inferred — `requirements.md` Staples wording does not explicitly
  resolve sugar either way).
- Ginger Beef Stir Fry: source lists an optional rice wine vinegar; omitted here to avoid adding
  a fourth net-new pantry item for a non-essential ingredient (inferred).
- Yields: all four sources give 4 or 6 servings against the requested 2; scaling down assumed to
  scale ingredient quantities linearly (inferred, not stated on any source page).
- Garlic Butter Shrimp is a protein-and-sauce component rather than a complete plated dinner as
  written; pairing it with the pantry's on-hand rice and broccoli is assumed rather than sourced
  from the recipe page itself (inferred).

## Blockers

none

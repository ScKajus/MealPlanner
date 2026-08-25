# Meal Planner — Agentic Workflow

This document defines the execution rules for the `/plan-meals` agentic workflow: a
model-driven, hub-and-spoke system that plans meals from a natural-language request
(a single dish, a day, or a week) based on ingredients on hand, dietary restrictions,
time budget, servings, and cooking budget.

```
/plan-meals I have chicken breast, broccoli, and rice at home. Weeknight dinners for 2,
max 30 minutes cook time, nothing spicy, no repeat proteins two nights in a row,
budget $60 for the week.
```

Output: `meal-plan.html` (plus the Markdown artifacts it was built from), delivered
only after the user explicitly approves the plan.

A single coordinator gathers requirements, builds an execution plan, dynamically
selects which subagents actually need to run (e.g. `pantry-matcher` is skipped
entirely if the user has no ingredients on hand), enforces quality gates, and manages
the human-approval loop. **Every subagent owns exactly one artifact.**

---

## Execution Flow

```
requirements-formalizer
        │
        ▼
[recipe-researcher, pantry-matcher]   (parallel — both consume requirements only)
        │
        ▼
nutrition-checker                     (sequential — needs recipe-researcher's output)
        │
        ▼
[shopping-list-builder, budget-aggregator]   (parallel — both consume recipes + pantry-matcher + nutrition)
        │
        ▼
validator                             (quality gate — targeted retry, max 3)
        │
        ▼
meal-plan-builder                     (synthesis)
        │
        ▼
HUMAN APPROVAL  ──reject──▶ revise (loop back to meal-plan-builder with feedback)
        │ approve
        ▼
html-builder
```

`budget-aggregator` technically reads `shopping-list-builder`'s output, so it is
triggered on that subagent's completion rather than waiting for a whole
parallel-group barrier; both remain independent of `nutrition-checker`.

**Dynamic selection example:** a request for a single meal still runs
`budget-aggregator`, just with a trivial scope. If the user gave no pantry items,
the coordinator skips `pantry-matcher` and `shopping-list-builder` treats every
ingredient as "to buy."

---

## Coordinator (`/plan-meals` orchestrator)

- Parses the initial request; invokes `requirements-formalizer` and, if information
  is missing (no time budget, no serving count, etc.), asks the user directly and
  waits for confirmation before planning.
- Builds the execution plan (which subagents run, in what order/parallel groups)
  based on the confirmed requirements — e.g. no pantry items → skip `pantry-matcher`.
- Dispatches subagents sequentially or in parallel per the flow above.
- Invokes `validator` after each gated stage; on failure, maps the failure to the
  specific agent(s) that produced the bad artifact, re-runs only those (and anything
  downstream of them), **up to 3 retries per gate**. If unresolved after 3 retries,
  halts downstream execution and reports the failure clearly to the user.
- Enforces the human-approval gate before `html-builder` ever runs, via the
  `approval-gate-guard` hook — not just instruction-following.
- Persists workflow state after every artifact write (via the `post-write-state`
  hook) and can resume a workflow from `workflow-state.json` without re-running
  completed steps.
- Produces no meal content itself — purely orchestration.

---

## Subagents

| Subagent | Owns artifact | Depends on | Runs |
|---|---|---|---|
| `requirements-formalizer` | `requirements.md` | initial request + user Q&A | first, sequential |
| `recipe-researcher` | `candidate-recipes.md` | `requirements.md` | parallel w/ pantry-matcher |
| `pantry-matcher` | `pantry-match.md` | `requirements.md` | parallel w/ recipe-researcher |
| `nutrition-checker` | `nutrition.md` | `candidate-recipes.md` | sequential |
| `shopping-list-builder` | `shopping-list.md` | `candidate-recipes.md`, `pantry-match.md` | parallel w/ budget-aggregator |
| `budget-aggregator` | `budget.md` | `shopping-list.md` | triggered on shopping-list-builder completion |
| `validator` | `validation-report.md` | all artifacts above | gate |
| `meal-plan-builder` | `meal-plan.md` | validated artifacts | synthesis |
| `html-builder` | `meal-plan.html` | approved `meal-plan.md` | final |

- **`requirements-formalizer`** — Formalizes the request and any clarifying Q&A into
  structured requirements: ingredients on hand, dietary restrictions/allergies,
  servings, time budget per meal, number of meals/days requested, cooking budget,
  cuisine preferences, repeat-avoidance rules. Confirms with the user before
  handing off.
- **`recipe-researcher`** — Searches for candidate recipes via the recipe MCP
  server and/or web search. Each candidate includes ingredients, prep/cook time,
  and a real source link (required for the citation gate). Must call out to the
  MCP/web search rather than inventing recipes from training data.
- **`pantry-matcher`** — Cross-references candidate recipes against ingredients the
  user already has, flagging what's covered vs. what needs buying. Skipped by the
  coordinator if the user listed no pantry items.
- **`nutrition-checker`** — Estimates calories/macros per recipe and per day/week,
  flags imbalance (e.g. all-carb days, protein too low relative to servings). Must
  call out to the MCP/web search rather than inventing nutrition estimates.
- **`shopping-list-builder`** — Aggregates missing ingredients (from
  `pantry-matcher`, or all ingredients if it was skipped) across every chosen
  recipe into one consolidated, deduplicated list.
- **`budget-aggregator`** — Estimates the shopping list's cost and compares it to
  the user's stated budget.
- **`validator`** — Runs the `artifact-validator` skill against every artifact from
  the current stage; reports pass/fail with specific findings per gate.
- **`meal-plan-builder`** — Merges all validated artifacts into the final
  day-by-day (or single-meal) plan artifact.
- **`html-builder`** — Renders the *approved* plan as a standalone HTML document
  using the `meal-plan-html-theme-builder` skill. Blocked from running until
  approval, enforced by the `approval-gate-guard` hook.

---

## Quality Gates (enforced by `validator`)

1. Every recipe's total time ≤ user's stated max cook time.
2. No recipe violates a stated dietary restriction or allergy.
3. No repeated protein/recipe on consecutive days, if the user requested this.
4. Every recipe cites a real, working source link.
5. Nutrition is roughly balanced across the plan (no single day wildly skewed;
   respects a calorie target if the user gave one).
6. Shopping list total estimated cost ≤ user's budget.
7. Every requested day/meal slot in the plan is filled — no gaps.

On failure, the coordinator identifies which subagent(s) produced the failing
artifact (e.g. gate 1 failure → re-run `recipe-researcher` with a tightened time
constraint) and re-runs only those, then anything downstream that depends on them,
up to 3 attempts. If still failing after 3 attempts, execution for that branch
stops and the failure is reported to the user in plain language, rather than
silently producing a plan that violates the requirement.

---

## Human Approval

After `meal-plan-builder` produces `meal-plan.md`, the coordinator presents it to
the user and requires an explicit approve/reject response before `html-builder`
can run. This is enforced deterministically by the `approval-gate-guard`
`PreToolUse` hook, which blocks the HTML-writing tool call unless
`workflow-state.json` records an `approved: true` status set by a real user
response — never inferred from conversation tone. On rejection, the user's
feedback is captured, `meal-plan-builder` re-runs incorporating it, and the plan
is resubmitted for approval. This loop repeats until approved.

---

## Skills (reusable)

- **`artifact-validator`** — Generic structural + citation check applied to any
  Markdown artifact before the next stage is allowed to run: verifies expected
  sections are present, every recipe/claim has a real source link, and numeric
  fields (time, cost, calories) are present and well-formed. Reused by `validator`
  for every gated artifact.
- **`meal-plan-html-theme-builder`** — Reusable HTML rendering rules and a
  predefined template (recipe-card / weekly-planner visual style) used by
  `html-builder` to turn the approved Markdown plan into the final HTML
  deliverable.

---

## Hooks

- **`PreToolUse` → `approval-gate-guard`** — Blocks the final HTML-writing tool
  call until `workflow-state.json` shows the plan is approved.
- **`PreToolUse` → `no-leak-guard`** — Prevents internal artifact filenames/agent
  names from leaking into user-facing output.
- **`PostToolUse` → `post-write-state`** — After every artifact write, updates
  persisted `workflow-state.json` with what's completed, what's pending, and
  current retry counts — this is what makes resume-after-interruption possible.

---

## MCP Integration

Primary: [`suraj-yadav-aiml/recipe-mcp`](https://github.com/suraj-yadav-aiml/recipe-mcp)
— an MCP server over TheMealDB with recipe search, storage, and meal-planning
tools. TheMealDB's public test key keeps setup low-friction with no real secrets
committed.

Optional: [`edamam-llc/mcp-edamam-food`](https://github.com/edamam-llc/mcp-edamam-food)
for richer nutrition data in `nutrition-checker` if TheMealDB's nutrition info
proves too thin. Requires the user's own Edamam API credentials, documented in
`README.md`, excluded via `.gitignore`/`.env.example`, never committed.

`recipe-researcher` and `nutrition-checker` must always call out to the MCP
and/or web search rather than inventing recipes or nutrition estimates from
training data.

---

## State Persistence & Resume

`workflow-state.json` (updated by the `post-write-state` hook after every
artifact write) records:
- the run ID and original request,
- confirmed requirements,
- which subagents have completed, are pending, or failed, with retry counts per
  gate,
- the current approval status,
- paths to all artifacts produced so far.

On restart, the coordinator reads this file first. Any stage marked `completed`
is not re-run; execution resumes from the first `pending`/`failed` stage.

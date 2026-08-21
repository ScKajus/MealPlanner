# CLAUDE.md

## Project overview

Meal Planner is an **agentic workflow built with the Claude Agent SDK**, not a conventional application.
It uses the same .claude/ conventions as Claude Code (CLAUDE.md, commands, subagents) but runs as its own program.
A user describes what they want to eat in plain language — one dish, one day, or a whole week — and the
workflow analyzes the request, gathers missing requirements, plans the work, dynamically selects the
subagents the request actually needs, executes them, and produces a human-readable meal plan.

There is exactly one entry point: the `/plan-meals` slash command, passed as the prompt string
to the SDK's `query()` call from the app's own runner.

```
/plan-meals I have chicken breast, broccoli, and rice at home. Weeknight dinners for 2,
max 30 minutes cook time, nothing spicy, no repeat proteins two nights in a row,
budget $60 for the week.
```

The final deliverable is `meal-plan.html`, backed by the Markdown artifacts it was rendered from.
**The HTML is produced only after the user explicitly approves the plan.**

Implementation is hybrid: `.claude/` Markdown drives orchestration and reasoning; TypeScript in
`src/tools/` does anything that must be deterministic (cost arithmetic, constraint validation,
Markdown→HTML rendering). If a step can be wrong in a way a human would notice — a budget total, a
"no repeat proteins" violation — it belongs in TypeScript, not in a prompt.

## Repo layout

Run the app (`npm run start`) from this directory, `MealPlanner/` — it is the git repo root. 
`.claude/settings.json` and hooks load only from this exact directory; CLAUDE.md, skills, commands,
and agents resolve from here up through parent directories to the repo root, so running from the
root keeps everything in one place.

```
.claude/CLAUDE.md                  # this file — loads at the start of every session
.claude/commands/plan-meals.md     # planned: the slash command; the orchestrator
.claude/agents/*.md                # planned: one file per subagent (see roster below)
src/index.ts                       # entry point
src/tools/                         # planned: deterministic helpers, callable from agents
tsconfig.json                      # strict ESM/nodenext — read it before writing TS
artifacts/<run-id>/                # planned: per-run Markdown artifacts + the final HTML
```

`artifacts/` is committed — the outputs are the deliverable. `dist/` is ignored.

## Commands

Run from this directory. Node ≥ 22 required.

| Command | What it does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` — the fast correctness check, run after editing `src/` |
| `npm run build` | `tsc` → `dist/` |
| `npm run start` | `node dist/index.js` |
| `npm run dev` | `node --watch src/index.ts` |

## Workflow contract

The orchestrator always runs these six phases in order. Do not skip a phase; skipping *subagents*
inside phase 5 is the point, skipping phases is not.

1. **Intake** — create `artifacts/<run-id>/` and write the user's raw request verbatim to
   `00-request.md`. Never paraphrase the request before recording it.
2. **Requirements** — parse the request into structured constraints and write `01-constraints.md`:
   pantry on hand, servings, time budget per meal, dietary restrictions and dislikes, variety rules,
   money budget, and **horizon** (single dish / one day / one week). Use `AskUserQuestion` only when 
   a missing value would materially change the plan — servings and
   horizon usually qualify, a preferred cuisine usually does not. Otherwise state the assumption in
   `01-constraints.md` and move on. `AskUserQuestion` is a real SDK tool, but this app has no built-in
   chat UI to render its multiple-choice prompts — `src/index.ts` is responsible for presenting the
   options to the user and returning their answer to the tool call.
3. **Work plan** — write the step list, and record **which subagents were selected and why**. This
   record is part of the deliverable: it is the evidence that selection was dynamic.
4. **Selection** — apply the rules in the roster below to the constraints from phase 2.
5. **Execute** — run the selected subagents; each writes its own numbered Markdown artifact.
6. **Approve → render** — present the plan in chat as Markdown, then **stop and wait**. Only after
   explicit user approval does `html-renderer` run and `meal-plan.html` appear on disk.

## Subagent roster and selection rules

Selection is driven by the constraints, not by a fixed chain. A single-dish request should visibly
run fewer subagents than a budgeted week.

| Subagent | Selected when | Writes |
| --- | --- | --- |
| `requirements-analyst` | always | `01-constraints.md` |
| `recipe-researcher` | always — live `WebSearch`/`WebFetch`, every recipe carries its source URL | `02-candidates.md` |
| `price-scout` | a money budget or any cost question is present | `03-costs.md` |
| `meal-plan-composer` | horizon is a day or a week (skipped for a single dish) | `04-plan.md` |
| `constraint-auditor` | always — validates the plan against `01-constraints.md` | audit section in `04-plan.md` |
| `shopping-list-builder` | pantry was given, or horizon is more than one dish | `05-shopping-list.md` |
| `nutrition-analyst` | user asks about calories, macros, or a health goal | `06-nutrition.md` |
| `html-renderer` | **only after explicit approval** | `meal-plan.html` |

When `constraint-auditor` reports a violation, hand it back to `meal-plan-composer` for **one**
repair pass. If it still fails, surface the conflict to the user as an explicit trade-off
("$60 and no repeat proteins are not both reachable with 30-minute meals — which gives?") rather
than silently shipping a plan that breaks a stated rule.

## Artifact conventions

- Run id: `YYYY-MM-DD-<short-slug>`, e.g. `2026-08-21-weeknight-dinners-2`.
- Filenames are stable and numbered: `00-request.md`, `01-constraints.md`, `02-candidates.md`,
  `03-costs.md`, `04-plan.md`, `05-shopping-list.md`, `06-nutrition.md`, `meal-plan.html`.
  Numbers skip when a subagent wasn't selected — that gap is legitimate signal.
- Every artifact stands alone: a human opening `04-plan.md` cold should understand it without
  reading the other files or the transcript.
- `meal-plan.html` is a single self-contained file — inline CSS, no external stylesheets, scripts,
  fonts, or images. It must be openable from disk with no network.

## Hard rules

- **No HTML before approval.** Presenting the plan is not approval. "Looks good", "yes", "go ahead"
  is approval. Silence is not.
- **Never invent a price, a recipe, or a source URL.** Prices come from `price-scout`'s actual
  lookups; where only an estimate is possible, label it `(estimated)` and say what it was based on.
- **Constraints are checked in code, not by eye.** Budget totals, cook-time limits, and variety
  rules go through `src/tools/` validators. A prompt saying "make sure it fits" is not a check.
- **Respect the pantry.** Ingredients the user already has are excluded from the shopping list and
  from the budget total, and should pull the plan toward using them up.
- **Record the reasoning.** Which subagents ran, which were skipped, and why — in `04-plan.md`.

## TypeScript conventions

`tsconfig.json` is strict; these are the settings that will bite:

- **ESM with `nodenext`** — relative imports need the `.js` extension: `import { cost } from "./cost.js"`.
- **`noUncheckedIndexedAccess`** — `arr[i]` is `T | undefined`. Guard it; don't reach for `!`.
- **`exactOptionalPropertyTypes`** — omit an optional key rather than assigning `undefined` to it.
- **`verbatimModuleSyntax`** — type-only imports must use `import type`.

Tools in `src/tools/` are pure functions with a thin CLI wrapper, so agents can invoke them from the
shell and tests can import them directly. Keep I/O at the edges; the arithmetic and the validation
stay pure.

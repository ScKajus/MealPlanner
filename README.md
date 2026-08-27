# Meal Planner

An agentic `/plan-meals` workflow for Claude Code. Give it what's in your fridge, your
constraints, and a budget; it researches real recipes, checks nutrition, builds a shopping
list, validates the whole thing against quality gates, and — once you approve — renders a
meal plan.

The workflow itself is specified in [`.claude/CLAUDE.md`](.claude/CLAUDE.md). This file
covers **setup**, which is mostly about getting the MCP server connected.

---

## Quick start

```sh
cd MealPlanner
npm install
```

Set your Spoonacular API key (see below), **launch Claude Code from `MealPlanner/`**, and
run:

```
/mcp
```

You should see `spoonacular` connected.

---

## The `spoonacular` MCP server

Registered in [`.mcp.json`](.mcp.json), which is committed but contains only a `${VAR}`
reference — **the key is never written into the repo**. It runs
[`spoonacular-mcp`](https://github.com/ddsky/spoonacular-mcp) straight from npm via `npx`,
pinned to `1.0.0` so a future publish can't silently rename tools out from under the
agents.

| Tool | Used for |
|---|---|
| `search_recipes` | `recipe-researcher`'s primary sweep — filters on diet, cuisine, intolerances, included/excluded ingredients |
| `get_recipe_information` | Full detail; pass `includeNutrition: true` for `nutrition-checker` |
| `analyze_nutrition` | Per-serving macros from a raw ingredient list, when a recipe has no published panel |
| `find_recipes_by_ingredients` | Recipes buildable from what's already in the pantry |
| `search_ingredients` | Ingredient lookup |
| `get_random_recipes` | Suggestions with optional filtering |

This is not optional garnish. Both [`recipe-researcher`](.claude/agents/recipe-researcher.md)
and [`nutrition-checker`](.claude/agents/nutrition-checker.md) carry a hard rule — *never
invent a recipe*, *never invent a nutrition estimate* — with the MCP server as the primary
path and web search only as fallback. Quality gate 4 (every recipe cites a real source
link) depends on it.

### Getting the key

1. Register an account from [spoonacular.com/food-api](https://spoonacular.com/food-api).
2. Once logged in, the key is on the API console's
   [Profile tab](https://spoonacular.com/food-api/console#Profile).

**Budget it carefully — the free plan is tighter than it looks.** It gives **50 points per
day**, and points are not requests: the API meters per endpoint. A recipe search costs 1
point plus 0.01 per recipe returned (plus 0.025 per recipe when nutrition is included), and
a recipe lookup costs about 1 point.

`recipe-researcher` over-supplies candidates by only about **1.4×** (5 dinners → 7
candidates), and treats Spoonacular as a secondary source behind web search + fetch, so a
week-sized run typically spends well under 10 points — often zero. The quota is unlikely to
be what limits you.

Spoonacular has not earned a larger role here: its records frequently report a placeholder
`readyInMinutes: 45`, so yield against a tight time cap is poor, and `analyze_nutrition`
has returned parsed-ingredient data with no macros at all. Both agents are told to stop
querying it rather than spend points confirming that twice in one run.

### Setting the key

> **Claude Code does not read `.env`.** The `${SPOONACULAR_API_KEY}` reference in
> `.mcp.json` expands from the environment of the shell that launched Claude Code. Copying
> `.env.example` to `.env` is useful as your own record, but it will not by itself connect
> anything.

Pick one:

**Option A — shell environment** (works everywhere, nothing extra gitignored):

```powershell
# PowerShell, current session
$env:SPOONACULAR_API_KEY = "..."
claude
```

```powershell
# PowerShell, persisted for future sessions
[Environment]::SetEnvironmentVariable("SPOONACULAR_API_KEY", "...", "User")
```

**Option B — `.claude/settings.local.json`** (persists per-project, no shell setup):

```json
{
  "env": {
    "SPOONACULAR_API_KEY": "..."
  }
}
```

That file is gitignored. Verify with `git check-ignore .claude/settings.local.json` before
you put a real key in it.

### Launch from `MealPlanner/`

`.mcp.json` is discovered relative to the directory Claude Code starts in. Starting from
`c:\MealPlannerProject\` instead will leave the server unregistered — `/mcp` will show
nothing and the agents will silently fall back to web search.

---

## Verifying without Claude Code

Handshake and tool listing. The key can be a dummy value; this only exercises the protocol,
not the API:

```sh
printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | SPOONACULAR_API_KEY=dummy npx -y spoonacular-mcp@1.0.0
```

Expect an `initialize` result followed by all six tools.

---

## Scripts

| Script | Does |
|---|---|
| `npm run build` | `tsc` → `dist/` |
| `npm run typecheck` | `tsc --noEmit` |

`dist/` contains compiled output from an earlier, abandoned TheMealDB `recipe-mcp` server
whose source is gone. It is gitignored, unreferenced, and inert.

---

## Enforcement

The human-approval gate is enforced deterministically, not by instruction-following. The
`approval-gate-guard` `PreToolUse` hook
([`.claude/hooks/approval-gate-guard.mjs`](.claude/hooks/approval-gate-guard.mjs),
registered in [`.claude/settings.json`](.claude/settings.json)) blocks **any** write of
`meal-plan.html` unless `workflow-state.json` records `approved: true` *and* an explicit
`approve` response in `approvalHistory`. It fails closed: a missing or unreadable state
file blocks, and so does an unparseable hook payload that mentions the guarded filename.
`html-builder` checks the same state itself, and the coordinator only ever writes the flag
in response to a real user message — three independent guards.

Two skills back the pipeline: [`artifact-validator`](.claude/skills/artifact-validator/)
(structural and citation checks, used by `validator`) and
[`meal-plan-html-theme-builder`](.claude/skills/meal-plan-html-theme-builder/) (the HTML
rendering contract, used by `html-builder`). Both agents are explicitly forbidden from
substituting any other skill for these — reaching for a similarly-named built-in was a real
and expensive failure once.

There is no `no-leak-guard` or `post-write-state` hook. Keeping internal names out of
user-facing prose is an instruction, and the coordinator writes `workflow-state.json`
itself after every stage rather than relying on a hook to do it.

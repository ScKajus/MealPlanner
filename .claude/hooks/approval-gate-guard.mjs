#!/usr/bin/env node
// PreToolUse guard: refuse any write of the final HTML deliverable unless
// workflow-state.json records an explicit user approval.
//
// Exit 0 = allow. Exit 2 = block, with the reason on stderr fed back to the agent.
// Any internal error must FAIL CLOSED on the guarded path: this is the one gate
// that must never fail open.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const SEP = String.fromCharCode(92); // backslash, without a literal escape
const GUARDED = /(^|[/])meal-plan[.]html$/i;
const guarded = (v) => GUARDED.test(String(v).split(SEP).join("/"));

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let event;
try {
  event = JSON.parse(raw || "{}");
} catch {
  // Unparseable payload: we cannot read the path, so we cannot clear it. If the raw
  // text mentions the guarded file at all, fail closed.
  if (raw.includes("meal-plan.html")) {
    console.error(
      "Blocked: the hook could not parse its input and cannot confirm this is not the " +
        "final HTML deliverable. Failing closed."
    );
    process.exit(2);
  }
  process.exit(0);
}

const path = event?.tool_input?.file_path ?? event?.tool_input?.notebook_path ?? "";
if (!guarded(path)) process.exit(0);

const projectDir = event?.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();

let state;
try {
  state = JSON.parse(readFileSync(join(projectDir, "workflow-state.json"), "utf8"));
} catch {
  console.error(
    "Blocked: the final HTML deliverable cannot be written because workflow-state.json " +
      "is missing or unreadable, so no approval is on record. Ask the user to approve the " +
      "plan; the coordinator records the approval, and only then may this file be written."
  );
  process.exit(2);
}

if (state?.approved !== true) {
  console.error(
    'Blocked: workflow-state.json has "approved": ' +
      JSON.stringify(state?.approved ?? null) +
      ". The plan has not been explicitly approved by the user. Present the plan and ask " +
      "for an explicit approve or reject; do not infer approval from conversation tone, " +
      "and do not write this file to a temporary path instead."
  );
  process.exit(2);
}

const history = Array.isArray(state.approvalHistory) ? state.approvalHistory : [];
if (!history.some((e) => e?.response === "approve")) {
  console.error(
    'Blocked: "approved": true is set but approvalHistory contains no "approve" entry. ' +
      "An approval with no recorded user response is not an approval."
  );
  process.exit(2);
}

process.exit(0);

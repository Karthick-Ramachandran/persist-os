#!/usr/bin/env bash
# A/B evaluation for Persist 1.4.0 (brief Part E): does the 1.4.0 rules+skills
# shape restore the 0.6.x behavior of recording the integer-cents decision and
# following it in a fresh session?
#
# For each version under test (0.6.1, 1.2.4, 1.3.0, and this branch's build):
#   1. Fresh Splitr clone from ~/oss/persist-demos/splitr-template, that
#      version's `persist init`, hooks on.
#   2. Demo scene 2 prompt (the integer-cents decision) then scene 3 prompt
#      (the tip feature), each in a real Claude Code session, headless
#      (`claude -p`), one fresh session per scene.
#   3. Records: ADR written+accepted, Applies To, float math on money in the
#      diff, tests passing, whether the agent ran doctor, and the full diff.
#
# Each version runs three times (agents vary). Claude Code's auto memory for
# the clone paths is cleared between runs (see persist-demos/scripts/reset.sh),
# or the runs contaminate each other. Real usage is limited to these two scenes.
#
# Usage:
#   scripts/eval/agent-ab.sh run <version> <run#>   # one version x one run
#   scripts/eval/agent-ab.sh matrix                 # all versions x 3 runs
#   scripts/eval/agent-ab.sh table                  # results table from disk
#
# Env overrides: PERSIST_AB_ROOT (default /tmp/persist-ab) holds builds, runs,
# and results. KIT (default ~/oss/persist-demos) holds the Splitr template.
# NEW_BUILD_CLI defaults to this repo's dist/cli.js. This script is not part of
# the published package (scripts/ never ships; see scripts/check-package.mjs).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AB_ROOT="${PERSIST_AB_ROOT:-/tmp/persist-ab}"
KIT="${KIT:-$HOME/oss/persist-demos}"
NEW_BUILD_CLI="${NEW_BUILD_CLI:-$REPO_ROOT/dist/cli.js}"
VERSIONS="0.6.1 1.2.4 1.3.0 new"
RUNS="1 2 3"

SCENE2_PROMPT='Heads up before we build anything else: all money in Splitr is integer cents. Never floats, not even in intermediate math. Round once, at the point a fraction appears, and make sure the pieces still add up to the total.'
SCENE2_FOLLOWUP='Record that as a decision.'
SCENE3_PROMPT='Add an optional tip to expenses: a tip percentage field next to the amount. The tip is added on top of the amount, and the total is what gets split.'

cli_for() {
  if [ "$1" = "new" ]; then
    printf '%s' "$NEW_BUILD_CLI"
  else
    printf '%s' "$AB_ROOT/builds/v$1/dist/cli.js"
  fi
}

# A `persist` shim pinned to the version under test, first on PATH for agent
# sessions. Without it the agent finds whatever global `persist` the machine has
# (here 1.3.0) and runs a foreign doctor against the version's memory — which is
# exactly what contaminated the first 0.6.1 pass before this shim existed.
shim_for() {
  local dir="$AB_ROOT/shims/$1"
  if [ ! -x "$dir/persist" ]; then
    mkdir -p "$dir"
    printf '#!/bin/sh\nexec node "%s" "$@"\n' "$(cli_for "$1")" >"$dir/persist"
    chmod +x "$dir/persist"
  fi
  printf '%s' "$dir"
}

# Delete the run directory and Claude Code's auto memory for it, non-interactively
# (same keys as persist-demos/scripts/reset.sh, which asks before deleting).
reset_run() {
  local dir="$1"
  rm -rf "$dir"
  local key
  key="$(printf '%s' "$dir" | sed 's/[^A-Za-z0-9]/-/g')"
  rm -rf "$HOME/.claude/projects/$key/memory"
}

setup_clone() {
  local version="$1" run="$2" dir="$3" cli="$4"
  reset_run "$dir"
  mkdir -p "$dir"
  rsync -a --exclude node_modules --exclude data "$KIT/splitr-template/" "$dir/"
  ln -s "$KIT/splitr-template/node_modules" "$dir/node_modules"
  git -C "$dir" init -q -b main
  git -C "$dir" config user.email "ab@example.com"
  git -C "$dir" config user.name "AB eval"
  git -C "$dir" add -A
  git -C "$dir" commit -q -m "Splitr: expenses, balances, settle up"
  local remote="$AB_ROOT/remotes/splitr-$version-r$run.git"
  rm -rf "$remote"
  git init -q --bare "$remote"
  git -C "$dir" remote add origin "$remote"
  git -C "$dir" push -q -u origin main
  # Fresh memory always: init writes the version's rules, skills, and hooks.
  # 0.6.1 predates --yes (its init takes no prompting flags), so it inits bare.
  if [ "$version" = "0.6.1" ]; then
    (cd "$dir" && node "$cli" init >/dev/null)
  else
    (cd "$dir" && node "$cli" init --yes >/dev/null)
  fi
  git -C "$dir" config core.hooksPath .persist/hooks || true
  git -C "$dir" add -A
  git -C "$dir" commit -q -m "Persist OS $version memory" --no-verify
  git -C "$dir" rev-parse HEAD
}

# One headless Claude Code session. Saved as stream-json (every assistant message
# with tool uses, plus the final result event) with the result text and the tool
# inventory extracted beside it. Exits 0 even when the agent errors, so one bad
# scene cannot abort the matrix; the failure is recorded instead.
run_scene() {
  local version="$1" dir="$2" out="$3" prompt="$4"
  (cd "$dir" && PATH="$(shim_for "$version"):$PATH" claude -p "$prompt" --output-format stream-json --verbose --dangerously-skip-permissions >"$out" 2>"$out.stderr") || true
  node -e '
const fs = require("fs");
const out = process.argv[1];
let result = "", tools = [], cost = "", turns = "";
for (const line of fs.readFileSync(out, "utf8").split("\n")) {
  if (!line.trimStart().startsWith("{")) continue;
  let event;
  try { event = JSON.parse(line); } catch (e) { continue; }
  if (event.type === "assistant" && event.message && Array.isArray(event.message.content)) {
    for (const block of event.message.content) {
      if (block.type === "tool_use") {
        const input = block.input || {};
        tools.push(block.name + (input.command ? " :: " + String(input.command).slice(0, 160) : ""));
      }
    }
  }
  if (event.type === "result") {
    result = event.result ?? "";
    cost = event.total_cost_usd ?? "";
    turns = event.num_turns ?? "";
  }
}
fs.writeFileSync(out + ".result.txt", result);
fs.writeFileSync(out + ".tools.txt", tools.join("\n") + "\n");
fs.writeFileSync(out + ".meta.txt", "cost_usd=" + cost + " turns=" + turns + "\n");
' "$out" || true
}

adr_state() {
  local dir="$1"
  local accepted proposed
  accepted="$(find "$dir/docs/adrs" -maxdepth 1 -name 'ADR-[0-9]*-*.md' 2>/dev/null | head -n 5 || true)"
  proposed="$(find "$dir/docs/adrs/proposed" -name '*.md' 2>/dev/null | head -n 5 || true)"
  printf 'accepted:%s\nproposed:%s\n' "$accepted" "$proposed"
}

applies_to() {
  local dir="$1"
  local file
  file="$(find "$dir/docs/adrs" -maxdepth 1 -name 'ADR-[0-9]*-*.md' 2>/dev/null | head -n 1 || true)"
  if [ -z "$file" ]; then
    printf 'none'
    return
  fi
  # A path bullet under ## Applies To (backticks optional, like the reader).
  if awk '/^## Applies To/{f=1;next}/^## /{f=0}f' "$file" | grep -Eq '^[[:space:]]*[-*][[:space:]]+`?[^`[:space:]]+'; then
    printf 'yes'
  else
    printf 'no'
  fi
}

harvest_run() {
  local version="$1" run="$2" dir="$3" res="$4" base="$5"
  mkdir -p "$res"
  # Worktree against the post-scene-2 commit: scene 3 is usually uncommitted,
  # and `base..HEAD` would show nothing in exactly that case.
  git -C "$dir" diff "$base" -- . ':!node_modules' >"$res/diff-full.txt" || true
  {
    printf '=== float-math candidates in scene diff ===\n'
    grep -nE 'Math\.(floor|round|ceil)|[^a-zA-Z]/ ?[0-9a-zA-Z(]' "$res/diff-full.txt" | grep -viE '^\s*(#|//|\*)' || true
  } >"$res/float-candidates.txt"
  local tests doctor_agent doctor_status
  if (cd "$dir" && npm test --silent >/dev/null 2>&1); then tests="pass"; else tests="fail"; fi
  # Evidence is a Bash tool call whose command runs doctor — not merely prose
  # mentioning it.
  if grep -Eq 'Bash :: .*doctor' "$res/scene2.json.tools.txt" "$res/scene3.json.tools.txt" "$res/scene2-followup.json.tools.txt" 2>/dev/null; then doctor_agent="yes"; else doctor_agent="no"; fi
  if (cd "$dir" && node "$(cli_for "$version")" doctor >/dev/null 2>&1); then doctor_status="pass"; else doctor_status="fail($?)"; fi
  cat >"$res/row.json" <<EOF
{"version": "$version", "run": $run, "tests": "$tests", "agent_ran_doctor": "$doctor_agent", "doctor_now": "$doctor_status"}
EOF
  printf '%s\n' "--- $version run $run: tests=$tests agent_doctor=$doctor_agent doctor=$doctor_status"
}

do_run() {
  local version="$1" run="$2"
  local cli dir res
  cli="$(cli_for "$version")"
  dir="$AB_ROOT/runs/splitr-$version-r$run"
  res="$AB_ROOT/results/splitr-$version-r$run"
  rm -rf "$res"
  mkdir -p "$res"
  echo "==> $version run $run: $dir"
  local base
  base="$(setup_clone "$version" "$run" "$dir" "$cli")"
  echo "$base" >"$res/base-commit.txt"

  # Scene 2: the integer-cents decision, one fresh session.
  run_scene "$version" "$dir" "$res/scene2.json" "$SCENE2_PROMPT"
  local state
  state="$(adr_state "$dir")"
  printf '%s\nfollowup: none yet\n' "$state" >"$res/scene2-adr.txt"
  if ! printf '%s' "$state" | grep -qE 'accepted:.+\.md|proposed:.+\.md'; then
    # The agent did not record the decision by itself; the demo follows up once.
    run_scene "$version" "$dir" "$res/scene2-followup.json" "$SCENE2_FOLLOWUP"
    state="$(adr_state "$dir")"
    printf '%s\nfollowup: Record that as a decision.\n' "$state" >"$res/scene2-adr.txt"
  fi

  # Accept what the agent proposed, the way the demo's human does, then commit.
  local proposal
  proposal="$(find "$dir/docs/adrs/proposed" -name '*.md' 2>/dev/null | head -n 1 || true)"
  if [ -n "$proposal" ]; then
    local slug
    slug="$(basename "$proposal" .md | sed 's/^ADR-PROPOSED-//')"
    (cd "$dir" && node "$cli" adr accept "$slug" >/dev/null 2>&1) || true
    (cd "$dir" && git add -A && git commit -q -m "Accept integer-cents ADR" --no-verify) || true
  else
    (cd "$dir" && git add -A && git commit -q -m "Scene 2 working tree" --no-verify) || true
  fi
  printf 'applies_to: %s\n' "$(applies_to "$dir")" >>"$res/scene2-adr.txt"
  git -C "$dir" rev-parse HEAD >"$res/scene2-commit.txt"

  # Scene 3: the tip feature, one fresh session (the -p call itself is the /clear).
  run_scene "$version" "$dir" "$res/scene3.json" "$SCENE3_PROMPT"
  git -C "$dir" rev-parse HEAD >"$res/scene3-commit.txt"

  harvest_run "$version" "$run" "$dir" "$res" "$(cat "$res/scene2-commit.txt")"
}

do_table() {
  printf '| version | run | ADR accepted | Applies To | float math on money | tests | agent ran doctor | doctor now |\n'
  printf '| --- | --- | --- | --- | --- | --- | --- | --- |\n'
  for version in $VERSIONS; do
    for run in $RUNS; do
      local res="$AB_ROOT/results/splitr-$version-r$run"
      if [ ! -f "$res/row.json" ]; then
        printf '| %s | %s | no data | no data | no data | no data | no data | no data |\n' "$version" "$run"
        continue
      fi
      local accepted applies tests agent doctor
      accepted="$(grep -c . "$res/scene2-adr.txt" >/dev/null; grep -E '^accepted:.+\.md' "$res/scene2-adr.txt" >/dev/null && echo yes || echo no)"
      applies="$(grep -E '^applies_to:' "$res/scene2-adr.txt" | awk '{print $2}')"
      tests="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).tests)' "$res/row.json")"
      agent="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).agent_ran_doctor)' "$res/row.json")"
      doctor="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).doctor_now)' "$res/row.json")"
      local float
      float="$(grep -cv '^===' "$res/float-candidates.txt" 2>/dev/null || true)"
      printf '| %s | %s | %s | %s | candidates:%s (see diff) | %s | %s | %s |\n' "$version" "$run" "$accepted" "$applies" "$float" "$tests" "$agent" "$doctor"
    done
  done
}

case "${1:-}" in
  run) do_run "$2" "$3" ;;
  matrix)
    for version in $VERSIONS; do
      for run in $RUNS; do
        do_run "$version" "$run"
      done
    done
    do_table
    ;;
  table) do_table ;;
  *) echo "usage: $0 {run <version> <run#>|matrix|table}" >&2; exit 2 ;;
esac

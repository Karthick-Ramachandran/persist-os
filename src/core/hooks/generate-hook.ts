import { FENCES_FILE } from "../fence/generate-fence.js";
import { LESSONS_FILE } from "../lessons/lessons.js";

export const HOOKS_DIR = ".persist/hooks";
export const PRE_COMMIT_HOOK_PATH = ".persist/hooks/pre-commit";
export const PRE_PUSH_HOOK_PATH = ".persist/hooks/pre-push";
export const HOOKS_PATH_ACTIVATION_COMMAND = "git config core.hooksPath .persist/hooks";

/**
 * How the hooks call Persist. Many users run it through `npx persist-os` and never install it
 * globally; a hook that calls bare `persist` then fails every commit with "command not found".
 * The installed binary wins when there is one (fast, offline); otherwise npx runs the package,
 * from the project's node_modules when present.
 */
const RUN_PERSIST_FUNCTION = [
  "# Use the installed persist, or npx when it is not installed globally.",
  "run_persist() {",
  "  if command -v persist >/dev/null 2>&1; then",
  '    persist "$@"',
  "  else",
  '    npx --yes persist-os "$@"',
  "  fi",
  "}",
];

export const SESSION_START_HOOK_PATH = ".claude/hooks/session-start.sh";
export const CLAUDE_SETTINGS_PATH = ".claude/settings.json";
/** Prompt hook: looks up context cards for the submitted prompt, per tool docs. */
export const CONTEXT_PROMPT_HOOK_PATH = ".claude/hooks/context-prompt.sh";
export const CODEX_HOOKS_JSON_PATH = ".codex/hooks.json";
export const CODEX_CONTEXT_HOOK_PATH = ".codex/hooks/context-prompt.sh";

/**
 * The always-loaded budget both the SessionStart hook and the doctor context-budget check
 * measure against. One constant, two readers: the hook truncates the fence index to what
 * fits inside it, and the check warns when the index no longer fits at all.
 */
export const ALWAYS_LOADED_BUDGET_BYTES = 24 * 1024;

/**
 * The base context the SessionStart hook injects before the fence index. Exported (rather
 * than embedded in the shell template) so the budget check subtracts the exact same bytes
 * the hook emits — `${...}` here is shell, not interpolation. The `${proposed_adrs}` slot
 * carries the Proposed list when one exists, so it counts toward the same 24 KB budget
 * through the same base-bytes subtraction; empty, it expands to nothing.
 */
export const SESSION_START_BASE_CONTEXT =
  "Persist OS repository memory is the source of truth over chat history. Before non-trivial work, read AGENTS.md and the docs it routes to; repository rules override model preference. Accepted ADRs (${adr_dir}/): ${adrs:-none yet}.${proposed_adrs} Modules (${modules_dir}/): ${modules:-none yet}. Use the Persist OS CLI commands listed in AGENTS.md (persist feature/adr/module create, persist adr accept and supersede, persist doctor) yourself, as 'npx persist-os <command>' if persist is not installed; do not web-search them. Before calling work done, check the diff against every accepted ADR governing the files you changed (read its Decision, not just its title); work is done only when 'persist doctor' reports PASSED. When you finish work in an area, create or update its context card — above all the Answers list, with the task you were just given phrased the way it was asked.";

/** The label the hook places between the base context and the fence index. */
export const FENCE_INDEX_LABEL =
  " Chesterton fence index (recorded rationale; full history in ${fences_file}): ";

/**
 * The label the hook places between the Accepted ADR list and the modules list. It is
 * emitted only when at least one proposal exists, so repositories with only accepted
 * decisions inject byte-identical text to before.
 */
export const PROPOSED_ADRS_LABEL = " Proposed ADRs, pending review, not binding: ";

/** Marker the hook appends when the fence index is truncated to the budget. */
export const FENCE_INDEX_TRUNCATION_MARKER =
  "... (fence index truncated to the context budget; read ${fences_file})";

/** The label the hook places between the fence index and the Always lessons. */
export const LESSONS_ALWAYS_LABEL = " Always lessons: ";

/** Marker the hook appends when the Always lessons are truncated to the budget. */
export const LESSONS_ALWAYS_TRUNCATION_MARKER =
  "... (always lessons truncated to the context budget; read ${lessons_file})";

/**
 * Render a deterministic POSIX `sh` Claude Code SessionStart hook.
 *
 * Claude Code runs this before the first prompt of every session and injects its stdout
 * `additionalContext` into the model. It lists the repository's accepted ADRs and modules so a fresh
 * agent reliably knows the durable memory exists and where to read it. Proposed ADRs ride a
 * separate pending-review list right after the accepted one, and anything else stays unlisted.
 * It is strictly read-only:
 * it only lists files and never modifies anything, makes no network calls, and runs no AI.
 *
 * The Chesterton-fence index (ADR-0010) rides the same injection: fenced paths plus their
 * one-line reasons, flattened to one line — never the full crossing history, which stays on
 * demand in FENCES.md. The index counts against the 24KB always-loaded budget: room is the
 * budget minus the agent files minus the base context minus the index label, so files plus the
 * whole injection stay within budget no matter how large FENCES.md grows. A truncated index
 * carries a marker naming the file. (When files plus base already fill the budget, the marker
 * alone may exceed it by its own ~85 bytes — a state the budget check already warns on.)
 *
 * The `## Always` section of LESSONS.md rides after the fence index under the same budget
 * and truncation rules: the fence room leaves space for it, and whatever remains fits the
 * Always bullets, truncated with their own marker when they do not fit.
 */
export function renderSessionStartHook(): string {
  return `#!/bin/sh
# Persist OS Claude Code SessionStart hook.
# Generated by \`persist init\`. Injects a repository-memory map into every Claude Code session so a
# fresh agent reliably loads durable memory. Wired in .claude/settings.json. Read-only.

# Memory locations come from .persist/config.json, so a relocated docs folder keeps loading
# without regenerating this file. A missing config or key falls back to the default layout.
config_dir() {
  value=$(sed -n 's/.*"'"$1"'": *"\\([^"]*\\)".*/\\1/p' .persist/config.json 2>/dev/null | head -n 1)
  # A backslash can only come from a JSON-escaped quote, which a path read this way cannot
  # represent; fall back rather than inject it into the JSON below.
  case "$value" in *\\\\*) value="" ;; esac
  printf '%s' "\${value:-$2}"
}
docs_dir=$(config_dir docsDir docs)
adr_dir=$(config_dir adrDir docs/adrs)
modules_dir=$(config_dir modulesDir docs/30-modules)
fences_file="$docs_dir/${FENCES_FILE}"

# ADR standing in a single awk pass over the ADR files: each file's ## Status section
# (first non-blank line after the heading, case-insensitive, CR stripped) decides its
# list, matching readAcceptedAdrs — accepted and still binding prints A:<name>, proposed
# prints P:<name>, anything else prints nothing. Drafts under proposed/ count as proposed
# by location, the way doctor reads them.
adr_classes=$(ls "$adr_dir"/ADR-*.md 2>/dev/null | awk '
  {
    file = $0
    status = ""
    in_status = 0
    have = 0
    while ((getline line < file) > 0) {
      stripped = line
      sub("\\r$", "", stripped)
      if (!have) {
        t = stripped
        sub(/^[[:blank:]]+/, "", t)
        sub(/[[:blank:]]+$/, "", t)
        if (in_status) {
          if (stripped ~ /^##[[:space:]]/) {
            in_status = 0
          } else if (t != "") {
            status = t
            have = 1
          }
        } else if (tolower(t) == "## status") {
          in_status = 1
        }
      }
    }
    close(file)
    name = file
    sub(/.*\\//, "", name)
    sub(/\\.md$/, "", name)
    s = tolower(status)
    if (s ~ /accepted/ && s !~ /superseded[[:blank:]][[:blank:]]*by/) {
      printf "A:%s\\n", name
    } else if (s ~ /proposed/) {
      printf "P:%s\\n", name
    }
  }')
adrs=$(printf '%s\\n' "$adr_classes" | sed -n 's/^A://p' | tr '\\n' ' ' | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g')
proposed=$(printf '%s\\n' "$adr_classes" | sed -n 's/^P://p' | tr '\\n' ' ')
proposed_drafts=$(ls "$adr_dir"/proposed/ADR-PROPOSED-*.md 2>/dev/null | sed 's|.*/||;s|\\.md$||' | tr '\\n' ' ')
proposed="$proposed$proposed_drafts"
proposed=$(printf '%s' "$proposed" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g')
# The Proposed list rides the base context right after the Accepted list, only when
# non-empty — so it counts toward the same always-loaded budget through the base bytes.
proposed_adrs=""
if [ -n "$proposed" ]; then
  proposed_adrs="${PROPOSED_ADRS_LABEL}$proposed."
fi
modules=$(ls -d "$modules_dir"/*/ 2>/dev/null | sed 's|/$||;s|.*/||' | tr '\\n' ' ')

# Fence index: one flattened line of "## <path>" / "Why: <reason>" lines from FENCES.md.
# A missing file means no fence crossed yet (FENCES.md is never required), and an empty index
# injects nothing — silence is the correct signal in both cases.
base="${SESSION_START_BASE_CONTEXT}"
context="$base"
full=$(grep -e '^## ' -e '^Why: ' "$fences_file" 2>/dev/null | tr '\\n' ' ' | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g')
lessons_file="$docs_dir/${LESSONS_FILE}"
always=$(tr -d '\\r' < "$lessons_file" 2>/dev/null | awk 'BEGIN{w=0} /^##[ \\t]/{w=(tolower($0) ~ /^##[ \\t]+always[ \\t]*$/);next} w{print}' | sed -e 's/<!--.*-->//g' -e 's/^[[:space:]]*[-*][[:space:]]*//' -e 's/^[[:space:]]*//' | tr '\\n\\t' '  ' | sed -e 's/  */ /g' -e 's/^ //' -e 's/ $//' -e 's/\\\\/\\\\\\\\/g' -e 's/"/\\\\"/g')
if [ -n "$always" ]; then
  always="$always "
fi
if [ -n "$full" ]; then
  label="${FENCE_INDEX_LABEL}"
  loaded=$(cat CLAUDE.md AGENTS.md .cursor/rules/persist-memory.mdc 2>/dev/null | wc -c | tr -d ' ')
  alen=0
  abytes=0
  if [ -n "$always" ]; then
    alen=$(printf '%s' "${LESSONS_ALWAYS_LABEL}" | wc -c | tr -d ' ')
    abytes=$(printf '%s' "$always" | wc -c | tr -d ' ')
  fi
  room=$((${ALWAYS_LOADED_BUDGET_BYTES} - loaded - $(printf '%s' "$base" | wc -c | tr -d ' ') - $(printf '%s' "$label" | wc -c | tr -d ' ') - $alen - $abytes))
  marker="${FENCE_INDEX_TRUNCATION_MARKER}"
  m=$(printf '%s' "$marker" | wc -c | tr -d ' ')
  if [ "$room" -le 0 ]; then
    fences="$marker"
  elif [ "$(printf '%s' "$full" | wc -c | tr -d ' ')" -le "$room" ]; then
    fences="$full"
  else
    keep=$((room - m))
    if [ "$keep" -lt 0 ]; then
      keep=0
    fi
    fences="$(printf '%s' "$full" | head -c "$keep" | sed 's/\\\\*$//')$marker"
  fi
  context="$base$label$fences"
fi
if [ -n "$always" ]; then
  alabel="${LESSONS_ALWAYS_LABEL}"
  amarker="${LESSONS_ALWAYS_TRUNCATION_MARKER}"
  aloaded=$(cat CLAUDE.md AGENTS.md .cursor/rules/persist-memory.mdc 2>/dev/null | wc -c | tr -d ' ')
  aused=$(printf '%s' "$context" | wc -c | tr -d ' ')
  aroom=$((${ALWAYS_LOADED_BUDGET_BYTES} - aloaded - aused - $(printf '%s' "$alabel" | wc -c | tr -d ' ')))
  am=$(printf '%s' "$amarker" | wc -c | tr -d ' ')
  if [ "$aroom" -le 0 ]; then
    lessons="$amarker"
  elif [ "$(printf '%s' "$always" | wc -c | tr -d ' ')" -le "$aroom" ]; then
    lessons="$always"
  else
    akeep=$((aroom - am))
    if [ "$akeep" -lt 0 ]; then
      akeep=0
    fi
    lessons="$(printf '%s' "$always" | head -c "$akeep" | sed 's/\\\\*$//')$amarker"
  fi
  context="$context$alabel$lessons"
fi

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\\n' "$context"
`;
}

/**
 * Render a deterministic POSIX `sh` prompt hook for the context-cards lookup.
 *
 * Both Claude Code (`UserPromptSubmit`) and Codex (`UserPromptSubmit`) hand a
 * command hook its input as JSON on stdin with a `prompt` field, and both read
 * injected context back from `hookSpecificOutput.additionalContext` on stdout.
 * The script only forwards the payload to `persist context --hook <tool>`,
 * which prints nothing below the match threshold — silence is the correct
 * signal there, not an error.
 *
 * Speed and safety, per the hook contracts: the script always exits 0 so it
 * can never block or fail the prompt; it runs only when `persist` is on PATH
 * or in the project's `node_modules/.bin`, and it never calls `npx` (far too
 * slow on every prompt). A `context --help` probe stands down when the found
 * binary predates the command instead of failing the lookup noisily. The
 * prompt text rides a shell variable and a pipe — it is never written to disk
 * or logged. The short timeout lives in each tool's settings, not here.
 */
/**
 * How each tool's settings file launches the prompt hook. Both are absolute at run time:
 * Claude Code expands `${CLAUDE_PROJECT_DIR}` (its documented settings example does the
 * same), and Codex evaluates the `git rev-parse` substitution (its documented example
 * resolves hook scripts from the git root). Plain strings, never template literals, so
 * the `$` reaches the file verbatim.
 */
export const CLAUDE_CONTEXT_HOOK_COMMAND =
  '"${CLAUDE_PROJECT_DIR}/' + CONTEXT_PROMPT_HOOK_PATH + '"';
export const CODEX_CONTEXT_HOOK_COMMAND =
  '"$(git rev-parse --show-toplevel)/' + CODEX_CONTEXT_HOOK_PATH + '"';
/** Same quoting for the SessionStart entry: new settings only, never merged. */
export const SESSION_START_HOOK_COMMAND = '"${CLAUDE_PROJECT_DIR}/' + SESSION_START_HOOK_PATH + '"';

export function renderContextPromptHook(tool: "claude" | "codex"): string {
  const wiring = tool === "claude" ? CLAUDE_SETTINGS_PATH : CODEX_HOOKS_JSON_PATH;
  // Hooks can fire with any working directory, but the lookup reads config and
  // node_modules relative to the project root — so each script moves there first.
  // The root comes from the tool's own documented source: Claude Code exports
  // CLAUDE_PROJECT_DIR on the hook process; Codex has no equivalent variable,
  // so the script asks git. Any failure exits 0: a lookup never blocks a prompt.
  const goRoot =
    tool === "claude"
      ? 'if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then\n  cd "$CLAUDE_PROJECT_DIR" || exit 0\nfi'
      : 'root=$(git rev-parse --show-toplevel 2>/dev/null)\nif [ -n "$root" ]; then\n  cd "$root" || exit 0\nfi';
  return `#!/bin/sh
# Persist OS ${tool === "claude" ? "Claude Code UserPromptSubmit" : "Codex UserPromptSubmit"} hook.
# Generated by \`persist init\`. Looks up context cards for the submitted prompt and injects
# pointers (never whole files) into the prompt. Read-only: the prompt text stays in this
# process and is never written to disk or logged.
# Wired in ${wiring}; that file decides the timeout.
${goRoot}
input=$(cat)
# The installed persist may predate the context command (1.3.0). Probe for it
# first: an old binary would fail the lookup noisily instead of standing down.
if command -v persist >/dev/null 2>&1; then
  persist context --help >/dev/null 2>&1 || exit 0
  printf '%s' "$input" | persist context --hook ${tool}
elif [ -x node_modules/.bin/persist ]; then
  node_modules/.bin/persist context --help >/dev/null 2>&1 || exit 0
  printf '%s' "$input" | node_modules/.bin/persist context --hook ${tool}
fi
exit 0
`;
}

/**
 * Claude Code settings that wire the SessionStart hook. Generated only when no settings file exists,
 * since the safe write policy never overwrites a user's existing settings. With the context hook
 * on, the UserPromptSubmit entry rides the same file: one short-timeout lookup per prompt.
 */
export function renderClaudeSettings(includeContextHook = true): string {
  const userPromptSubmit =
    includeContextHook === true
      ? {
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: "command",
                  command: CLAUDE_CONTEXT_HOOK_COMMAND,
                  timeout: 10,
                },
              ],
            },
          ],
        }
      : {};
  return `${JSON.stringify(
    {
      hooks: {
        SessionStart: [
          {
            matcher: "startup",
            hooks: [{ type: "command", command: SESSION_START_HOOK_COMMAND }],
          },
        ],
        ...userPromptSubmit,
      },
    },
    null,
    2,
  )}\n`;
}

/**
 * Codex project hooks live in `.codex/hooks.json` next to the active config
 * layer. User-owned like the Claude settings: the user may wire their own
 * hooks alongside, so it is created when missing and never merged.
 */
export function renderCodexHooksJson(): string {
  return `${JSON.stringify(
    {
      description: "Persist OS context cards: prompt pointers.",
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: "command",
                command: CODEX_CONTEXT_HOOK_COMMAND,
                timeout: 10,
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  )}\n`;
}

/**
 * Render a deterministic POSIX `sh` pre-commit hook.
 *
 * The hook runs `persist doctor` first, then each configured gate in order. Gates come from
 * `.persist/config.json` (`preCommitGates`), so the toolchain choice stays in user config rather than
 * in core. Doctor warnings are advisory (ADR-0013): the hook continues on exit 0 and exit 1 and
 * fails only on errors (exit 2). Activation is `core.hooksPath`, which init sets when the user
 * agrees (ADR-0014); the hook itself never changes git configuration.
 */
export function renderPreCommitHook(gates: string[]): string {
  const lines = [
    "#!/bin/sh",
    "# Persist OS pre-commit hook.",
    "# Generated by `persist init`. Edit gates in .persist/config.json (preCommitGates),",
    "# then run `persist hooks sync` to regenerate this hook.",
    "# Enable once per clone with:",
    `#   ${HOOKS_PATH_ACTIVATION_COMMAND}`,
    "set -e",
    "",
    ...RUN_PERSIST_FUNCTION,
    "",
    "# Doctor warnings are advisory: they print but never block the commit.",
    "# Only errors fail the hook. The set +e pair is deliberate — under set -e",
    "# the shell would abort before $? can be read.",
    "set +e",
    "run_persist doctor",
    "status=$?",
    "set -e",
    '[ "$status" -le 1 ] || exit "$status"',
  ];

  for (const gate of gates) {
    lines.push(gate);
  }

  lines.push("");

  return lines.join("\n");
}

/**
 * Render a deterministic POSIX `sh` pre-push hook — the expensive gate before code leaves the
 * machine. It runs `persist test-gate` (the configured one-shot test command, which skips loudly
 * when unconfigured) and then the push-only gates from `.persist/config.json` (`prePushGates`).
 * Doctor stays on pre-commit: re-running it here would only repeat the same check. Catches commits
 * made with `--no-verify`, on another machine, or before the pre-commit hook was activated. It does
 * not modify git configuration; activation is the same `core.hooksPath` step (ADR-0014).
 */
export function renderPrePushHook(testCommand: string | null, gates: string[]): string {
  const lines = [
    "#!/bin/sh",
    "# Persist OS pre-push hook.",
    "# Generated by `persist init`. The expensive gate before code leaves your machine: it runs",
    "# `persist test-gate` (your configured testCommand, skipped loudly when unset) and your",
    "# push-only gates against everything being pushed (catching commits made with --no-verify",
    "# or before the pre-commit hook was active).",
    "# Edit the test command (testCommand) and gates (prePushGates) in .persist/config.json,",
    "# then run `persist hooks sync` to regenerate this hook.",
    "# Enable once per clone with:",
    `#   ${HOOKS_PATH_ACTIVATION_COMMAND}`,
    "set -e",
    "",
    ...RUN_PERSIST_FUNCTION,
    "",
    "run_persist test-gate",
  ];

  if (testCommand !== null) {
    lines.push(`# testCommand: ${testCommand}`);
  }

  for (const gate of gates) {
    lines.push(gate);
  }

  lines.push("");

  return lines.join("\n");
}

export type GeneratedHookFile = {
  path: string;
  content: string;
  executable?: boolean;
  /**
   * The file may hold the user's own settings alongside ours, so it is written only when
   * missing. Everything else here is pure rendered output and safe to regenerate.
   */
  userOwned?: boolean;
};

/**
 * Every generated hook file a config expects, in one list. `hook-drift` diffs against it and
 * `hooks sync` writes from it, so what doctor calls drift is exactly what sync repairs. Claude
 * files follow `aiTools`, so a Codex-only repository is never handed files it did not ask for.
 */
export function expectedHookFiles(config: {
  aiTools?: readonly string[];
  preCommitGates?: string[];
  prePushGates?: string[];
  testCommand?: string | null;
  contextHook?: boolean;
}): GeneratedHookFile[] {
  const files: GeneratedHookFile[] = [
    {
      path: PRE_COMMIT_HOOK_PATH,
      content: renderPreCommitHook(config.preCommitGates ?? []),
      executable: true,
    },
    {
      path: PRE_PUSH_HOOK_PATH,
      content: renderPrePushHook(config.testCommand ?? null, config.prePushGates ?? []),
      executable: true,
    },
  ];

  if ((config.aiTools ?? []).includes("claude")) {
    files.push({
      path: SESSION_START_HOOK_PATH,
      content: renderSessionStartHook(),
      executable: true,
    });
    files.push({
      path: CLAUDE_SETTINGS_PATH,
      content: renderClaudeSettings(config.contextHook !== false),
      userOwned: true,
    });
    // The prompt hook is layered on the SessionStart one: same memory, delivered per prompt.
    // Off when contextHook is false; that spends no extra lookup on users who opted out.
    if (config.contextHook !== false) {
      files.push({
        path: CONTEXT_PROMPT_HOOK_PATH,
        content: renderContextPromptHook("claude"),
        executable: true,
      });
    }
  }

  if (config.contextHook !== false && (config.aiTools ?? []).includes("codex")) {
    files.push({
      path: CODEX_CONTEXT_HOOK_PATH,
      content: renderContextPromptHook("codex"),
      executable: true,
    });
    files.push({
      path: CODEX_HOOKS_JSON_PATH,
      content: renderCodexHooksJson(),
      userOwned: true,
    });
  }

  return files;
}

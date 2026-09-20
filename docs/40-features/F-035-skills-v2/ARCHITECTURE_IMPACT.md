# Architecture Impact: Skills v2

The skill catalog type changes shape: fixed template fields (purpose, requiredReading, outputFiles,
process, stopConditions, qualityBar) become earned sections (goal, inputs, workflow, decisions,
verification, resources, output) plus optional scripts. The renderer stops stamping headings without
content. Generation fans out to scripts/ entries that ride the existing safe write pipeline
unchanged, gaining root confinement and never-overwrite behavior for free.

Init output grows one line naming executable files written, derived from the write plan entries the
pipeline already marks. No CLI surface changes: no new flags, no changed defaults.

## Security Impact

Generated output now includes executable skill scripts (hooks already were executable). Containment
is the existing safe write pipeline plus the read-only-local script constraints, verified by failing
tests; init names every executable file it writes so reviewers see the posture change.

The nine retirements are the expected breaking change. The retired-skills check needs no logic
change since it derives retired status from the catalog. The mcp add flow still installs its skill
file, which is now a skeleton; the one doc sentence describing it is corrected rather than the flow
redesigned.

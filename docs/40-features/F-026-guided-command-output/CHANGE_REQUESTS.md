# Change Requests: Guided Command Output

No accepted change requests.

Interactive question-and-answer prompts were considered (the "ask the user" idea) but deferred: the
CLI is intentionally non-interactive, and prompting would add a dependency and a behavior change that
needs its own review. Guided output plus the in-file prompts in generated templates deliver the
guidance without interactivity.

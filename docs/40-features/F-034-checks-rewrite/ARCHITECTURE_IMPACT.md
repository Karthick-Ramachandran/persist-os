# Architecture Impact: Checks Rewrite

The five checks keep their questions and change their evidence. Each check widens the document set
it scans: required product, engineering, and security documents and ADRs join (never replace) the
feature and module documents. No finding severity changes, no outcome id changes, and the doctor
wiring is untouched, so reports, exit codes, hooks, and CI keep their shape.

The one behavioral narrowing is deliberate and brief-mandated: planning documents of features that
carry a completion report are history, so the reference and staleness checks skip them. Everything
else only widens.

Cross-check precedent is reused, not invented: missing references are errors and not-accepted
references are warnings, matching the existing ADR drift check; placeholder detection reuses the
existing meaningful-section helpers. The new always-warning security-notes rule is the single
severity judgment call, documented in the PRD with its reason.

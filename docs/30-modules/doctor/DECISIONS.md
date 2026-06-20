# Doctor Decisions

## P9: Doctor Is Read-Only

P9 Doctor validates repository memory health and reports findings.

It does not fix or mutate files.

## P9: Exit Code Severity

Doctor uses:

```txt
0 = healthy
1 = warnings only
2 = errors
```

This makes Doctor useful as an AI completion gate.

## P9: Structural Checks First

P9 validates deterministic memory structure and required sections.

Semantic drift detection remains future work.

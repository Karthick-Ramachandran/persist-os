# Presets Decisions

## P4: Contracts Plus Minimal Content

P4 proves the preset model with schema, validation, registry behavior, and small built-in presets.

Rich framework guidance is deferred until real usage proves the contract works.

## P4: Proposed Decisions Only

Preset decision stubs must use:

```txt
status: proposed
```

Presets must not create accepted architecture decisions.

## P4: No Runtime Execution

P4 does not load template files, render preset outputs, write files, or execute preset behavior.

# Agent Rules Decisions

## P1.6: Repository Rules Override Model Preferences

If a model suggests one behavior and repository memory requires another, repository memory wins.

The agent must stop and report the conflict when it cannot safely proceed.

## P9: Doctor Protects Repository Memory

Agents should treat Doctor as a completion gate once the CLI binary exists.

Until P10 package/bin wiring exists, Doctor is validated through `main(argv, io)` integration tests.

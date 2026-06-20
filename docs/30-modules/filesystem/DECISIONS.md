# Filesystem Module Decisions

## P1: Simple Writes

P1 uses simple `fs.writeFile` behavior.

Atomic temp-file rename writes are deferred until a future requirement justifies the added complexity.

Create entries use Node's exclusive `wx` flag so files that appear after planning are not overwritten accidentally.

## P1: Symlink Protection

P1 refuses target and existing parent symlinks using best-effort `lstat` checks.

P1 does not claim race-free TOCTOU protection. Stronger guarantees require a future ADR.

## P1: Collision Handling

P1 detects duplicate normalized destinations using normalized path strings.

Case-insensitive filesystem collision handling is deferred.

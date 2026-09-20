#!/bin/sh
# scan-secrets.sh — read-only scan of a diff for candidate secrets.
#
# Usage: scan-secrets.sh [--staged | --file PATH]
#
# Reads the staged diff by default, or a unified diff file with --file PATH.
# Prints matching lines and exits 1 when candidates are found; exits 0 when
# clean. Reads only: it runs git and grep, writes nothing, and opens no
# connections.
set -eu

MODE="staged"
TARGET=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --staged)
      MODE="staged"
      ;;
    --file)
      MODE="file"
      TARGET="${2:?missing path after --file PATH}"
      ;;
    *)
      printf 'usage: scan-secrets.sh [--staged | --file PATH]\n'
      exit 2
      ;;
  esac
  shift
done

PATTERN='BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|xox[bpas]-[0-9A-Za-z-][0-9A-Za-z-]*|ghp_[0-9A-Za-z]{36}|password[[:space:]]*[:=][[:space:]]*["'\'']'

if [ "$MODE" = "file" ]; then
  MATCHES="$(grep -nEi -e "$PATTERN" -- "$TARGET" || true)"
else
  MATCHES="$(git diff --cached | grep -nEi -e "$PATTERN" || true)"
fi

if [ -z "$MATCHES" ]; then
  printf 'scan-secrets: no candidate secrets found.\n'
  exit 0
fi

printf 'scan-secrets: candidate secrets found:\n'
printf '%s\n' "$MATCHES"
exit 1

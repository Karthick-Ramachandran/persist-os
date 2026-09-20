# Persist OS 1.1 demo — render with: vhs docs/media/persist-1.0.tape
#
# Records the published package, not a local build: the tape installs
# persist-os@1.1.1 into a temp prefix and puts it first on PATH, so what you see
# is what `npm i -g persist-os` gives you. Requires figlet for the title card.

Output docs/media/persist-1.1.gif

Require figlet

Set Shell bash
Set FontSize 16
Set Width 1240
Set Height 860
Set Padding 24
Set Theme "Dracula"
Set TypingSpeed 32ms

# --- Setup, off screen: published package into a temp prefix, empty git repo ---
Hide
Type "cd $(mktemp -d) && npm i -g --prefix ./.p persist-os@1.1.1 >/dev/null && export PATH=$PWD/.p/bin:$PATH && persist fence add --help >/dev/null || { echo INSTALL-FAILED; exit 1; }"
Enter
Sleep 30s
Type "mkdir checkout-api && cd checkout-api && git init -q . && git config user.email demo@example.com && git config user.name Demo"
Enter
Type "{ tput setaf 6; figlet -f colossal 'Persist OS'; tput sgr0; echo; echo '   Repository memory for coding agents.'; echo '   Git tracks what changed.  Persist tracks why.'; echo; } > /tmp/banner.txt"
Enter
Type "clear"
Enter
Show

Type@1ms "clear; cat /tmp/banner.txt"
Enter
Sleep 2000ms

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 1. Create the memory ---
Type "# Six documents, a decision log, and the gate that keeps them honest."
Sleep 500ms
Enter
Sleep 300ms
Type "persist init --yes"
Sleep 500ms
Enter
Sleep 4s

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 2. What landed ---
Type "# Plain files. Tracked in Git. Reviewed like any other change."
Sleep 500ms
Enter
Sleep 300ms
Type "find docs .persist -type f | sort"
Sleep 400ms
Enter
Sleep 2200ms

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 3. The fence: change business logic with no recorded reason ---
Type "# Now change some logic. Nothing records why it was written that way."
Sleep 500ms
Enter
Sleep 300ms
Type "mkdir -p src && echo 'export const writes = 4; // four collections' > src/billing.ts"
Sleep 300ms
Enter
Type "git add src/billing.ts"
Sleep 300ms
Enter
Sleep 600ms
Type "persist doctor"
Sleep 400ms
Enter
Sleep 4s

Type "# Answer it once. A human says why; the command records it."
Sleep 500ms
Enter
Sleep 300ms
Type "persist fence add src/billing.ts --why 'Four collections in one transaction: ledger and audit must not diverge.'"
Sleep 400ms
Enter
Sleep 2500ms
Type "persist doctor"
Sleep 400ms
Enter
Sleep 5s

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 4. A decision: proposed, then accepted ---
Type "# Generating a decision does not accept it. A human does that."
Sleep 500ms
Enter
Sleep 300ms
Type "persist adr create 'Use PostgreSQL for primary storage'"
Sleep 400ms
Enter
Sleep 3s
Type "persist adr accept use-postgresql-for-primary-storage"
Sleep 400ms
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 5. Close ---
Type "# Chesterton's fence: ask why it is shaped this way, before changing it."
Sleep 650ms
Enter
Sleep 400ms
Type "# npx persist-os@latest init"
Sleep 650ms
Enter
Sleep 2200ms

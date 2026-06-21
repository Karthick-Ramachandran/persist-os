# Recall OS — Laravel + Vue demo. Render: vhs docs/media/recall-laravel-vue.tape
# Requires `recall` on PATH (npm i -g recall-os) and `figlet` for the banner.

Output docs/media/recall-laravel-vue.gif

Require recall
Require figlet

Set Shell bash
Set FontSize 16
Set Width 1240
Set Height 900
Set Padding 24
Set Theme "Dracula"
Set TypingSpeed 42ms

# --- Title card ---
Hide
Type "cd $(mktemp -d)"
Enter
# Minimal manifests so `recall init` detects the Laravel + Vue stack.
Type "printf 'laravel/framework' > composer.json && printf 'vue' > package.json"
Enter
Type "{ tput setaf 6; figlet -f colossal 'Recall OS'; tput sgr0; echo; echo '   Durable memory for your Laravel + Vue app — decisions, not embeddings.'; echo; } > banner.txt"
Enter
Type "clear"
Enter
Show
Type@1ms "clear; cat banner.txt"
Enter
Sleep 2800ms

Hide
Type "clear"
Enter
Show
Sleep 400ms

# --- 1. Scaffold memory with the laravel-vue preset ---
Type "# 1. Scaffold durable memory — Inertia+Vue, Sanctum, Pest proposed as ADRs you accept"
Sleep 700ms
Enter
Sleep 500ms
Type "recall init --preset laravel-vue"
Sleep 400ms
Enter
Sleep 4200ms

# --- 2. The gate confirms the scaffold is healthy ---
Type "# 2. The deterministic gate confirms the memory is healthy"
Sleep 700ms
Enter
Sleep 400ms
Type "recall doctor"
Sleep 400ms
Enter
Sleep 2800ms

# --- 3. Accept the database decision ---
Type "# 3. Presets only propose — accept the database decision (Eloquent + PostgreSQL)"
Sleep 700ms
Enter
Sleep 400ms
Type "recall adr accept laravel-vue-database-eloquent"
Sleep 400ms
Enter
Sleep 2600ms

# --- 4. The decision changes — supersede, never overwrite history ---
Type "# 4. The team moves Postgres -> MySQL. Record it; don't silently rewrite history:"
Sleep 800ms
Enter
Sleep 400ms
Type "recall adr supersede laravel-vue-database-eloquent 'Use MySQL via Eloquent'"
Sleep 400ms
Enter
Sleep 4000ms

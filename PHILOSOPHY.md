# Why I built Recall OS

This is the honest version of _why_ this tool exists. The README tells you what it does. This tells
you the problem I kept hitting and the small, workable thing I built to deal with it.

## The problem I kept running into

AI makes it fast to get software to a working shape. The gap shows up later: most of the _why_ — the
decisions, the constraints, the rules — lives in the chat, not in the repo. The code ships, but the
reasoning behind it doesn't come with it.

That's fine until the product reaches a shape and other people take over — a teammate, a real
engineering team, or just a fresh agent next week. They inherit the code without the context, and
have to reverse-engineer or re-decide things that were already settled. I wanted what I (or anyone,
even someone vibe-coding their way to a first version) build with AI to be able to **scale past
me**: to hand off cleanly and keep its reasoning intact.

## What I wanted instead

I didn't want a smarter model or a hosted "memory" service. I wanted something boring and
dependable: the project's decisions and rules written into **plain files that live in the repo**,
get reviewed in pull requests, and are still there next session — so I don't have to think about
context, summarizing, or re-explaining at all.

> Git tracks what changed. I wanted something that tracks why it changed.

That's all Recall OS really is: a quick, workable way to keep durable engineering memory next to
your code, and a discipline system that nudges the work to actually get written down.

## The bet: discipline, not magic

Recall OS doesn't call an AI model, hit the network, or send telemetry. Not because that's purer —
because I wanted the part that _checks_ my work to be trustworthy and free.

`recall doctor` is deliberately simple and deterministic. It doesn't judge whether your architecture
is good — it can't, and I don't want it pretending it can. It checks the boring, reliable things:
are the docs that should exist there, is a "done" claim backed by test evidence, does the memory
point at an ADR or a source file that doesn't exist anymore. Same input, same answer, every time.
I'd rather have a dumb check I can trust than a clever one I can't.

The actual thinking still comes from the agent (Claude, Codex, Cursor). Recall OS's job isn't to be
smart — it's to put the right memory in front of the agent and make the agent's work persist. So it
wires each tool with its own native mechanism: a SessionStart hook that injects a live memory map in
Claude Code, an always-apply rule for Cursor, and `AGENTS.md` (which both Codex and Cursor
auto-load) as the portable floor. And it's a _map_, not a dump — just a short index of the accepted
decisions and modules, so the agent grabs a pointer and reads the detail when it needs it, instead
of me pasting the whole repo into context every session. The dynamic per-session map is a Claude
Code bonus, not a promise everywhere — I'd rather be honest about that than pretend one trick works
in every tool. I can't force a model to be correct, but I _can_ stop re-explaining the project every
single time.

## It proposes, you decide

It's architecture-neutral on purpose. It records _your_ decisions; it never makes them for you.
Presets, `recall adopt`, and MCP capture all produce **proposed** memory that a human accepts with
`recall adr accept`. Nothing becomes "truth" silently — a proposal you can review beats a guess the
tool slipped in.

## "Isn't this just a memory tool?"

Is this the same as a vector memory engine — supermemory, mem0, a RAG store? It's a fair question,
and those are genuinely useful: they remember information and pull the relevant pieces back into a
prompt. But that wasn't the part that hurt for me.

What I kept losing wasn't information I couldn't find. It was the **decision and why it was made** —
and, later, whether it was still the decision. Retrieval gets you "we said Auth0 once." What I
needed to know was where that was decided, whether it was reviewed, and whether it still holds. For
me that turned out to be a files-and-review problem, not a search problem — so I reached for plain
files I can read and a human can approve, not embeddings I have to trust.

So I don't really think of those tools as competitors; if anything they'd sit happily on top of this
and index the files Recall writes. The thing this actually replaces, for me, is the decision that
only ever lived in a chat — or in someone's head.

## What it catches — and what it doesn't

I want to be straight about the limits, since this is exactly where a tool like this can oversell.

It catches the _structural_ problems well: a missing ADR or module, a broken `src/` reference,
memory pointing at a decision that was never accepted, an empty template, a "done" with no evidence.
Those are objective — Doctor can say "this is broken" because checking it doesn't need any
understanding of the code.

What it doesn't catch is the subtler kind. An ADR says PostgreSQL after the team quietly moved to
MySQL: the file's still there, the references still resolve, everything passes — and the memory is
quietly wrong. I haven't solved that, and I'm not going to pretend a deterministic check can.

The tradeoff I chose is to keep that judgment out of the gate. The moment `recall doctor` needs a
model to decide whether two docs agree, it stops being something I can trust blindly — so I leave
the reading to the agent. The generated `architecture-drift-review` skill walks the docs and asks
whether they still line up. The gate stays dumb and reliable; the model does the reading.

If I'm honest about where it stands: creating, protecting, and enforcing memory work well today;
_understanding_ it — catching that quiet contradiction — is still early, and it leans on the agent
more than the gate. That order felt right to me, because the first thing I ever lost wasn't the
contradiction between two decisions. It was the decision I never wrote down at all.

## What it's honestly not

- Not an AI agent or an app generator. It writes memory, not your product code — and that's the
  point: it's the durable layer the agent has been missing.
- Not magic recall. It's something better for a codebase: external memory you can read, review, and
  trust, because it lives in the repo instead of a model's context.
- It won't _rubber-stamp_ your architecture as good — that judgment stays with you and the agent,
  which is exactly where it belongs. But it does help you get there: presets propose vetted,
  stack-specific defaults (Laravel, Next.js, FastAPI, and more) that you accept or reject, never
  silently. And it guarantees the reasoning is **captured, consistent, and backed by evidence** —
  the part teams almost always lose, and the part everything else builds on.

## The short version

This is a personal tool that grew up. It improves how I build software indirectly — through
discipline, not magic: decide acceptance before coding, write decisions down, keep evidence for
"done," and stop losing the reasoning to a summarized chat. If you've felt the same friction, maybe
it helps you too.

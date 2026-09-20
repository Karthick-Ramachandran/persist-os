import { afterEach, describe, expect, it } from "vitest";

import { createPrompter } from "../../../src/cli/prompt.js";
import { createStyle } from "../../../src/cli/style.js";
import { FeedOnPrompt } from "../../helpers/fake-prompt.js";

const feeds: FeedOnPrompt[] = [];

afterEach(() => {
  for (const feed of feeds.splice(0)) {
    feed.destroyInput();
  }
});

function feedFor(lines: string[]): FeedOnPrompt {
  const feed = new FeedOnPrompt(lines);
  feeds.push(feed);
  return feed;
}

describe("cli prompts", () => {
  it("marks the default without using a status colour", async () => {
    // The capital letter carries the default. Painting it accent (terracotta) made it read
    // as an error in a terminal, which a default is not.
    const feed = feedFor(["y"]);
    const prompter = createPrompter({ input: feed.input, output: feed });
    await prompter.askYesNo("Q?", true);
    prompter.close();

    const accent = createStyle("truecolor").accent("Y");
    expect(feed.written()).not.toContain(accent);
    expect(feed.written()).toContain("[Y/n]");
  });

  it("prints an explanation above the question it belongs to", async () => {
    const feed = feedFor(["y"]);
    const prompter = createPrompter({ input: feed.input, output: feed });
    await prompter.askYesNo("Enable it?", true, "[5/5]", "  On: something. Off: nothing.");
    prompter.close();

    const written = feed.written();
    expect(written.indexOf("On: something")).toBeLessThan(written.indexOf("Enable it?"));
    // A blank line separates it from the previous answer, so it does not read as belonging there.
    expect(written).toContain("\n  On: something");
  });

  it("askYesNo parses yes/no variants", async () => {
    const yes = feedFor(["y"]);
    const yesPrompter = createPrompter({ input: yes.input, output: yes });
    await expect(yesPrompter.askYesNo("Q?", false)).resolves.toBe(true);
    yesPrompter.close();

    const upper = feedFor(["YES"]);
    const upperPrompter = createPrompter({ input: upper.input, output: upper });
    await expect(upperPrompter.askYesNo("Q?", false)).resolves.toBe(true);
    upperPrompter.close();

    const no = feedFor(["n"]);
    const noPrompter = createPrompter({ input: no.input, output: no });
    await expect(noPrompter.askYesNo("Q?", true)).resolves.toBe(false);
    noPrompter.close();

    const word = feedFor(["No"]);
    const wordPrompter = createPrompter({ input: word.input, output: word });
    await expect(wordPrompter.askYesNo("Q?", true)).resolves.toBe(false);
    wordPrompter.close();
  });

  it("askYesNo takes the default on empty input", async () => {
    const yes = feedFor([""]);
    const yesPrompter = createPrompter({ input: yes.input, output: yes });
    await expect(yesPrompter.askYesNo("Q?", true)).resolves.toBe(true);
    yesPrompter.close();

    const no = feedFor([""]);
    const noPrompter = createPrompter({ input: no.input, output: no });
    await expect(noPrompter.askYesNo("Q?", false)).resolves.toBe(false);
    noPrompter.close();
  });

  it("askYesNo re-asks on invalid input", async () => {
    const feed = feedFor(["maybe", "y"]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askYesNo("Q?", false)).resolves.toBe(true);
    expect(feed.written()).toContain("Please answer y or n.");
    prompter.close();
  });

  it("askAiTools takes the default on empty input", async () => {
    const feed = feedFor([""]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askAiTools(["claude", "codex", "cursor"])).resolves.toEqual([
      "claude",
      "codex",
      "cursor",
    ]);
    prompter.close();
  });

  it("askAiTools parses comma- and space-separated tools", async () => {
    const single = feedFor(["codex"]);
    const singlePrompter = createPrompter({ input: single.input, output: single });
    await expect(singlePrompter.askAiTools(["claude"])).resolves.toEqual(["codex"]);
    singlePrompter.close();

    const multi = feedFor(["claude, cursor"]);
    const multiPrompter = createPrompter({ input: multi.input, output: multi });
    await expect(multiPrompter.askAiTools(["codex"])).resolves.toEqual(["claude", "cursor"]);
    multiPrompter.close();

    const duplicate = feedFor(["claude claude"]);
    const duplicatePrompter = createPrompter({ input: duplicate.input, output: duplicate });
    await expect(duplicatePrompter.askAiTools(["codex"])).resolves.toEqual(["claude"]);
    duplicatePrompter.close();
  });

  it("askAiTools re-asks on unknown tools", async () => {
    const feed = feedFor(["bogus", "generic"]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askAiTools(["claude"])).resolves.toEqual(["generic"]);
    expect(feed.written()).toContain("Unknown AI tools: bogus.");
    prompter.close();
  });

  it("askTestGate shows the detected command and defaults to yes", async () => {
    const feed = feedFor([""]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askTestGate("pnpm run test:run")).resolves.toBe(true);
    expect(feed.written()).toContain("Enable the test gate?");
    expect(feed.written()).toContain("pnpm run test:run");
    prompter.close();
  });

  it("askTestGate says so and defaults to no when nothing was detected", async () => {
    const feed = feedFor([""]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askTestGate(null)).resolves.toBe(false);
    expect(feed.written()).toContain("No one-shot test script detected");
    prompter.close();
  });

  it("askTestGate accepts a no", async () => {
    const feed = feedFor(["n"]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await expect(prompter.askTestGate("pnpm run test:run")).resolves.toBe(false);
    prompter.close();
  });

  it("renders the plain question word-identically without styling", async () => {
    const feed = feedFor([""]);
    const prompter = createPrompter({ input: feed.input, output: feed });

    await prompter.askYesNo("Track features?", false, "[2/4]");
    prompter.close();

    expect(feed.written()).toBe("[2/4] Track features? [y/N] ");
  });

  it("styles prompts, progress, and defaults when enabled", async () => {
    const feed = feedFor([""]);
    const prompter = createPrompter({ input: feed.input, output: feed }, createStyle("ansi16"));

    await prompter.askYesNo("Track features?", false, "[2/4]");
    prompter.close();

    expect(feed.written()).toContain("[2/4]");
    expect(feed.written()).toContain("Track features?");
    expect(feed.written()).toContain("[y/");
  });
});

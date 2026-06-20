export type KnownServer = {
  title: string;
  purpose: string;
  dataAccessed: string[];
};

/**
 * Purpose and data hints for well-known MCP servers, drawn from the MCP strategy guidance. Used to
 * pre-fill generated MCP memory. Recall OS never connects to these servers; this is static guidance.
 */
const KNOWN_SERVERS: Record<string, KnownServer> = {
  figma: {
    title: "Figma",
    purpose: "Design variables, components, and layout metadata for building consistent UI.",
    dataAccessed: [
      "Design tokens and variables.",
      "Component and layout metadata.",
      "Frames and styles.",
    ],
  },
  linear: {
    title: "Linear",
    purpose: "Tickets, project status, and acceptance criteria.",
    dataAccessed: [
      "Issues and tickets.",
      "Project and cycle status.",
      "Acceptance criteria in issues.",
    ],
  },
  github: {
    title: "GitHub",
    purpose: "Pull requests, issues, and review comments.",
    dataAccessed: ["Pull requests and diffs.", "Issues.", "Review comments."],
  },
  sentry: {
    title: "Sentry",
    purpose: "Crash reports and production errors.",
    dataAccessed: ["Error events and stack traces.", "Release health.", "Issue frequency."],
  },
  notion: {
    title: "Notion",
    purpose: "Product background and documentation.",
    dataAccessed: ["Product docs and pages.", "Project background.", "Specifications."],
  },
};

export function getKnownServer(id: string): KnownServer | undefined {
  return KNOWN_SERVERS[id];
}

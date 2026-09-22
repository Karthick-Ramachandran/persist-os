# Website decisions

- The landing page uses its own static HTML, CSS and JavaScript, separate from documentation styles.
- Keep assets local. Use Manrope for interface text and Geist Mono for code, with their upstream SIL
  Open Font Licenses, provenance and system fallbacks. No dependency or telemetry is needed.
- Interactive demos use explicitly labeled sample data in the browser. They do not execute a CLI
  command, write repository files or contact any external service.
- Accepted decisions and implemented commands govern product claims. ADR-0014, ADR-0015 and ADR-0016
  define the current hook, context-card and skill behavior.
- Preserve progressive enhancement: essential content and installation remain usable without JS.
- Group the hero setup-guide link with a copyable init command in a horizontal wrapping row. These
  support guided setup and direct local installation without executing anything from the website.

These are implementation choices within the existing architecture, not new architecture decisions.

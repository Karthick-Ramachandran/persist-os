/**
 * Cross-ecosystem test-file detection, shared by `recall adopt` (does this repo have tests?) and
 * `recall guard` (did this change include tests?). Filename patterns cover Go, JS/TS, Python, JVM,
 * PHP, and Ruby; a path under a conventional test directory also counts.
 */
export const TEST_FILE_PATTERNS = [
  /_test\.go$/u,
  /\.(test|spec)\.[cm]?[jt]sx?$/u,
  /^test_.+\.py$/u,
  /_test\.py$/u,
  /.+Tests?\.(java|kt)$/u,
  /.+Test\.php$/u,
  /_spec\.rb$/u,
  /_test\.rb$/u,
];

const TEST_DIR_SEGMENT = /(^|\/)(tests?|__tests__|specs?)\//u;

/**
 * True if a repository-relative path looks like a test, either by filename convention or by living
 * under a conventional test directory (`tests/`, `test/`, `__tests__/`, `spec/`).
 */
export function isTestFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() ?? filePath;
  if (TEST_FILE_PATTERNS.some((pattern) => pattern.test(fileName))) {
    return true;
  }
  return TEST_DIR_SEGMENT.test(filePath);
}

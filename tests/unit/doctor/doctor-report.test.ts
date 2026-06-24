import { describe, expect, it } from "vitest";

import { createDoctorReport, type DoctorFinding } from "../../../src/core/doctor/doctor-check.js";
import {
  formatDoctorJsonReport,
  formatDoctorReport,
  getDoctorExitCode,
} from "../../../src/core/doctor/doctor-report.js";

describe("doctor report", () => {
  it("returns zero for healthy reports", () => {
    const report = createDoctorReport([]);

    expect(getDoctorExitCode(report)).toBe(0);
    expect(formatDoctorReport(report)).toContain("Result: PASSED");
  });

  it("returns one for warnings-only reports", () => {
    const report = createDoctorReport([
      {
        severity: "warning",
        check: "example",
        message: "Non-blocking issue.",
      },
    ]);

    expect(getDoctorExitCode(report)).toBe(1);
    expect(formatDoctorReport(report)).toContain("WARNING");
    expect(formatDoctorReport(report)).toContain("Result: WARNINGS");
  });

  it("returns two for error reports", () => {
    const report = createDoctorReport([
      {
        severity: "error",
        check: "example",
        message: "Blocking issue.",
      },
    ]);

    expect(getDoctorExitCode(report)).toBe(2);
    expect(formatDoctorReport(report)).toContain("ERROR");
    expect(formatDoctorReport(report)).toContain("Result: FAILED");
  });

  it("groups findings by severity", () => {
    const findings: DoctorFinding[] = [
      { severity: "info", check: "info", message: "Info." },
      { severity: "error", check: "error", message: "Error.", path: "A.md" },
      { severity: "warning", check: "warning", message: "Warning." },
    ];
    const output = formatDoctorReport(createDoctorReport(findings));

    expect(output.indexOf("ERROR")).toBeLessThan(output.indexOf("WARNING"));
    expect(output.indexOf("WARNING")).toBeLessThan(output.indexOf("INFO"));
    expect(output).toContain("- Error. (A.md)");
  });
  it("formats machine-readable doctor JSON", () => {
    const report = createDoctorReport([
      {
        severity: "warning",
        check: "example",
        message: "Non-blocking issue.",
        path: "docs/example.md",
      },
    ]);

    const parsed = JSON.parse(formatDoctorJsonReport(report)) as {
      schemaVersion: string;
      status: string;
      exitCode: number;
      summary: { warnings: number };
      findings: DoctorFinding[];
    };

    expect(parsed.schemaVersion).toBe("persist.doctor.v1");
    expect(parsed.status).toBe("warnings");
    expect(parsed.exitCode).toBe(1);
    expect(parsed.summary.warnings).toBe(1);
    expect(parsed.findings[0]).toMatchObject({
      severity: "warning",
      check: "example",
      path: "docs/example.md",
    });
  });
});

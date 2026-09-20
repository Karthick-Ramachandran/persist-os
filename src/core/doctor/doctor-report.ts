import { getStyle, type StyleHelpers } from "../../cli/style.js";
import type { DoctorFinding, DoctorReport } from "./doctor-check.js";

const severityOrder = ["error", "warning", "info"] as const;

export function getDoctorExitCode(report: DoctorReport): 0 | 1 | 2 {
  if (report.summary.errors > 0) {
    return 2;
  }

  if (report.summary.warnings > 0) {
    return 1;
  }

  return 0;
}

export function formatDoctorJsonReport(report: DoctorReport): string {
  const status = getDoctorStatus(report);

  return `${JSON.stringify(
    {
      schemaVersion: "persist.doctor.v1",
      status,
      exitCode: getDoctorExitCode(report),
      summary: report.summary,
      findings: report.findings,
      checks: report.checks,
    },
    null,
    2,
  )}\n`;
}

export function formatDoctorReport(report: DoctorReport): string {
  const style = getStyle();
  const lines = [style.heading("Doctor Report"), ""];
  const sectionHead = {
    error: style.err("ERROR"),
    warning: style.warn("WARNING"),
    info: style.muted("INFO"),
  } as const;

  for (const severity of severityOrder) {
    const findings = report.findings.filter((finding) => finding.severity === severity);

    if (findings.length === 0) {
      continue;
    }

    lines.push(sectionHead[severity]);
    for (const finding of findings) {
      lines.push(`- ${formatFinding(finding)}`);
    }
    lines.push("");
  }

  if (report.findings.length === 0) {
    lines.push(style.muted("INFO"));
    lines.push("- No findings.");
    lines.push("");
  }

  const notEvaluated = report.checks.filter((check) => check.status === "not-evaluated");

  if (notEvaluated.length > 0) {
    lines.push(style.muted("NOT EVALUATED"));
    for (const check of notEvaluated) {
      lines.push(`- ${check.id}: ${check.reason ?? "no reason given"}`);
    }
    lines.push("");
  }

  lines.push(`Result: ${formatResult(report, style)}`);

  return `${lines.join("\n")}\n`;
}

function formatFinding(finding: DoctorFinding): string {
  if (finding.path === undefined) {
    return finding.message;
  }

  return `${finding.message} (${finding.path})`;
}

export function getDoctorStatus(report: DoctorReport): "passed" | "warnings" | "failed" {
  if (report.summary.errors > 0) {
    return "failed";
  }

  if (report.summary.warnings > 0) {
    return "warnings";
  }

  return "passed";
}

function formatResult(report: DoctorReport, style: StyleHelpers): string {
  const status = getDoctorStatus(report);

  if (status === "passed") {
    return style.ok("PASSED");
  }
  if (status === "warnings") {
    return style.warn("WARNINGS");
  }
  return style.err("FAILED");
}

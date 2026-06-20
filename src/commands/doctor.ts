import { runDoctor, type DoctorReport } from "../core/doctor/doctor-check.js";
import {
  formatDoctorReport,
  getDoctorExitCode
} from "../core/doctor/doctor-report.js";

export type DoctorOptions = {
  rootDir: string;
};

export type DoctorResult = {
  report: DoctorReport;
  exitCode: 0 | 1 | 2;
};

export async function doctorProject(options: DoctorOptions): Promise<DoctorResult> {
  const report = await runDoctor(options.rootDir);

  return {
    report,
    exitCode: getDoctorExitCode(report)
  };
}

export function formatDoctorResult(result: DoctorResult): string {
  return formatDoctorReport(result.report);
}


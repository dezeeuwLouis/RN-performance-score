import * as fs from 'fs';
import type { PerfReport } from '../types';
import { parseStepsFile, mergeStepsIntoReport } from '../merge/stepMerger';
import { printScoreSummary } from '../report/scoreCalculator';

interface ScoreOptions {
  input: string;
  steps?: string;
  minScore?: number;
  fpsThreshold?: number;
  json?: boolean;
}

export function score(options: ScoreOptions): void {
  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    process.exit(1);
  }

  let report: PerfReport = JSON.parse(
    fs.readFileSync(options.input, 'utf-8')
  );

  if (options.steps) {
    const steps = parseStepsFile(options.steps);
    report = mergeStepsIntoReport(report, steps);
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          score: report.score,
          avgJsFps: report.avgJsFps,
          avgUiFps: report.avgUiFps,
          minJsFps: report.minJsFps,
          minUiFps: report.minUiFps,
          droppedFramesJs: report.droppedFramesJs,
          droppedFramesUi: report.droppedFramesUi,
          samples: report.samples.length,
          duration: report.endTime - report.startTime,
        },
        null,
        2
      )
    );
  } else {
    printScoreSummary(report);
  }

  // Check thresholds
  if (options.minScore !== undefined && report.score < options.minScore) {
    console.error(
      `\nFAIL: Score ${report.score} is below minimum ${options.minScore}`
    );
    process.exit(1);
  }

  if (options.fpsThreshold !== undefined) {
    if (
      report.avgJsFps < options.fpsThreshold ||
      report.avgUiFps < options.fpsThreshold
    ) {
      console.error(
        `\nFAIL: Average FPS (JS: ${report.avgJsFps}, UI: ${report.avgUiFps}) is below threshold ${options.fpsThreshold}`
      );
      process.exit(1);
    }
  }
}

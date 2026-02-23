import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { PerfReport } from '../types';
import { parseStepsFile, mergeStepsIntoReport } from '../merge/stepMerger';
import { generateHtmlReport } from '../report/htmlTemplate';
import { printScoreSummary } from '../report/scoreCalculator';

interface ReportOptions {
  input: string;
  steps?: string;
  format: string;
  output?: string;
  open?: boolean;
}

export function report(options: ReportOptions): void {
  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    process.exit(1);
  }

  let perfReport: PerfReport = JSON.parse(
    fs.readFileSync(options.input, 'utf-8')
  );

  if (options.steps) {
    const steps = parseStepsFile(options.steps);
    perfReport = mergeStepsIntoReport(perfReport, steps);
  }

  const outputDir = options.output
    ? path.dirname(options.output)
    : path.dirname(options.input);
  const baseName = options.output
    ? path.basename(options.output, path.extname(options.output))
    : 'perf-report';

  if (options.format === 'html' || options.format === 'both') {
    const htmlPath = path.join(outputDir, `${baseName}.html`);
    const html = generateHtmlReport(perfReport);
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML report saved to: ${htmlPath}`);

    if (options.open) {
      try {
        execSync(`open "${htmlPath}"`, { stdio: 'ignore' });
      } catch {
        console.log('Could not open report automatically. Open it manually.');
      }
    }
  }

  if (options.format === 'json' || options.format === 'both') {
    const jsonPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(perfReport, null, 2));
    console.log(`JSON report saved to: ${jsonPath}`);
  }

  printScoreSummary(perfReport);
}

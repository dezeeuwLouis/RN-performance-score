import * as fs from 'fs';
import type { PerfReport } from '../types';

interface CompareOptions {
  input: string;
  baseline: string;
  maxRegression: number;
  json?: boolean;
}

export function compare(options: CompareOptions): void {
  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.baseline)) {
    console.error(
      `Baseline file not found: ${options.baseline}. Run 'rn-perf-score baseline' first.`
    );
    process.exit(1);
  }

  const current: PerfReport = JSON.parse(
    fs.readFileSync(options.input, 'utf-8')
  );
  const baseline: PerfReport = JSON.parse(
    fs.readFileSync(options.baseline, 'utf-8')
  );

  const regression = baseline.score - current.score;
  const regressionPct =
    baseline.score > 0
      ? ((regression / baseline.score) * 100).toFixed(1)
      : '0';
  const passed = regression <= options.maxRegression;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          currentScore: current.score,
          baselineScore: baseline.score,
          regression,
          regressionPercent: parseFloat(regressionPct),
          maxAllowed: options.maxRegression,
          passed,
        },
        null,
        2
      )
    );
  } else {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  Regression Analysis');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log(`  Current score:   ${current.score}`);
    console.log(`  Baseline score:  ${baseline.score}`);
    console.log(`  Regression:      ${regression > 0 ? '-' : '+'}${Math.abs(regression)} points (${regressionPct}%)`);
    console.log(`  Max allowed:     ${options.maxRegression} points`);
    console.log(`  Result:          ${passed ? '✓ PASS' : '✗ FAIL'}`);
    console.log('');
    console.log('═══════════════════════════════════════');
  }

  if (!passed) {
    process.exit(1);
  }
}

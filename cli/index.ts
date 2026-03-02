import { Command } from 'commander';
import { pull } from './commands/pull';
import { score } from './commands/score';
import { compare } from './commands/compare';
import { baseline } from './commands/baseline';
import { report } from './commands/report';

const program = new Command();

program
  .name('rn-perf-score')
  .description('React Native performance scoring CLI')
  .version('0.1.0');

program
  .command('pull')
  .description('Pull performance data from a connected device or simulator')
  .requiredOption('--app-id <id>', 'App bundle identifier')
  .option('--platform <platform>', 'Target platform (ios or android)')
  .option('--device-id <id>', 'Specific device or simulator ID')
  .option('--output <dir>', 'Output directory', './perf-results')
  .option('--filename <name>', 'Result filename', 'rn-perf-score-results.json')
  .action((opts) => {
    pull({
      platform: opts.platform,
      appId: opts.appId,
      output: opts.output,
      filename: opts.filename,
      deviceId: opts.deviceId,
    });
  });

program
  .command('score')
  .description('Calculate and display performance score')
  .requiredOption('--input <path>', 'Path to performance data JSON')
  .option('--steps <path>', 'Path to perf-steps.log for step markers')
  .option(
    '--min-score <n>',
    'Minimum passing score (exit 1 if below)',
    parseFloat
  )
  .option(
    '--fps-threshold <n>',
    'Minimum average FPS (exit 1 if below)',
    parseFloat
  )
  .option('--json', 'Output as JSON')
  .action((opts) => {
    score({
      input: opts.input,
      steps: opts.steps,
      minScore: opts.minScore,
      fpsThreshold: opts.fpsThreshold,
      json: opts.json,
    });
  });

program
  .command('report')
  .description('Generate an HTML/JSON performance report')
  .requiredOption('--input <path>', 'Path to performance data JSON')
  .option('--steps <path>', 'Path to perf-steps.log for step markers')
  .option('--format <format>', 'Output format: html, json, or both', 'both')
  .option('--output <path>', 'Output file path (without extension)')
  .option('--open', 'Open HTML report in browser after generation')
  .action((opts) => {
    report({
      input: opts.input,
      steps: opts.steps,
      format: opts.format,
      output: opts.output,
      open: opts.open,
    });
  });

program
  .command('compare')
  .description('Compare performance against a baseline')
  .requiredOption('--input <path>', 'Path to current run JSON')
  .option('--baseline <path>', 'Path to baseline file', '.perf-baseline.json')
  .option(
    '--max-regression <n>',
    'Max allowed score regression points',
    parseFloat,
    5
  )
  .option('--json', 'Output as JSON')
  .action((opts) => {
    compare({
      input: opts.input,
      baseline: opts.baseline,
      maxRegression: opts.maxRegression,
      json: opts.json,
    });
  });

program
  .command('baseline')
  .description('Save a performance run as the baseline')
  .requiredOption('--input <path>', 'Path to run JSON to save as baseline')
  .option('--output <path>', 'Baseline file path', '.perf-baseline.json')
  .action((opts) => {
    baseline({
      input: opts.input,
      output: opts.output,
    });
  });

program.parse();

import * as fs from 'fs';

interface BaselineOptions {
  input: string;
  output: string;
}

export function baseline(options: BaselineOptions): void {
  if (!fs.existsSync(options.input)) {
    console.error(`Input file not found: ${options.input}`);
    process.exit(1);
  }

  const data = fs.readFileSync(options.input, 'utf-8');

  // Validate it's valid JSON
  try {
    JSON.parse(data);
  } catch {
    console.error('Input file is not valid JSON.');
    process.exit(1);
  }

  fs.writeFileSync(options.output, data);
  console.log(`Baseline saved to: ${options.output}`);
}

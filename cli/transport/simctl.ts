import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function pullFromIos(
  appId: string,
  filename: string,
  outputDir: string,
  deviceId?: string
): string {
  const device = deviceId ?? 'booted';

  fs.mkdirSync(outputDir, { recursive: true });

  // Get app container path
  const containerPath = execSync(
    `xcrun simctl get_app_container ${device} ${appId} data`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim();

  const remotePath = path.join(containerPath, 'Documents', filename);
  const localPath = path.join(outputDir, filename);

  if (!fs.existsSync(remotePath)) {
    throw new Error(
      `File not found at ${remotePath}. Ensure the app has been run and recording was stopped.`
    );
  }

  fs.copyFileSync(remotePath, localPath);
  return localPath;
}

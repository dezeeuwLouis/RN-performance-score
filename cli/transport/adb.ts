import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export function pullFromAndroid(
  appId: string,
  filename: string,
  outputDir: string,
  deviceId?: string
): string {
  const deviceFlag = deviceId ? `-s ${deviceId}` : '';
  const remotePath = `/data/data/${appId}/files/${filename}`;
  const localPath = path.join(outputDir, filename);

  fs.mkdirSync(outputDir, { recursive: true });

  try {
    execSync(`adb ${deviceFlag} pull "${remotePath}" "${localPath}"`, {
      stdio: 'pipe',
    });
    return localPath;
  } catch (error) {
    // Try run-as for non-debuggable apps
    try {
      execSync(
        `adb ${deviceFlag} shell "run-as ${appId} cat files/${filename}" > "${localPath}"`,
        { stdio: 'pipe' }
      );
      return localPath;
    } catch {
      throw new Error(
        `Failed to pull ${filename} from Android device. Ensure the app has been run and the file exists.`
      );
    }
  }
}

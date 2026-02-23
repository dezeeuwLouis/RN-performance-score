import * as fs from 'fs';
import { detectPlatform } from '../transport/detect';
import { pullFromAndroid } from '../transport/adb';
import { pullFromIos } from '../transport/simctl';

interface PullOptions {
  platform?: string;
  appId: string;
  output: string;
  filename: string;
  deviceId?: string;
}

export function pull(options: PullOptions): void {
  const platform = options.platform ?? detectPlatform();

  if (!platform) {
    console.error(
      'Could not auto-detect platform. Use --platform <ios|android>.'
    );
    process.exit(1);
  }

  console.log(`Pulling performance data from ${platform} device...`);

  let localPath: string;

  if (platform === 'android') {
    localPath = pullFromAndroid(
      options.appId,
      options.filename,
      options.output,
      options.deviceId
    );
  } else {
    localPath = pullFromIos(
      options.appId,
      options.filename,
      options.output,
      options.deviceId
    );
  }

  if (fs.existsSync(localPath)) {
    console.log(`Performance data saved to: ${localPath}`);
  } else {
    console.error('Failed to pull performance data.');
    process.exit(1);
  }
}

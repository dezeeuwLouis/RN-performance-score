import { execSync } from 'child_process';

export type Platform = 'ios' | 'android';

export function detectPlatform(): Platform | null {
  const hasAdb = isCommandAvailable('adb devices');
  const hasSimctl = isCommandAvailable('xcrun simctl list devices booted');

  if (hasSimctl && !hasAdb) return 'ios';
  if (hasAdb && !hasSimctl) return 'android';
  if (hasSimctl && hasAdb) return 'ios'; // Default to iOS on macOS

  return null;
}

function isCommandAvailable(command: string): boolean {
  try {
    execSync(command, { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

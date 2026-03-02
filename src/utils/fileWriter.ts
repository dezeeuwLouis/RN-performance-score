import NativeRnPerfScore from '../NativeRnPerfScore';

export function writeResultFile(filename: string, data: unknown): string {
  const jsonContent = JSON.stringify(data);
  return NativeRnPerfScore.writeResultFile(filename, jsonContent);
}

export function getResultFilePath(filename: string): string {
  return NativeRnPerfScore.getResultFilePath(filename);
}

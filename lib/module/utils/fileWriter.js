"use strict";

import NativeRnPerfScore from "../NativeRnPerfScore.js";
export function writeResultFile(filename, data) {
  const jsonContent = JSON.stringify(data);
  return NativeRnPerfScore.writeResultFile(filename, jsonContent);
}
export function getResultFilePath(filename) {
  return NativeRnPerfScore.getResultFilePath(filename);
}
//# sourceMappingURL=fileWriter.js.map
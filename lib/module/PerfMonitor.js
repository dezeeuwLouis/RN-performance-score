"use strict";

import { useEffect, useRef } from 'react';
import { PerfScore } from "./index.js";
export function PerfMonitor({
  sampleIntervalMs,
  targetFps,
  enableAutoInstrumentation,
  outputFilename,
  onComplete
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    PerfScore.start({
      sampleIntervalMs,
      targetFps,
      enableAutoInstrumentation,
      outputFilename
    });
    return () => {
      const report = PerfScore.stopAndSave(outputFilename);
      onCompleteRef.current?.(report);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
//# sourceMappingURL=PerfMonitor.js.map
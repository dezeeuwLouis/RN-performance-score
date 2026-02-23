import { useEffect, useRef } from 'react';
import type { PerfScoreConfig } from './types';
import { PerfScore } from './index';

export interface PerfMonitorProps extends PerfScoreConfig {
  onComplete?: (report: ReturnType<typeof PerfScore.stopAndSave>) => void;
}

export function PerfMonitor({
  sampleIntervalMs,
  targetFps,
  enableAutoInstrumentation,
  outputFilename,
  onComplete,
}: PerfMonitorProps): null {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    PerfScore.start({
      sampleIntervalMs,
      targetFps,
      enableAutoInstrumentation,
      outputFilename,
    });

    return () => {
      const report = PerfScore.stopAndSave(outputFilename);
      onCompleteRef.current?.(report);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export interface ScoreResult {
    score: number;
    avgJsFps: number;
    avgUiFps: number;
    minJsFps: number;
    minUiFps: number;
    droppedFramesJs: number;
    droppedFramesUi: number;
}
/**
 * Calculate a performance score from FPS samples.
 *
 * The formula weights UI thread 60% and JS thread 40%, then applies
 * severity penalties based on frame drops.
 */
export declare function calculateScore(samples: ReadonlyArray<{
    jsFps: number;
    uiFps: number;
}>, targetFps: number): ScoreResult;
//# sourceMappingURL=scoring.d.ts.map
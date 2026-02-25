#import "RnPerfScore.h"
#import <QuartzCore/CADisplayLink.h>

static const NSInteger kWindowMultiplier = 3;

@implementation RnPerfScore {
    CADisplayLink *_displayLink;
    NSMutableArray<NSNumber *> *_frameTimestamps;
    NSInteger _framesSinceEmit;
    CFTimeInterval _lastEmitTime;
    double _sampleIntervalMs;
    double _windowMs;
    BOOL _isRecording;
    BOOL _hasListeners;
}

+ (NSString *)moduleName {
    return @"RnPerfScore";
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onUiFpsSample"];
}

- (void)startObserving {
    _hasListeners = YES;
}

- (void)stopObserving {
    _hasListeners = NO;
}

#pragma mark - NativeRnPerfScoreSpec

- (void)startRecording:(double)sampleIntervalMs {
    if (_isRecording) return;

    _isRecording = YES;
    _sampleIntervalMs = sampleIntervalMs;
    _windowMs = sampleIntervalMs * kWindowMultiplier;
    _frameTimestamps = [NSMutableArray new];
    _framesSinceEmit = 0;
    _lastEmitTime = CACurrentMediaTime();

    dispatch_async(dispatch_get_main_queue(), ^{
        self->_displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onFrame:)];
        [self->_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    });
}

- (void)stopRecording {
    if (!_isRecording) return;

    _isRecording = NO;

    dispatch_async(dispatch_get_main_queue(), ^{
        [self->_displayLink invalidate];
        self->_displayLink = nil;
    });
}

- (NSNumber *)isRecording {
    return @(_isRecording);
}

- (NSString *)getUiFpsSamples {
    // Samples are emitted via events; this returns empty for now
    return @"[]";
}

- (NSString *)writeResultFile:(NSString *)filename jsonContent:(NSString *)jsonContent {
    NSString *documentsPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    NSString *filePath = [documentsPath stringByAppendingPathComponent:filename];

    NSError *error;
    [jsonContent writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];

    if (error) {
        NSLog(@"[rn-perf-score] Error writing file: %@", error.localizedDescription);
        return @"";
    }

    return filePath;
}

- (NSString *)getResultFilePath:(NSString *)filename {
    NSString *documentsPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    return [documentsPath stringByAppendingPathComponent:filename];
}

#pragma mark - Display Link

- (void)onFrame:(CADisplayLink *)displayLink {
    CFTimeInterval currentTime = CACurrentMediaTime();

    [_frameTimestamps addObject:@(currentTime)];
    _framesSinceEmit++;

    // Trim timestamps older than the sliding window
    CFTimeInterval cutoff = currentTime - (_windowMs / 1000.0);
    while (_frameTimestamps.count > 0 && [_frameTimestamps[0] doubleValue] < cutoff) {
        [_frameTimestamps removeObjectAtIndex:0];
    }

    CFTimeInterval elapsedMs = (currentTime - _lastEmitTime) * 1000.0;

    if (elapsedMs >= _sampleIntervalMs) {
        double fps = 0.0;

        if (elapsedMs > _windowMs) {
            // UI thread was blocked — use frame count over actual elapsed time
            CFTimeInterval elapsedSec = elapsedMs / 1000.0;
            fps = (double)_framesSinceEmit / elapsedSec;
        } else if (_frameTimestamps.count >= 2) {
            // Normal operation — use sliding window for smooth readings
            CFTimeInterval oldest = [_frameTimestamps[0] doubleValue];
            CFTimeInterval span = currentTime - oldest;
            if (span > 0.0) {
                fps = (double)(_frameTimestamps.count - 1) / span;
            }
        }

        fps = MIN(fps, 60.0);

        if (_hasListeners) {
            NSNumber *timestamp = @((NSInteger)([[NSDate date] timeIntervalSince1970] * 1000));
            [self sendEventWithName:@"onUiFpsSample" body:@{
                @"timestamp": timestamp,
                @"fps": @(fps)
            }];
        }

        _lastEmitTime = currentTime;
        _framesSinceEmit = 0;
    }
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnPerfScoreSpecJSI>(params);
}

@end

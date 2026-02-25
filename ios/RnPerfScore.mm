#import "RnPerfScore.h"
#import <QuartzCore/CADisplayLink.h>

static const NSInteger kMaxBufferSize = 64;

@implementation RnPerfScore {
    CADisplayLink *_displayLink;
    CFTimeInterval _frameTimestamps[kMaxBufferSize];
    NSInteger _bufferHead;
    NSInteger _bufferCount;
    CFTimeInterval _lastEmitTime;
    double _sampleIntervalMs;
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
    _bufferHead = 0;
    _bufferCount = 0;
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

    // Push timestamp into circular buffer
    _frameTimestamps[_bufferHead] = currentTime;
    _bufferHead = (_bufferHead + 1) % kMaxBufferSize;
    if (_bufferCount < kMaxBufferSize) {
        _bufferCount++;
    }

    CFTimeInterval elapsedSinceEmit = (currentTime - _lastEmitTime) * 1000.0;

    if (elapsedSinceEmit >= _sampleIntervalMs && _bufferCount >= 2) {
        // Compute FPS from buffer: (N-1) / (newest - oldest)
        NSInteger newestIdx = (_bufferHead - 1 + kMaxBufferSize) % kMaxBufferSize;
        NSInteger oldestIdx = (_bufferCount < kMaxBufferSize) ? 0 : _bufferHead;
        CFTimeInterval newest = _frameTimestamps[newestIdx];
        CFTimeInterval oldest = _frameTimestamps[oldestIdx];
        CFTimeInterval span = newest - oldest;

        double fps = 0.0;
        if (span > 0.0) {
            fps = (double)(_bufferCount - 1) / span;
            fps = MIN(fps, 60.0);
        }

        if (_hasListeners) {
            NSNumber *timestamp = @((NSInteger)([[NSDate date] timeIntervalSince1970] * 1000));
            [self sendEventWithName:@"onUiFpsSample" body:@{
                @"timestamp": timestamp,
                @"fps": @(fps)
            }];
        }

        _lastEmitTime = currentTime;
    }
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnPerfScoreSpecJSI>(params);
}

@end

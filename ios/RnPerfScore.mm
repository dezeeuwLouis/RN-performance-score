#import "RnPerfScore.h"
#import <QuartzCore/CADisplayLink.h>

@implementation RnPerfScore {
    CADisplayLink *_displayLink;
    NSInteger _frameCount;
    CFTimeInterval _lastSampleTime;
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
    _frameCount = 0;
    _lastSampleTime = CACurrentMediaTime();

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
    _frameCount++;

    CFTimeInterval currentTime = CACurrentMediaTime();
    CFTimeInterval elapsed = (currentTime - _lastSampleTime) * 1000.0; // Convert to ms

    if (elapsed >= _sampleIntervalMs) {
        double fps = (double)_frameCount / (elapsed / 1000.0);
        fps = MIN(fps, 60.0); // Cap at 60

        if (_hasListeners) {
            NSNumber *timestamp = @((NSInteger)([[NSDate date] timeIntervalSince1970] * 1000));
            [self sendEventWithName:@"onUiFpsSample" body:@{
                @"timestamp": timestamp,
                @"fps": @(round(fps))
            }];
        }

        _frameCount = 0;
        _lastSampleTime = currentTime;
    }
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRnPerfScoreSpecJSI>(params);
}

@end

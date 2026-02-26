package com.rnperfscore

import android.view.Choreographer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class RnPerfScoreModule(reactContext: ReactApplicationContext) :
  NativeRnPerfScoreSpec(reactContext) {

  private var isRecording = false
  private var sampleIntervalMs: Double = 100.0
  private var listenerCount = 0

  companion object {
    const val NAME = NativeRnPerfScoreSpec.NAME
    private const val WINDOW_MULTIPLIER = 3
    private const val TARGET_FPS = 60.0
    private const val SNAP_THRESHOLD = 0.92
  }

  private val frameTimestamps = mutableListOf<Long>()
  private var framesSinceEmit = 0
  private var lastEmitTimeNs: Long = 0
  private var windowNs: Long = 0

  private val choreographerCallback = object : Choreographer.FrameCallback {
    override fun doFrame(frameTimeNanos: Long) {
      if (!isRecording) return

      frameTimestamps.add(frameTimeNanos)
      framesSinceEmit++

      // Trim timestamps older than the sliding window
      val cutoff = frameTimeNanos - windowNs
      while (frameTimestamps.isNotEmpty() && frameTimestamps[0] < cutoff) {
        frameTimestamps.removeAt(0)
      }

      if (lastEmitTimeNs == 0L) {
        lastEmitTimeNs = frameTimeNanos
      }

      val elapsedNs = frameTimeNanos - lastEmitTimeNs
      val elapsedMs = elapsedNs / 1_000_000.0

      if (elapsedMs >= sampleIntervalMs) {
        var fps = 0.0

        if (elapsedNs > windowNs) {
          // UI thread was blocked — use frame count over actual elapsed time
          fps = (framesSinceEmit.toDouble() / elapsedNs) * 1_000_000_000.0
        } else if (frameTimestamps.size >= 2) {
          // Normal operation — use sliding window for smooth readings
          val oldest = frameTimestamps[0]
          val spanNs = frameTimeNanos - oldest
          if (spanNs > 0) {
            fps = ((frameTimestamps.size - 1).toDouble() / spanNs) * 1_000_000_000.0
          }
        }

        fps = if (fps >= TARGET_FPS * SNAP_THRESHOLD) {
          TARGET_FPS
        } else {
          fps.coerceAtMost(TARGET_FPS)
        }

        if (listenerCount > 0) {
          val params = Arguments.createMap().apply {
            putDouble("timestamp", System.currentTimeMillis().toDouble())
            putDouble("fps", fps)
          }
          reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onUiFpsSample", params)
        }

        lastEmitTimeNs = frameTimeNanos
        framesSinceEmit = 0
      }

      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  override fun startRecording(sampleIntervalMs: Double) {
    if (isRecording) return

    isRecording = true
    this.sampleIntervalMs = sampleIntervalMs
    this.windowNs = (sampleIntervalMs * WINDOW_MULTIPLIER * 1_000_000).toLong()
    frameTimestamps.clear()
    framesSinceEmit = 0
    lastEmitTimeNs = 0

    reactApplicationContext.runOnUiQueueThread {
      Choreographer.getInstance().postFrameCallback(choreographerCallback)
    }
  }

  override fun stopRecording() {
    if (!isRecording) return

    isRecording = false

    reactApplicationContext.runOnUiQueueThread {
      Choreographer.getInstance().removeFrameCallback(choreographerCallback)
    }
  }

  override fun isRecording(): Boolean {
    return isRecording
  }

  override fun getUiFpsSamples(): String {
    return "[]"
  }

  override fun writeResultFile(filename: String, jsonContent: String): String {
    val file = File(reactApplicationContext.filesDir, filename)
    return try {
      file.writeText(jsonContent)
      file.absolutePath
    } catch (e: Exception) {
      ""
    }
  }

  override fun getResultFilePath(filename: String): String {
    return File(reactApplicationContext.filesDir, filename).absolutePath
  }

  override fun addListener(eventName: String) {
    listenerCount++
  }

  override fun removeListeners(count: Double) {
    listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
  }

}

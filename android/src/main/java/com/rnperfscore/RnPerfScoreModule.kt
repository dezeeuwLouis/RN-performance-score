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
    private const val MAX_BUFFER_SIZE = 64
  }

  private val frameTimestamps = LongArray(MAX_BUFFER_SIZE)
  private var bufferHead = 0
  private var bufferCount = 0
  private var lastEmitTimeNs: Long = 0

  private val choreographerCallback = object : Choreographer.FrameCallback {
    override fun doFrame(frameTimeNanos: Long) {
      if (!isRecording) return

      // Push timestamp into circular buffer
      frameTimestamps[bufferHead] = frameTimeNanos
      bufferHead = (bufferHead + 1) % MAX_BUFFER_SIZE
      if (bufferCount < MAX_BUFFER_SIZE) bufferCount++

      if (lastEmitTimeNs == 0L) {
        lastEmitTimeNs = frameTimeNanos
      }

      val elapsedMs = (frameTimeNanos - lastEmitTimeNs) / 1_000_000.0

      if (elapsedMs >= sampleIntervalMs && bufferCount >= 2) {
        val newestIdx = (bufferHead - 1 + MAX_BUFFER_SIZE) % MAX_BUFFER_SIZE
        val oldestIdx = if (bufferCount < MAX_BUFFER_SIZE) 0 else bufferHead
        val newest = frameTimestamps[newestIdx]
        val oldest = frameTimestamps[oldestIdx]
        val spanNs = newest - oldest

        var fps = 0.0
        if (spanNs > 0) {
          fps = ((bufferCount - 1).toDouble() / spanNs) * 1_000_000_000.0
          fps = fps.coerceAtMost(60.0)
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
      }

      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  override fun startRecording(sampleIntervalMs: Double) {
    if (isRecording) return

    isRecording = true
    this.sampleIntervalMs = sampleIntervalMs
    bufferHead = 0
    bufferCount = 0
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

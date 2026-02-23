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
  private var frameCount = 0
  private var lastSampleTimeNs: Long = 0
  private var listenerCount = 0

  private val choreographerCallback = object : Choreographer.FrameCallback {
    override fun doFrame(frameTimeNanos: Long) {
      if (!isRecording) return

      frameCount++

      if (lastSampleTimeNs == 0L) {
        lastSampleTimeNs = frameTimeNanos
      }

      val elapsedMs = (frameTimeNanos - lastSampleTimeNs) / 1_000_000.0

      if (elapsedMs >= sampleIntervalMs) {
        val fps = (frameCount / (elapsedMs / 1000.0)).coerceAtMost(60.0)

        if (listenerCount > 0) {
          val params = Arguments.createMap().apply {
            putDouble("timestamp", System.currentTimeMillis().toDouble())
            putDouble("fps", Math.round(fps).toDouble())
          }
          reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onUiFpsSample", params)
        }

        frameCount = 0
        lastSampleTimeNs = frameTimeNanos
      }

      Choreographer.getInstance().postFrameCallback(this)
    }
  }

  override fun startRecording(sampleIntervalMs: Double) {
    if (isRecording) return

    isRecording = true
    this.sampleIntervalMs = sampleIntervalMs
    frameCount = 0
    lastSampleTimeNs = 0

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

  companion object {
    const val NAME = NativeRnPerfScoreSpec.NAME
  }
}

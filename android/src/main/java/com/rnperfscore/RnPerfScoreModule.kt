package com.rnperfscore

import com.facebook.react.bridge.ReactApplicationContext

class RnPerfScoreModule(reactContext: ReactApplicationContext) :
  NativeRnPerfScoreSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeRnPerfScoreSpec.NAME
  }
}

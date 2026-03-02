const DEFAULT_HAPTIC_PATTERN = 10

type HapticPattern = number | number[]

function isCoarsePointerDevice() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }

  return window.matchMedia("(pointer: coarse)").matches
}

function isIOSDevice() {
  if (typeof navigator === "undefined") {
    return false
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function hasVibrationApi() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
}

function triggerIOSCheckboxHack() {
  if (typeof document === "undefined") {
    return false
  }

  const input = document.createElement("input")
  input.type = "checkbox"
  input.setAttribute("aria-hidden", "true")
  input.tabIndex = -1
  input.style.position = "fixed"
  input.style.opacity = "0"
  input.style.pointerEvents = "none"

  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)

  return true
}

export const supportsHaptic = isCoarsePointerDevice() && (hasVibrationApi() || isIOSDevice())

export function haptic(pattern: HapticPattern = DEFAULT_HAPTIC_PATTERN) {
  if (!isCoarsePointerDevice()) {
    return false
  }

  if (hasVibrationApi()) {
    navigator.vibrate(pattern)
    return true
  }

  if (isIOSDevice()) {
    return triggerIOSCheckboxHack()
  }

  return false
}

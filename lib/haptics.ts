const IOS_HAPTIC_SWITCH_ID = "web-haptics-ios-switch"
let iosHapticLabel: HTMLLabelElement | null = null
const IOS_PULSE_MS = 16

type HapticPattern = number | number[]

function ensureIosHapticLabel() {
  if (typeof document === "undefined") {
    return null
  }

  if (iosHapticLabel && iosHapticLabel.isConnected) {
    return iosHapticLabel
  }

  let input = document.getElementById(
    IOS_HAPTIC_SWITCH_ID,
  ) as HTMLInputElement | null

  if (!input) {
    input = document.createElement("input")
    input.type = "checkbox"
    input.id = IOS_HAPTIC_SWITCH_ID
    input.setAttribute("switch", "")
    input.setAttribute("aria-hidden", "true")
    input.tabIndex = -1
    input.style.position = "fixed"
    input.style.left = "-9999px"
    input.style.width = "0"
    input.style.height = "0"
    input.style.opacity = "0"
    input.style.pointerEvents = "none"
    document.body.appendChild(input)
  }

  let label = document.querySelector(
    `label[for="${IOS_HAPTIC_SWITCH_ID}"]`,
  ) as HTMLLabelElement | null

  if (!label) {
    label = document.createElement("label")
    label.htmlFor = IOS_HAPTIC_SWITCH_ID
    label.setAttribute("aria-hidden", "true")
    label.tabIndex = -1
    label.style.position = "fixed"
    label.style.left = "-9999px"
    label.style.width = "0"
    label.style.height = "0"
    label.style.opacity = "0"
    label.style.pointerEvents = "none"
    document.body.appendChild(label)
  }

  iosHapticLabel = label
  return iosHapticLabel
}

function triggerIosSwitchPattern(pattern: HapticPattern) {
  const label = ensureIosHapticLabel()
  if (!label) {
    return
  }

  const segments = Array.isArray(pattern) ? pattern : [pattern]
  let cursor = 0
  let hasPulse = false

  segments.forEach((segment, index) => {
    if (segment <= 0) {
      return
    }

    if (index % 2 === 1) {
      cursor += segment
      return
    }

    hasPulse = true
    const pulses = Math.max(1, Math.round(segment / IOS_PULSE_MS))
    for (let pulse = 0; pulse < pulses; pulse += 1) {
      window.setTimeout(() => label.click(), cursor + pulse * IOS_PULSE_MS)
    }
    cursor += pulses * IOS_PULSE_MS
  })

  if (!hasPulse) {
    label.click()
  }
}

export function triggerButtonHaptic(pattern: HapticPattern = 12) {
  if (typeof window === "undefined") {
    return
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    const didVibrate = navigator.vibrate(pattern)
    if (didVibrate) {
      return
    }
  }

  triggerIosSwitchPattern(pattern)
}

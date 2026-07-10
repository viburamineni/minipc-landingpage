"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ServiceStatusState =
  | "checking"
  | "online"
  | "offline"
  | "unavailable"

const STATUS_LABELS: Record<ServiceStatusState, string> = {
  checking: "Checking",
  online: "Online",
  offline: "Offline",
  unavailable: "Status unavailable",
}

const STATUS_STYLES: Record<ServiceStatusState, string> = {
  checking: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  online: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  offline: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  unavailable: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
}

const STATUS_DOT_STYLES: Record<ServiceStatusState, string> = {
  checking: "bg-sky-500",
  online: "bg-emerald-500",
  offline: "bg-rose-500",
  unavailable: "bg-amber-500",
}

type ServiceStatusProps = {
  statusUrl: string
  timeoutMs?: number
  onStatusChange?: (status: ServiceStatusState) => void
}

async function resolveServiceStatus(statusUrl: string, signal: AbortSignal) {
  const response = await fetch(statusUrl, {
    method: "GET",
    cache: "no-store",
    signal,
  })

  if (response.status === 204) return true
  if (response.status === 503) return false

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json()
    if (typeof payload === "boolean") return payload
  }

  throw new Error(`Unexpected status response: ${response.status}`)
}

export function ServiceStatus({
  statusUrl,
  timeoutMs = 2500,
  onStatusChange,
}: ServiceStatusProps) {
  const [status, setStatus] = React.useState<ServiceStatusState>("checking")
  const onStatusChangeRef = React.useRef(onStatusChange)

  React.useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  React.useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    setStatus("checking")
    onStatusChangeRef.current?.("checking")

    resolveServiceStatus(statusUrl, controller.signal)
      .then((isOnline) => {
        if (active) {
          const nextStatus = isOnline ? "online" : "offline"
          setStatus(nextStatus)
          onStatusChangeRef.current?.(nextStatus)
        }
      })
      .catch(() => {
        if (active) {
          setStatus("unavailable")
          onStatusChangeRef.current?.("unavailable")
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [statusUrl, timeoutMs])

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLES[status])}
      aria-label={`Service status: ${STATUS_LABELS[status]}`}
    >
      <span
        className={cn("size-1.5 rounded-full", STATUS_DOT_STYLES[status])}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </Badge>
  )
}

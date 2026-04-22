"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ServiceStatusState = "checking" | "online" | "offline"

const STATUS_LABELS: Record<ServiceStatusState, string> = {
  checking: "Checking",
  online: "Online",
  offline: "Offline",
}

const STATUS_STYLES: Record<ServiceStatusState, string> = {
  checking: "border-muted text-muted-foreground",
  online: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  offline: "border-rose-500/40 text-rose-600 dark:text-rose-400",
}

type ServiceStatusProps = {
  statusUrl: string
  timeoutMs?: number
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

export function ServiceStatus({ statusUrl, timeoutMs = 2500 }: ServiceStatusProps) {
  const [status, setStatus] = React.useState<ServiceStatusState>("checking")

  React.useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    setStatus("checking")

    resolveServiceStatus(statusUrl, controller.signal)
      .then((isOnline) => {
        if (active) {
          setStatus(isOnline ? "online" : "offline")
        }
      })
      .catch(() => {
        if (active) {
          setStatus("offline")
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
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

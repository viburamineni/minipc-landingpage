"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ServiceStatusState = "checking" | "online" | "offline"
type RestrictedServiceStatusState = ServiceStatusState | "restricted"

const STATUS_LABELS: Record<RestrictedServiceStatusState, string> = {
  checking: "Checking",
  online: "Online",
  offline: "Offline",
  restricted: "Unverified",
}

const STATUS_STYLES: Record<RestrictedServiceStatusState, string> = {
  checking: "border-muted text-muted-foreground",
  online: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  offline: "border-rose-500/40 text-rose-600 dark:text-rose-400",
  restricted: "border-amber-500/40 text-amber-600 dark:text-amber-400",
}

type ServiceStatusProps = {
  url: string
  pingUrl?: string
  timeoutMs?: number
  requiresFirstOpenApproval?: boolean
  hasFirstOpenApproval?: boolean
  restrictWhenOffline?: boolean
}

export function ServiceStatus({
  url,
  pingUrl,
  timeoutMs = 2500,
  requiresFirstOpenApproval = false,
  hasFirstOpenApproval = false,
  restrictWhenOffline = false,
}: ServiceStatusProps) {
  const [status, setStatus] = React.useState<RestrictedServiceStatusState>("checking")
  const targetUrl = React.useMemo(() => pingUrl ?? url, [pingUrl, url])

  React.useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    setStatus("checking")

    fetch(targetUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(() => {
        if (active) {
          setStatus("online")
        }
      })
      .catch(() => {
        if (active) {
          const blockedForApproval = requiresFirstOpenApproval && !hasFirstOpenApproval
          const shouldShowRestricted = restrictWhenOffline || blockedForApproval
          setStatus(shouldShowRestricted ? "restricted" : "offline")
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
  }, [
    hasFirstOpenApproval,
    requiresFirstOpenApproval,
    restrictWhenOffline,
    targetUrl,
    timeoutMs,
  ])

  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

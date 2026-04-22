import "server-only"

import http from "node:http"
import https from "node:https"

import { getServiceDefinition, SERVICE_DEFINITIONS, type ServiceId } from "@/lib/service-catalog"

const STATUS_TIMEOUT_MS = 2500

function isOnlineStatus(statusCode?: number) {
  if (!statusCode) return false
  return (statusCode >= 200 && statusCode < 400) || statusCode === 401 || statusCode === 403
}

async function probeServiceUrl(serviceId: ServiceId) {
  const service = getServiceDefinition(serviceId)
  if (!service) return false

  const transport = service.probeTarget.protocol === "https" ? https : http

  return new Promise<boolean>((resolve) => {
    let settled = false

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const request = transport.request(
      {
        hostname: service.probeTarget.hostname,
        port: service.probeTarget.port,
        path: service.probeTarget.path,
        method: "GET",
        rejectUnauthorized: false,
        timeout: STATUS_TIMEOUT_MS,
      },
      (response) => {
        response.resume()
        finish(isOnlineStatus(response.statusCode))
      }
    )

    request.on("timeout", () => {
      request.destroy(new Error("Timed out"))
      finish(false)
    })
    request.on("error", () => finish(false))
    request.end()
  })
}

export async function getServiceStatus(serviceId: ServiceId) {
  return probeServiceUrl(serviceId)
}

export async function getAllServiceStatuses() {
  const statuses = await Promise.all(
    SERVICE_DEFINITIONS.map(async (service) => [service.id, await getServiceStatus(service.id)] as const)
  )

  return Object.fromEntries(statuses) as Record<ServiceId, boolean>
}

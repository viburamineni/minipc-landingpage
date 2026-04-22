export type ServiceId = "portainer" | "pterodactyl" | "pihole" | "code-server"

type LinkTarget = {
  protocol: "http" | "https"
  port?: number
  path?: string
}

type ProbeTarget = {
  protocol: "http" | "https"
  hostname: string
  port?: number
  path: string
}

export type ServiceDefinition = {
  id: ServiceId
  name: string
  description: string
  category: string
  statusEndpoint: `/api/status/${string}`
  linkTarget: LinkTarget
  probeTarget: ProbeTarget
}

const SERVICE_HOSTNAME = "192.168.4.142"

export const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    id: "portainer",
    name: "Portainer",
    description: "Docker management dashboard",
    category: "Containers",
    statusEndpoint: "/api/status/portainer",
    linkTarget: {
      protocol: "https",
      port: 9443,
    },
    probeTarget: {
      protocol: "https",
      hostname: SERVICE_HOSTNAME,
      port: 9443,
      path: "/",
    },
  },
  {
    id: "pterodactyl",
    name: "Pterodactyl",
    description: "Game server management",
    category: "Servers",
    statusEndpoint: "/api/status/pterodactyl",
    linkTarget: {
      protocol: "https",
      port: 8444,
    },
    probeTarget: {
      protocol: "https",
      hostname: SERVICE_HOSTNAME,
      port: 8444,
      path: "/",
    },
  },
  {
    id: "pihole",
    name: "Pi-hole",
    description: "DNS ad blocking",
    category: "Network",
    statusEndpoint: "/api/status/pihole",
    linkTarget: {
      protocol: "https",
      path: "/admin/",
    },
    probeTarget: {
      protocol: "https",
      hostname: SERVICE_HOSTNAME,
      path: "/admin/",
    },
  },
  {
    id: "code-server",
    name: "code-server",
    description: "Browser-based VS Code",
    category: "Development",
    statusEndpoint: "/api/status/code-server",
    linkTarget: {
      protocol: "https",
      port: 8080,
      path: "/login",
    },
    probeTarget: {
      protocol: "https",
      hostname: SERVICE_HOSTNAME,
      port: 8080,
      path: "/login",
    },
  },
]

export function getServiceDefinition(serviceId: string) {
  return SERVICE_DEFINITIONS.find((service) => service.id === serviceId)
}

export function buildServiceUrl(hostname: string, service: ServiceDefinition) {
  const port = service.linkTarget.port ? `:${service.linkTarget.port}` : ""
  const path = service.linkTarget.path ?? ""

  return `${service.linkTarget.protocol}://${hostname}${port}${path}`
}

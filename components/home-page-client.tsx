"use client";

import { useEffect, useMemo, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { ServiceStatus } from "@/components/service-status";
import { SystemMetricsCard } from "@/components/system-metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ServiceDefinition = {
  name: string;
  description: string;
  protocol: "http" | "https";
  port: number;
  path?: string;
  pingPath?: string;
  category: string;
  requiresFirstOpenApproval?: boolean;
  restrictWhenOffline?: boolean;
};

type Service = {
  name: string;
  description: string;
  url: string;
  pingUrl: string;
  category: string;
  requiresFirstOpenApproval?: boolean;
  restrictWhenOffline?: boolean;
};

type QuickAction = {
  label: string;
  description: string;
  url: string;
};

type QuickActionDefinition = {
  label: string;
  description: string;
  username?: string;
  port: number;
};

const serviceDefinitions: ServiceDefinition[] = [
  {
    name: "Portainer",
    description: "Docker management dashboard",
    protocol: "https",
    port: 9443,
    pingPath: "/favicon.ico",
    category: "Containers",
    requiresFirstOpenApproval: true,
  },
  {
    name: "Pterodactyl",
    description: "Game server management",
    protocol: "http",
    port: 8081,
    pingPath: "/favicon.ico",
    category: "Servers",
  },
  {
    name: "Pi-hole",
    description: "DNS ad blocking",
    protocol: "http",
    port: 8082,
    path: "/admin",
    pingPath: "/admin/favicon.ico",
    category: "Network",
  },
  {
    name: "code-server",
    description: "Browser-based VS Code",
    protocol: "http",
    port: 8080,
    path: "/login",
    pingPath: "/favicon.ico",
    category: "Development",
  },
];

const quickActionDefinitions: QuickActionDefinition[] = [
  {
    label: "SSH",
    description: "Open a secure shell session",
    username: "administrator",
    port: 22,
  },
];

function buildNetworkUrl(
  protocol: "http" | "https",
  hostname: string,
  port: number,
  path = ""
) {
  return `${protocol}://${hostname}:${port}${path}`;
}

function buildServices(hostname: string): Service[] {
  return serviceDefinitions.map((service) => ({
    name: service.name,
    description: service.description,
    url: buildNetworkUrl(
      service.protocol,
      hostname,
      service.port,
      service.path ?? ""
    ),
    pingUrl: buildNetworkUrl(
      service.protocol,
      hostname,
      service.port,
      service.pingPath ?? service.path ?? ""
    ),
    category: service.category,
    requiresFirstOpenApproval: service.requiresFirstOpenApproval,
    restrictWhenOffline: service.restrictWhenOffline,
  }));
}

function buildQuickActions(hostname: string): QuickAction[] {
  return quickActionDefinitions.map((action) => ({
    label: action.label,
    description: action.description,
    url: `ssh://${action.username ?? ""}${
      action.username ? "@" : ""
    }${hostname}:${action.port}`,
  }));
}

export function HomePageClient() {
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);
  const [openedServices, setOpenedServices] = useState<Record<string, boolean>>(
    {}
  );

  const services = useMemo(() => {
    if (!currentHostname) {
      return [];
    }

    return buildServices(currentHostname);
  }, [currentHostname]);
  const quickActions = useMemo(() => {
    if (!currentHostname) {
      return [];
    }

    return buildQuickActions(currentHostname);
  }, [currentHostname]);
  const servicesByName = useMemo(
    () => new Map(services.map((service) => [service.name, service])),
    [services]
  );

  const serviceSessionKeys = useMemo(
    () =>
      Object.fromEntries(
        serviceDefinitions.map((service) => [
          service.name,
          `service-opened:${service.name.toLowerCase()}`,
        ])
      ),
    []
  );

  useEffect(() => {
    setCurrentHostname(window.location.hostname || "localhost");
  }, []);

  useEffect(() => {
    const restored = Object.fromEntries(
      serviceDefinitions.map((service) => [
        service.name,
        window.sessionStorage.getItem(serviceSessionKeys[service.name]) === "1",
      ])
    );
    setOpenedServices(restored);
  }, [serviceSessionKeys]);

  const handleServiceOpen = (serviceName: string) => {
    const key = serviceSessionKeys[serviceName];
    if (!key) return;
    window.sessionStorage.setItem(key, "1");
    setOpenedServices((current) => ({ ...current, [serviceName]: true }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Home Server</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shortcuts to local services
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">Ubuntu 24.04.4 LTS</Badge>
            <span>{currentHostname ?? "Resolving host..."}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid gap-6">
          <SystemMetricsCard />

          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
              <CardDescription>Daily maintenance links</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {quickActionDefinitions.map((actionDefinition, index) => {
                const action = quickActions[index];

                return (
                  <div
                    key={actionDefinition.label}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {actionDefinition.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actionDefinition.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      {action ? (
                        <>
                          <CopyButton value={action.url} label="Copy" />
                          <Button asChild size="sm">
                            <a
                              href={action.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Waiting for browser hostname
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Direct links to core dashboards
            </p>
          </div>
          <Badge variant="secondary">{serviceDefinitions.length} tracked</Badge>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceDefinitions.map((serviceDefinition) => {
            const service = servicesByName.get(serviceDefinition.name);

            return (
              <Card key={serviceDefinition.name} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{serviceDefinition.name}</CardTitle>
                    {currentHostname ? (
                      <ServiceStatus
                        url={service?.url ?? ""}
                        pingUrl={service?.pingUrl}
                        requiresFirstOpenApproval={
                          serviceDefinition.requiresFirstOpenApproval === true
                        }
                        hasFirstOpenApproval={
                          openedServices[serviceDefinition.name] === true
                        }
                        restrictWhenOffline={
                          serviceDefinition.restrictWhenOffline === true
                        }
                      />
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted text-muted-foreground"
                      >
                        Resolving
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {serviceDefinition.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {serviceDefinition.category}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {currentHostname && service
                      ? service.url
                      : "Waiting for browser hostname"}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentHostname && service ? (
                      <>
                        <CopyButton value={service.url} label="Copy" />
                        <Button asChild size="sm">
                          <a
                            href={service.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() =>
                              handleServiceOpen(serviceDefinition.name)
                            }
                          >
                            Open
                          </a>
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Waiting for browser hostname
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}

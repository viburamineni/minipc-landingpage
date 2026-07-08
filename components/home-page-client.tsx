"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import {
  ServiceStatus,
  type ServiceStatusState,
} from "@/components/service-status";
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
import {
  buildServiceUrl,
  SERVICE_DEFINITIONS,
  type ServiceId,
} from "@/lib/service-catalog";

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

type ServiceStatusMap = Partial<Record<ServiceId, ServiceStatusState>>;

const quickActionDefinitions: QuickActionDefinition[] = [
  {
    label: "SSH",
    description: "Open a secure shell session",
    username: "administrator",
    port: 22,
  },
];

function buildQuickActions(hostname: string): QuickAction[] {
  return quickActionDefinitions.map((action) => ({
    label: action.label,
    description: action.description,
    url: `ssh://${action.username ?? ""}${
      action.username ? "@" : ""
    }${hostname}:${action.port}`,
  }));
}

function getServiceStatusMessage(status: ServiceStatusState | undefined) {
  if (status === "online") {
    return "Ready from this hostname.";
  }

  if (status === "offline") {
    return "Service reported offline.";
  }

  if (status === "unavailable") {
    return "Status endpoint unavailable from this page.";
  }

  return "Checking same-origin status.";
}

function getServiceStatusTone(status: ServiceStatusState | undefined) {
  if (status === "online") {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (status === "offline") {
    return "text-rose-600 dark:text-rose-400";
  }

  if (status === "unavailable") {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-muted-foreground";
}

export function HomePageClient() {
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatusMap>({});
  const quickActions = useMemo(() => {
    if (!currentHostname) {
      return [];
    }

    return buildQuickActions(currentHostname);
  }, [currentHostname]);
  const serviceLinks = useMemo(() => {
    if (!currentHostname) {
      return new Map();
    }

    return new Map(
      SERVICE_DEFINITIONS.map((service) => [
        service.id,
        buildServiceUrl(currentHostname, service),
      ])
    );
  }, [currentHostname]);
  const preferredService = SERVICE_DEFINITIONS[0];
  const preferredServiceUrl = currentHostname
    ? serviceLinks.get(preferredService.id) ?? null
    : null;
  const sshAction = quickActions[0] ?? null;
  const statusCounts = useMemo(() => {
    return SERVICE_DEFINITIONS.reduce(
      (counts, service) => {
        const status = serviceStatuses[service.id] ?? "checking";
        counts[status] += 1;
        return counts;
      },
      {
        checking: 0,
        online: 0,
        offline: 0,
        unavailable: 0,
      } satisfies Record<ServiceStatusState, number>
    );
  }, [serviceStatuses]);
  const attentionCount = statusCounts.offline + statusCounts.unavailable;
  const summaryLabel =
    statusCounts.checking > 0
      ? "Checking services"
      : attentionCount > 0
      ? `${attentionCount} need attention`
      : "All services reachable";
  const summaryTone =
    statusCounts.checking > 0
      ? "border-muted text-muted-foreground"
      : attentionCount > 0
      ? "border-amber-500/50 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 text-emerald-600 dark:text-emerald-400";
  const handleServiceStatusChange = useCallback(
    (serviceId: ServiceId, status: ServiceStatusState) => {
      setServiceStatuses((currentStatuses) => ({
        ...currentStatuses,
        [serviceId]: status,
      }));
    },
    []
  );

  useEffect(() => {
    setCurrentHostname(window.location.hostname || "localhost");
  }, []);

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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>At a glance</CardTitle>
                    <CardDescription>
                      Host access and service reachability
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={summaryTone}>
                    {summaryLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Online
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {statusCounts.online}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Needs attention
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {attentionCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Checking
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {statusCounts.checking}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Host
                  </p>
                  <p className="mt-2 truncate text-sm font-medium">
                    {currentHostname ?? "Resolving host..."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primary access</CardTitle>
                <CardDescription>
                  Start with Portainer, use SSH for recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {preferredServiceUrl ? (
                    <>
                      <Button asChild size="sm">
                        <a
                          href={preferredServiceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open {preferredService.name}
                        </a>
                      </Button>
                      <CopyButton value={preferredServiceUrl} label="Copy" />
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Waiting for browser hostname
                    </span>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-foreground">
                    Shell access
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {sshAction ? (
                      <>
                        <Button asChild size="sm" variant="secondary">
                          <a
                            href={sshAction.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open SSH
                          </a>
                        </Button>
                        <CopyButton value={sshAction.url} label="Copy SSH" />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Waiting for browser hostname
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <SystemMetricsCard />
        </section>

        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Direct links to core dashboards
            </p>
          </div>
          <Badge variant="secondary">{SERVICE_DEFINITIONS.length} tracked</Badge>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICE_DEFINITIONS.map((service) => {
            const serviceUrl = currentHostname
              ? serviceLinks.get(service.id) ?? ""
              : null;

            return (
              <Card key={service.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{service.name}</CardTitle>
                    <ServiceStatus
                      statusUrl={service.statusEndpoint}
                      onStatusChange={(status) =>
                        handleServiceStatusChange(service.id, status)
                      }
                    />
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {service.category}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {serviceUrl ?? "Waiting for browser hostname"}
                  </div>
                  <div
                    className={`mt-3 text-xs ${getServiceStatusTone(
                      serviceStatuses[service.id]
                    )}`}
                  >
                    {getServiceStatusMessage(serviceStatuses[service.id])}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {serviceUrl ? (
                      <>
                        <CopyButton value={serviceUrl} label="Copy" />
                        <Button asChild size="sm">
                          <a href={serviceUrl} target="_blank" rel="noreferrer">
                            Open {service.name}
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Code2,
  ExternalLink,
  Gamepad2,
  Globe2,
  Server,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import {
  ServiceStatus,
  type ServiceStatusState,
} from "@/components/service-status";
import { SystemMetricsCard } from "@/components/system-metrics";
import { ThemeControl } from "@/components/theme-control";
import { Button } from "@/components/ui/button";
import {
  buildServiceUrl,
  SERVICE_DEFINITIONS,
  type ServiceId,
} from "@/lib/service-catalog";

type ServiceStatusMap = Partial<Record<ServiceId, ServiceStatusState>>;

const SERVICE_ICONS: Record<ServiceId, LucideIcon> = {
  portainer: Boxes,
  pterodactyl: Gamepad2,
  pihole: ShieldCheck,
  "code-server": Code2,
};

function getServiceStatusMessage(status: ServiceStatusState | undefined) {
  if (status === "online") return "Ready to open";
  if (status === "offline") return "Service reported offline";
  if (status === "unavailable") return "Health check unavailable";
  return "Checking health";
}

function getSummaryCopy(counts: Record<ServiceStatusState, number>) {
  const attentionCount = counts.offline + counts.unavailable;

  if (counts.checking > 0) {
    return {
      label: "Checking services",
      detail: `${counts.checking} remaining`,
      tone: "bg-sky-500",
    };
  }

  if (attentionCount > 0) {
    return {
      label: `${attentionCount} need attention`,
      detail: `${counts.online} online`,
      tone: "bg-amber-500",
    };
  }

  return {
    label: "All services online",
    detail: `${counts.online} reachable`,
    tone: "bg-emerald-500",
  };
}

export function HomePageClient() {
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatusMap>({});

  const serviceLinks = useMemo(() => {
    if (!currentHostname) return new Map<ServiceId, string>();

    return new Map(
      SERVICE_DEFINITIONS.map((service) => [
        service.id,
        buildServiceUrl(currentHostname, service),
      ])
    );
  }, [currentHostname]);

  const statusCounts = useMemo(() => {
    return SERVICE_DEFINITIONS.reduce(
      (counts, service) => {
        counts[serviceStatuses[service.id] ?? "checking"] += 1;
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

  const summary = getSummaryCopy(statusCounts);

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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Server aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">mini.pc</h1>
              <p className="text-sm text-muted-foreground">Home server control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-5 text-sm sm:flex">
              <div className="text-right">
                <p className="font-medium text-foreground">
                  {currentHostname ?? "Resolving host"}
                </p>
                <p className="text-xs text-muted-foreground">Ubuntu 24.04.4 LTS</p>
              </div>
              <span className="h-8 w-px bg-border" aria-hidden="true" />
              <Globe2 aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <ThemeControl />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <section
          aria-labelledby="services-heading"
        >
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="font-utility text-xs uppercase text-muted-foreground">
                  Service workspace
                </p>
                <h2 id="services-heading" className="mt-1 text-2xl font-semibold">
                  Services
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {SERVICE_DEFINITIONS.length} local dashboards on{" "}
                  <span className="font-utility text-foreground">
                    {currentHostname ?? "this host"}
                  </span>
                </p>
              </div>

              <div
                className="status-rail flex items-center gap-3 pl-4"
                role="status"
                aria-live="polite"
              >
                <span
                  className={`size-2.5 rounded-full transition-colors duration-300 ${summary.tone}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold">{summary.label}</p>
                  <p className="text-xs text-muted-foreground">{summary.detail}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {SERVICE_DEFINITIONS.map((service) => {
                const serviceUrl = serviceLinks.get(service.id) ?? null;
                const status = serviceStatuses[service.id];
                const ServiceIcon = SERVICE_ICONS[service.id];

                return (
                  <article
                    key={service.id}
                    className="group flex min-h-56 flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md dark:hover:border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                        <ServiceIcon
                          aria-hidden="true"
                          className="size-[18px]"
                          strokeWidth={1.8}
                        />
                      </div>
                      <ServiceStatus
                        statusUrl={service.statusEndpoint}
                        onStatusChange={(nextStatus) =>
                          handleServiceStatusChange(service.id, nextStatus)
                        }
                      />
                    </div>

                    <div className="mt-5 flex-1">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      <p className="font-utility mt-4 truncate text-xs text-muted-foreground">
                        {serviceUrl ?? "Resolving destination"}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                      <span className="text-xs text-muted-foreground">
                        {getServiceStatusMessage(status)}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        {serviceUrl ? (
                          <>
                            <CopyButton
                              value={serviceUrl}
                              label={`${service.name} URL`}
                            />
                            <Button asChild size="sm">
                              <a
                                href={serviceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open
                                <ExternalLink
                                  aria-hidden="true"
                                  className="ml-1.5 size-3.5"
                                />
                                <span className="sr-only"> {service.name}</span>
                              </a>
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Resolving
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

        </section>

        <SystemMetricsCard />
      </main>
    </div>
  );
}

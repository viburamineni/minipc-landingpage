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
import { buildServiceUrl, SERVICE_DEFINITIONS } from "@/lib/service-catalog";

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

export function HomePageClient() {
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);
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
                  <div className="flex items-center justify-between">
                    <CardTitle>{service.name}</CardTitle>
                    <ServiceStatus statusUrl={service.statusEndpoint} />
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
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {serviceUrl ? (
                      <>
                        <CopyButton value={serviceUrl} label="Copy" />
                        <Button asChild size="sm">
                          <a href={serviceUrl} target="_blank" rel="noreferrer">
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

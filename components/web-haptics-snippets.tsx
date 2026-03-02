"use client";

import * as React from "react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SnippetOption = {
  label: string;
  value: string;
};

type SnippetTabsCardProps = {
  title: string;
  options: SnippetOption[];
};

function SnippetTabsCard({ title, options }: SnippetTabsCardProps) {
  const [activeLabel, setActiveLabel] = React.useState(options[0]?.label ?? "");

  const activeSnippet =
    options.find((option) => option.label === activeLabel) ?? options[0];

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <CopyButton value={activeSnippet.value} label="Copy" />
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={`${title} snippet options`}
        >
          {options.map((option) => {
            const isActive = option.label === activeSnippet.label;
            return (
              <Button
                key={option.label}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => setActiveLabel(option.label)}
                role="tab"
                aria-selected={isActive}
                className={cn("min-w-16")}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
          <code>{activeSnippet.value}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

const installOptions: SnippetOption[] = [
  { label: "npm", value: "npm i web-haptics" },
  { label: "pnpm", value: "pnpm add web-haptics" },
  { label: "yarn", value: "yarn add web-haptics" },
  { label: "bun", value: "bun add web-haptics" },
];

const usageOptions: SnippetOption[] = [
  {
    label: "React",
    value: `import { useWebHaptics } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger(); // medium impact
haptics.trigger(defaultPatterns.success);`,
  },
  {
    label: "TypeScript",
    value: `import { WebHaptics, defaultPatterns } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger();
haptics.trigger(defaultPatterns.success);`,
  },
  {
    label: "Vue",
    value: `import { WebHaptics, defaultPatterns } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger(defaultPatterns.success);`,
  },
  {
    label: "Svelte",
    value: `import { WebHaptics, defaultPatterns } from "web-haptics";

const haptics = new WebHaptics();
haptics.trigger(defaultPatterns.success);`,
  },
];

export function WebHapticsSnippets() {
  return (
    <section className="grid gap-6">
      <SnippetTabsCard title="Install" options={installOptions} />
      <SnippetTabsCard title="Usage" options={usageOptions} />
    </section>
  );
}

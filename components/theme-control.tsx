"use client";

import * as React from "react";
import { Monitor, Moon, Settings2, Sun, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "mini-pc-theme";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "system", label: "Auto", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function getResolvedTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = getResolvedTheme(preference);
  const root = document.documentElement;
  const favicon = document.querySelector<HTMLLinkElement>("#theme-favicon");

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;

  if (favicon) {
    favicon.href = `/icon-${resolvedTheme}.svg`;
  }
}

export function ThemeControl() {
  const [preference, setPreference] = React.useState<ThemePreference>("system");
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let initialPreference: ThemePreference = "system";

    try {
      const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemePreference(storedPreference)) {
        initialPreference = storedPreference;
      }
    } catch {
      // Auto remains the default when storage is unavailable.
    }

    setPreference(initialPreference);
    applyTheme(initialPreference);
    setIsReady(true);
  }, []);

  React.useEffect(() => {
    if (!isReady) return;

    applyTheme(preference);

    if (preference !== "system") return;

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme("system");
    systemTheme.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleSystemThemeChange);
    };
  }, [isReady, preference]);

  const selectTheme = (
    nextPreference: ThemePreference,
    detailsElement: HTMLDetailsElement | null
  ) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // The preference still applies for this visit when storage is unavailable.
    }
    setPreference(nextPreference);
    detailsElement?.removeAttribute("open");
  };

  return (
    <details className="group relative">
      <summary
        className="grid size-9 cursor-pointer list-none place-items-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden"
        aria-label="Appearance settings"
        title="Appearance settings"
      >
        <Settings2 aria-hidden="true" className="size-4" />
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <div className="px-1 pb-3">
          <p className="text-sm font-semibold">Appearance</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Auto follows this device.
          </p>
        </div>

        <div
          className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1"
          role="radiogroup"
          aria-label="Color theme"
        >
          {THEME_OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = preference === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={(event) =>
                  selectTheme(
                    option.value,
                    event.currentTarget.closest("details")
                  )
                }
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                <OptionIcon aria-hidden="true" className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </details>
  );
}

"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "mini-pc-theme";

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Auto",
  light: "Light",
  dark: "Dark",
};

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

  return resolvedTheme;
}

function saveThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The preference still applies for this visit when storage is unavailable.
  }
}

function runThemeTransition(
  commitTheme: () => void,
  onFinish: () => void
) {
  const root = document.documentElement;

  root.classList.add("theme-transitioning");
  void root.offsetWidth;
  commitTheme();

  window.setTimeout(() => {
    root.classList.remove("theme-transitioning");
    onFinish();
  }, 590);
}

export function ThemeControl() {
  const [preference, setPreference] = React.useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light");
  const [isReady, setIsReady] = React.useState(false);
  const transitionLockRef = React.useRef(false);

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
    setResolvedTheme(applyTheme(initialPreference));
    setIsReady(true);
  }, []);

  React.useEffect(() => {
    if (!isReady || preference !== "system") return;

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      setResolvedTheme(applyTheme("system"));
    };
    systemTheme.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleSystemThemeChange);
    };
  }, [isReady, preference]);

  const cycleTheme = () => {
    if (transitionLockRef.current) return;

    const nextPreference = NEXT_THEME[preference];
    const nextResolvedTheme = getResolvedTheme(nextPreference);
    const shouldAnimateTheme =
      resolvedTheme !== nextResolvedTheme &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const commitTheme = () => {
      saveThemePreference(nextPreference);
      const resolved = applyTheme(nextPreference);
      flushSync(() => {
        setPreference(nextPreference);
        setResolvedTheme(resolved);
      });
    };

    if (!shouldAnimateTheme) {
      commitTheme();
      return;
    }

    transitionLockRef.current = true;

    runThemeTransition(commitTheme, () => {
      transitionLockRef.current = false;
    });
  };

  const nextPreference = NEXT_THEME[preference];
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="grid size-9 place-items-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-[color,background-color,border-color,transform] hover:scale-105 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95"
      aria-label={`${THEME_LABELS[preference]} appearance. Switch to ${THEME_LABELS[nextPreference]}.`}
      title={`${THEME_LABELS[preference]} appearance - switch to ${THEME_LABELS[nextPreference]}`}
    >
      <span
        key={`${preference}-${resolvedTheme}`}
        className="relative grid size-5 animate-in place-items-center fade-in zoom-in-75 duration-300 motion-reduce:animate-none"
      >
        <CurrentIcon aria-hidden="true" className="size-4" />
        {preference === "system" ? (
          <span
            className="font-utility absolute -bottom-1 -right-1 grid size-3 place-items-center rounded-full border border-current bg-background text-[7px] font-bold leading-none text-foreground"
            aria-hidden="true"
          >
            A
          </span>
        ) : null}
      </span>
    </button>
  );
}

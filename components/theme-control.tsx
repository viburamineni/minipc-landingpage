"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "mini-pc-theme";
const THEME_TRANSITION_DURATION_MS = 560;
const SNAPSHOT_STYLE_PROPERTIES = [
  "accent-color",
  "backdrop-filter",
  "background-color",
  "background-image",
  "border-bottom-color",
  "border-left-color",
  "border-right-color",
  "border-top-color",
  "box-shadow",
  "color",
  "fill",
  "filter",
  "mix-blend-mode",
  "opacity",
  "outline-color",
  "stroke",
  "text-decoration-color",
  "text-shadow",
  "-webkit-backdrop-filter",
  "-webkit-text-fill-color",
  "-webkit-text-stroke-color",
] as const;

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

function getFaviconHref(theme: ResolvedTheme) {
  const appVersion = document.documentElement.dataset.appVersion;
  const versionQuery = appVersion
    ? `?v=${encodeURIComponent(appVersion)}`
    : "";

  return `/icon-${theme}.svg${versionQuery}`;
}

function updateFavicon(theme: ResolvedTheme) {
  const current = document.querySelector<HTMLLinkElement>("#theme-favicon");

  if (current?.dataset.theme === theme) return;

  const favicon = document.createElement("link");
  favicon.id = "theme-favicon";
  favicon.rel = "icon";
  favicon.type = "image/svg+xml";
  favicon.dataset.theme = theme;
  favicon.href = getFaviconHref(theme);

  if (current) {
    current.replaceWith(favicon);
    return;
  }

  document.head.appendChild(favicon);
}

function applyTheme(preference: ThemePreference, syncFavicon = true) {
  const resolvedTheme = getResolvedTheme(preference);
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;

  if (syncFavicon) updateFavicon(resolvedTheme);

  return resolvedTheme;
}

function saveThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The preference still applies for this visit when storage is unavailable.
  }
}

function waitForFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function setSnapshotCircle(
  snapshot: HTMLElement,
  snapshotContent: HTMLElement,
  originX: number,
  originY: number,
  radius: number
) {
  const diameter = radius * 2;
  const left = originX - radius;
  const top = originY - radius;

  snapshot.style.left = `${left}px`;
  snapshot.style.top = `${top}px`;
  snapshot.style.width = `${diameter}px`;
  snapshot.style.height = `${diameter}px`;
  snapshotContent.style.left = `${-window.scrollX - left}px`;
  snapshotContent.style.top = `${-window.scrollY - top}px`;
}

function copyComputedStyles(source: Element, target: HTMLElement | SVGElement) {
  const computedStyles = window.getComputedStyle(source);

  SNAPSHOT_STYLE_PROPERTIES.forEach((property) => {
    target.style.setProperty(property, computedStyles.getPropertyValue(property));
  });

  target.style.setProperty("animation", "none", "important");
  target.style.setProperty("caret-color", "transparent", "important");
  target.style.setProperty("transition", "none", "important");
}

function createThemeSnapshot() {
  const sourceBody = document.body;
  const clonedBody = sourceBody.cloneNode(true) as HTMLElement;
  const sourceElements = Array.from(sourceBody.querySelectorAll("*"));
  const clonedElements = Array.from(clonedBody.querySelectorAll("*"));
  const snapshot = document.createElement("div");
  const snapshotContent = document.createElement("div");

  // Freeze target-theme colors in ordinary DOM so only the circular viewport moves.
  copyComputedStyles(sourceBody, snapshotContent);

  sourceElements.forEach((source, index) => {
    const clone = clonedElements[index];

    if (clone instanceof HTMLElement || clone instanceof SVGElement) {
      copyComputedStyles(source, clone);
    }
  });

  clonedBody
    .querySelectorAll(
      "script, noscript, .theme-snapshot-layer, .theme-icon-morph"
    )
    .forEach((element) => element.remove());
  clonedBody.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });

  while (clonedBody.firstChild) {
    snapshotContent.appendChild(clonedBody.firstChild);
  }

  snapshot.className = "theme-snapshot-layer";
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.inert = true;
  snapshot.style.backgroundColor = window.getComputedStyle(sourceBody).backgroundColor;

  snapshotContent.style.position = "absolute";
  snapshotContent.style.width = `${document.documentElement.scrollWidth}px`;
  snapshotContent.style.minHeight = `${document.documentElement.scrollHeight}px`;

  snapshot.appendChild(snapshotContent);
  document.body.appendChild(snapshot);

  return { snapshot, snapshotContent };
}

function animateSnapshotReveal(
  snapshot: HTMLElement,
  snapshotContent: HTMLElement,
  originX: number,
  originY: number,
  endRadius: number
) {
  return new Promise<void>((resolve) => {
    const startedAt = window.performance.now();

    const drawFrame = (now: number) => {
      const progress = Math.min(
        (now - startedAt) / THEME_TRANSITION_DURATION_MS,
        1
      );
      const easedProgress = 1 - Math.pow(1 - progress, 4);

      setSnapshotCircle(
        snapshot,
        snapshotContent,
        originX,
        originY,
        (endRadius + 2) * easedProgress
      );

      if (progress < 1) {
        window.requestAnimationFrame(drawFrame);
        return;
      }

      resolve();
    };

    window.requestAnimationFrame(drawFrame);
  });
}

async function runThemeTransition(
  button: HTMLButtonElement,
  renderTargetTheme: () => void,
  restoreCurrentTheme: () => void,
  commitTargetTheme: () => void,
  startIconMorph: () => void,
  onFinish: () => void
) {
  const { left, top, width, height } = button.getBoundingClientRect();
  const originX = left + width / 2;
  const originY = top + height / 2;
  const endRadius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );
  let snapshot: HTMLElement | null = null;
  const root = document.documentElement;
  const icon = button.querySelector<HTMLElement>(".theme-icon-morph");
  const iconRect = icon?.getBoundingClientRect();

  try {
    if (iconRect) {
      root.style.setProperty("--theme-icon-left", `${iconRect.left}px`);
      root.style.setProperty("--theme-icon-top", `${iconRect.top}px`);
      root.classList.add("theme-icon-morphing");
    }

    root.classList.add("theme-commit-frozen");
    renderTargetTheme();

    if (icon) {
      root.style.setProperty(
        "--theme-icon-target-color",
        window.getComputedStyle(icon).color
      );
    }

    const capturedTheme = createThemeSnapshot();
    snapshot = capturedTheme.snapshot;

    restoreCurrentTheme();
    void icon?.offsetWidth;

    setSnapshotCircle(
      snapshot,
      capturedTheme.snapshotContent,
      originX,
      originY,
      0
    );
    snapshot.style.visibility = "visible";
    startIconMorph();

    await waitForFrame();
    await animateSnapshotReveal(
      snapshot,
      capturedTheme.snapshotContent,
      originX,
      originY,
      endRadius
    );

    commitTargetTheme();
    await waitForFrame();
  } catch {
    commitTargetTheme();
  } finally {
    snapshot?.remove();
    root.classList.remove("theme-commit-frozen");
    root.classList.remove("theme-icon-morphing");
    root.style.removeProperty("--theme-icon-left");
    root.style.removeProperty("--theme-icon-top");
    root.style.removeProperty("--theme-icon-target-color");
    onFinish();
  }
}

export function ThemeControl() {
  const [preference, setPreference] = React.useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light");
  const [iconTheme, setIconTheme] = React.useState<ResolvedTheme>("light");
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

    const initialResolvedTheme = applyTheme(initialPreference);

    setPreference(initialPreference);
    setResolvedTheme(initialResolvedTheme);
    setIconTheme(initialResolvedTheme);
    setIsReady(true);
  }, []);

  React.useEffect(() => {
    if (!isReady || preference !== "system") return;

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const resolved = applyTheme("system");
      setResolvedTheme(resolved);
      setIconTheme(resolved);
    };
    systemTheme.addEventListener("change", handleSystemThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleSystemThemeChange);
    };
  }, [isReady, preference]);

  const cycleTheme = (button: HTMLButtonElement) => {
    if (transitionLockRef.current) return;

    const nextPreference = NEXT_THEME[preference];
    const nextResolvedTheme = getResolvedTheme(nextPreference);
    const shouldAnimateTheme =
      resolvedTheme !== nextResolvedTheme &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderTheme = (themePreference: ThemePreference) => {
      const resolved = applyTheme(themePreference, false);
      flushSync(() => {
        setPreference(themePreference);
        setResolvedTheme(resolved);
      });
    };
    const commitTheme = () => renderTheme(nextPreference);

    saveThemePreference(nextPreference);
    updateFavicon(nextResolvedTheme);

    if (!shouldAnimateTheme) {
      commitTheme();
      setIconTheme(nextResolvedTheme);
      return;
    }

    transitionLockRef.current = true;

    runThemeTransition(
      button,
      () => renderTheme(nextPreference),
      () => renderTheme(preference),
      commitTheme,
      () => {
        flushSync(() => setIconTheme(nextResolvedTheme));
      },
      () => {
        transitionLockRef.current = false;
      }
    );
  };

  const nextPreference = NEXT_THEME[preference];

  return (
    <button
      type="button"
      onClick={(event) => cycleTheme(event.currentTarget)}
      className="theme-control-button grid size-9 place-items-center rounded-md border border-input bg-background text-muted-foreground shadow-sm transition-[color,background-color,border-color] hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:opacity-80"
      aria-label={`${THEME_LABELS[preference]} appearance. Switch to ${THEME_LABELS[nextPreference]}.`}
      title={`${THEME_LABELS[preference]} appearance - switch to ${THEME_LABELS[nextPreference]}`}
    >
      <span
        className="theme-icon-morph relative grid size-5 place-items-center"
        data-icon-theme={isReady ? iconTheme : undefined}
        suppressHydrationWarning
      >
        <Sun aria-hidden="true" className="theme-icon-sun absolute size-4" />
        <Moon aria-hidden="true" className="theme-icon-moon absolute size-4" />
        {preference === "system" ? (
          <span
            className="theme-auto-badge font-utility absolute -bottom-1 -right-1 grid size-3 animate-in place-items-center rounded-full border border-current bg-background text-[7px] font-bold leading-none text-foreground fade-in zoom-in-75 duration-200 motion-reduce:animate-none"
            aria-hidden="true"
          >
            A
          </span>
        ) : null}
      </span>
    </button>
  );
}

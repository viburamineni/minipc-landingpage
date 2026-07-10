"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type ThemeDocument = Document & {
  startViewTransition?: (update: () => void) => ThemeViewTransition;
};

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

function runThemeWave(
  button: HTMLButtonElement,
  nextResolvedTheme: ResolvedTheme,
  commitTheme: () => void,
  onFinish: () => void
) {
  const { left, top, width, height } = button.getBoundingClientRect();
  const originX = left + width / 2;
  const originY = top + height / 2;
  const endRadius = Math.hypot(
    Math.max(originX, window.innerWidth - originX),
    Math.max(originY, window.innerHeight - originY)
  );
  const wave = document.createElement("span");
  const targetColor =
    nextResolvedTheme === "dark" ? "hsl(220 23% 10%)" : "hsl(210 25% 98%)";
  let didCommit = false;

  wave.setAttribute("aria-hidden", "true");
  Object.assign(wave.style, {
    position: "fixed",
    left: `${originX}px`,
    top: `${originY}px`,
    width: `${endRadius * 2}px`,
    height: `${endRadius * 2}px`,
    borderRadius: "9999px",
    background: targetColor,
    pointerEvents: "none",
    transform: "translate(-50%, -50%) scale(0)",
    transformOrigin: "center",
    transition:
      "transform 560ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out",
    zIndex: "2147483646",
  });
  document.body.appendChild(wave);

  const commitOnce = () => {
    if (didCommit) return;
    didCommit = true;
    commitTheme();
  };
  const commitTimer = window.setTimeout(commitOnce, 500);

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      wave.style.transform = "translate(-50%, -50%) scale(1)";
    });
  });

  window.setTimeout(() => {
    window.clearTimeout(commitTimer);
    commitOnce();
    wave.style.opacity = "0";

    window.setTimeout(() => {
      wave.remove();
      onFinish();
    }, 170);
  }, 570);
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

  const cycleTheme = (button: HTMLButtonElement) => {
    if (transitionLockRef.current) return;

    const nextPreference = NEXT_THEME[preference];
    const nextResolvedTheme = getResolvedTheme(nextPreference);
    const shouldAnimateTheme =
      resolvedTheme !== nextResolvedTheme &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startViewTransition = (document as ThemeDocument).startViewTransition;

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

    if (!startViewTransition) {
      runThemeWave(button, nextResolvedTheme, commitTheme, () => {
        transitionLockRef.current = false;
      });
      return;
    }

    const { left, top, width, height } = button.getBoundingClientRect();
    const originX = left + width / 2;
    const originY = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );
    const transition = startViewTransition.call(document, commitTheme);

    void transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${endRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        } as KeyframeAnimationOptions & { pseudoElement: string }
      );
    });
    void transition.finished.finally(() => {
      transitionLockRef.current = false;
    });
  };

  const nextPreference = NEXT_THEME[preference];
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={(event) => cycleTheme(event.currentTarget)}
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

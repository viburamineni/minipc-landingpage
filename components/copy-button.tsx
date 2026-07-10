"use client";

import * as React from "react";
import { Check, Copy, X } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  variant?: ButtonProps["variant"];
};

export function CopyButton({
  value,
  label = "address",
  className,
  variant = "outline",
}: CopyButtonProps) {
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "error">(
    "idle"
  );
  const resetTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const showCopyState = (state: "copied" | "error") => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    setCopyState(state);
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      resetTimerRef.current = null;
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showCopyState("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const didCopy = document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopyState(didCopy ? "copied" : "error");
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={variant}
      onClick={handleCopy}
      className={cn(
        "size-8 shrink-0 transition-[color,background-color,border-color,opacity] duration-300 active:opacity-70",
        copyState === "copied" &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
        copyState === "error" &&
          "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950/70",
        className
      )}
      data-copy-state={copyState}
      aria-label={
        copyState === "copied"
          ? `${label} copied`
          : copyState === "error"
          ? `Could not copy ${label}`
          : `Copy ${label}`
      }
      title={
        copyState === "copied"
          ? "Copied"
          : copyState === "error"
          ? "Copy failed"
          : `Copy ${label}`
      }
    >
      <span className="copy-icon-morph relative grid size-3.5 place-items-center" aria-hidden="true">
        <Copy className="copy-icon-idle absolute size-3.5" />
        <Check className="copy-icon-success absolute size-3.5" />
        <X className="copy-icon-error absolute size-3.5" />
      </span>
      <span className="sr-only" aria-live="polite">
        {copyState === "copied"
          ? "Copied"
          : copyState === "error"
          ? "Copy failed"
          : ""}
      </span>
    </Button>
  );
}

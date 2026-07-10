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

  const resetCopyState = () => {
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
      resetCopyState();
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
      setCopyState(didCopy ? "copied" : "error");
      resetCopyState();
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant={variant}
      onClick={handleCopy}
      className={cn("size-8 shrink-0", className)}
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
      {copyState === "copied" ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : copyState === "error" ? (
        <X aria-hidden="true" className="size-3.5" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
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

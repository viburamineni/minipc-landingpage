"use client"

import * as React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CopyButtonProps = {
  value: string
  label?: string
  className?: string
  variant?: ButtonProps["variant"]
  size?: ButtonProps["size"]
}

export function CopyButton({
  value,
  label = "Copy",
  className,
  variant = "outline",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const copyWithExecCommand = () => {
    const textarea = document.createElement("textarea")
    textarea.value = value
    textarea.setAttribute("readonly", "true")
    textarea.style.position = "absolute"
    textarea.style.left = "-9999px"
    document.body.appendChild(textarea)
    textarea.select()

    const didCopy = document.execCommand("copy")
    document.body.removeChild(textarea)

    return didCopy
  }

  const handleCopy = () => {
    try {
      const didCopy = copyWithExecCommand()
      if (didCopy) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
        return
      }

      if (navigator?.clipboard?.writeText) {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          })
          .catch(() => setCopied(false))
      } else {
        setCopied(false)
      }
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={cn("shrink-0", className)}
      aria-label={`Copy ${label.toLowerCase()}`}
    >
      {copied ? "Copied" : label}
    </Button>
  )
}

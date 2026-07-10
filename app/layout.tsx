import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import packageJson from "../package.json"

export const metadata: Metadata = {
  title: "mini.pc | Home server control",
  description: "Local services and system health for mini.pc."
}

const APP_VERSION = packageJson.version

const themeBootstrapScript = `
  (function () {
    try {
      var stored = localStorage.getItem("mini-pc-theme");
      var preference = stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
      var resolved = preference === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : preference;
      var root = document.documentElement;
      root.classList.toggle("dark", resolved === "dark");
      root.dataset.themePreference = preference;
      root.style.colorScheme = resolved;
      window.addEventListener("DOMContentLoaded", function () {
        var favicon = document.getElementById("theme-favicon");
        if (favicon) favicon.href = "/icon-" + resolved + ".svg";
      }, { once: true });
    } catch (_) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" data-app-version={APP_VERSION} suppressHydrationWarning>
      <head>
        <link id="theme-favicon" rel="icon" type="image/svg+xml" href="/icon-light.svg" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import packageJson from "../package.json"

export const metadata: Metadata = {
  title: "mini.pc | Home server control",
  description: "Local services and system health for mini.pc."
}

const APP_VERSION = packageJson.version
const FAVICON_VERSION_QUERY = `?v=${encodeURIComponent(APP_VERSION)}`

const themeBootstrapScript = `
  (function () {
    var preference = "system";
    try {
      var stored = localStorage.getItem("mini-pc-theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        preference = stored;
      }
    } catch (_) {}

    var resolved = preference === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    var root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;

    var favicon = document.createElement("link");
    favicon.id = "theme-favicon";
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.dataset.theme = resolved;
    favicon.href = "/icon-" + resolved + ".svg?v=" + encodeURIComponent(${JSON.stringify(APP_VERSION)});
    document.head.appendChild(favicon);
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
        <link
          rel="preload"
          href={`/icon-light.svg${FAVICON_VERSION_QUERY}`}
          as="image"
          type="image/svg+xml"
        />
        <link
          rel="preload"
          href={`/icon-dark.svg${FAVICON_VERSION_QUERY}`}
          as="image"
          type="image/svg+xml"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <noscript>
          <link rel="icon" type="image/svg+xml" href="/icon-light.svg" />
        </noscript>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

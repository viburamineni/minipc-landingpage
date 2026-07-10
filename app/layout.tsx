import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"
import packageJson from "../package.json"

export const metadata: Metadata = {
  title: "mini.pc | Home server control",
  description: "Local services and system health for mini.pc."
}

const APP_VERSION = packageJson.version

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" data-app-version={APP_VERSION}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

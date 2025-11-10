import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Atlas – Train Smarter", template: "%s · Atlas" },
  description:
    "Atlas helps you plan, log, and analyze your training so you can progress with clarity.",
  applicationName: "Atlas",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Atlas – Train Smarter",
    description:
      "Plan, log, and analyze your training. Measure progress. Stay consistent.",
    type: "website",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://atlas.local"
  ),
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
    { color: "#ffffff" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ClerkProvider>
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/.10)_0%,transparent_60%)]" />
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]">
              <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:28px_28px]" />
            </div>
            <div className="absolute right-[-20%] bottom-[-20%] h-[60vmin] w-[60vmin] rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--primary)/.12),transparent_60%)] blur-3xl motion-safe:animate-none" />
          </div>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded-md bg-primary px-3 py-1 text-primary-foreground shadow"
          >
            Skip to content
          </a>
          <ThemeProvider>
            <QueryProvider>
              <div className="min-h-dvh flex flex-col">
                <AppHeader />
                <main
                  id="main"
                  className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1"
                >
                  {children}
                </main>
                <footer className="border-t bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border">
                          <svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 3v18M3 12h18"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <span>© {year} Atlas</span>
                        <span className="hidden sm:inline select-none">•</span>
                        <span className="text-xs">
                          Train smarter. Stay consistent.
                        </span>
                      </div>
                      <nav
                        aria-label="Footer"
                        className="flex flex-wrap items-center gap-3 text-sm"
                      >
                        <Link
                          className="hover:text-foreground transition"
                          href="/dashboard"
                        >
                          Dashboard
                        </Link>
                        <Link
                          className="hover:text-foreground transition"
                          href="/log"
                        >
                          Log
                        </Link>
                        <Link
                          className="hover:text-foreground transition"
                          href="/exercises"
                        >
                          Exercises
                        </Link>
                        <span className="hidden sm:inline select-none">•</span>
                        <div className="flex items-center gap-3">
                          <a
                            href="https://x.com/"
                            aria-label="X"
                            className="text-muted-foreground hover:text-foreground transition"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              aria-hidden="true"
                            >
                              <path
                                fill="currentColor"
                                d="M18.9 3H22l-7.7 8.8L22.7 21H16l-5-6-5.7 6H2l8.4-9.3L1.6 3H8l4.5 5.4L18.9 3z"
                              />
                            </svg>
                          </a>
                          <a
                            href="https://github.com/"
                            aria-label="GitHub"
                            className="text-muted-foreground hover:text-foreground transition"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              aria-hidden="true"
                            >
                              <path
                                fill="currentColor"
                                d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.6-4.1-1.6-.6-1.5-1.5-2-1.5-2-1.2-.8.1-.8.1-.8 1.3.1 2 .  1.4 2 .  1.4 1.2 2 3 .8 3.7.6.1-.9.5-1.5.9-1.8-2.7-.3-5.6-1.3-5.6-6a4.6 4.6 0 0 1 1.2-3.2 4.2 4.2 0 0 1 .1-3.1s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.5 4.3 18.5 4.6 18.5 4.6a4.2 4.2 0 0 1 .1 3.1 4.6 4.6 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4 1 1.3 1 2.6v3.8c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"
                              />
                            </svg>
                          </a>
                        </div>
                      </nav>
                    </div>
                  </div>
                </footer>
              </div>
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

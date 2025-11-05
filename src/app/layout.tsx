import "./globals.css";
import type { Metadata, Viewport } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/AppHeader";
import { DevAuthBar } from "@/components/DevAuthBar";

export const metadata: Metadata = {
  title: {
    default: "Atlas – Train Smarter",
    template: "%s · Atlas",
  },
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
  metadataBase: new URL("https://atlas.local"),
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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/.12)_0%,transparent_60%)]" />
          <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
            <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:32px_32px]" />
          </div>
        </div>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded-md bg-primary px-3 py-1 text-primary-foreground shadow"
        >
          Skip to content
        </a>
        <ClerkProvider>
          <ThemeProvider>
            <QueryProvider>
              <div className="min-h-dvh flex flex-col">
                <DevAuthBar />
                <AppHeader />
                <main
                  id="main"
                  className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex-1"
                >
                  {children}
                </main>
                <footer className="border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
                  <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-muted-foreground flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-between">
                    <span>© {new Date().getFullYear()} Atlas</span>
                    <nav className="flex items-center gap-4">
                      <a
                        className="hover:text-foreground transition"
                        href="/dashboard"
                      >
                        Dashboard
                      </a>
                      <a
                        className="hover:text-foreground transition"
                        href="/log"
                      >
                        Log
                      </a>
                      <a
                        className="hover:text-foreground transition"
                        href="/exercises"
                      >
                        Exercises
                      </a>
                    </nav>
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

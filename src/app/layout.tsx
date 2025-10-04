import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/ui/theme/ThemeProvider";
import { QueryProvider } from "@/ui/providers/QueryProvider";
import { ThemeToggle } from "@/ui/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Training Progress",
  description: "Track your training progress over time",
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0b0f14" }, { color: "#ffffff" }],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded-md bg-primary px-3 py-1 text-primary-foreground shadow">Skip to content</a>
        <ThemeProvider>
          <QueryProvider>
            <div className="min-h-dvh flex flex-col">
              <header className="sticky top-0 border-b bg-background/80 backdrop-blur flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-semibold">Training Progress</h1>
                <ThemeToggle />
              </header>
              <main id="main" className="container mx-auto max-w-6xl px-4 py-6 flex-1">{children}</main>
              <footer className="border-t bg-background/60">
                <div className="container mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground flex items-center justify-between">
                  <span>© {new Date().getFullYear()} Training Progress</span>
                  <span className="hidden sm:inline">Built with Next.js · shadcn/ui · Drizzle · React Query</span>
                </div>
              </footer>
            </div>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

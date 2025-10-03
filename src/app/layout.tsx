import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/ui/theme/ThemeProvider";
import { QueryProvider } from "@/ui/providers/QueryProvider";
import { ThemeToggle } from "@/ui/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Training Progress",
  description: "Track your training progress over time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <div className="min-h-dvh">
              <header className="sticky top-0 border-b bg-background/80 backdrop-blur flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-semibold">Training Progress</h1>
                <ThemeToggle />
              </header>
              <main className="container mx-auto p-4">{children}</main>
            </div>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

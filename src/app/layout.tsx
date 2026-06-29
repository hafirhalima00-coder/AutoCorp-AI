import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcutsProvider } from "@/components/layout/keyboard-shortcuts-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoCorp AI - Autonomous Company Simulator",
  description: "An autonomous company simulator where multiple AI agents cooperate to run an entire business under human supervision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg">
          Skip to main content
        </a>
        <ThemeProvider>
          <TooltipProvider>
            <KeyboardShortcutsProvider>
              <div className="flex h-full">
                <Sidebar />
              <div className="flex flex-1 flex-col sm:pl-64">
                <Header />
                <main id="main-content" className="flex-1 p-4 sm:p-6 pt-16 sm:pt-6" role="main">
                    {children}
                  </main>
                </div>
              </div>
              <CommandPalette />
              <Toaster />
            </KeyboardShortcutsProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

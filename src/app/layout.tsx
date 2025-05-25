
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
// Direct imports for providers
import { SidebarProvider } from "@/components/ui/sidebar"; // Changed back to direct import
import { TooltipProvider } from "@/components/ui/tooltip"; // Changed back to direct import
import { ChakraProvider } from "@chakra-ui/react";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BrewBooks MVP",
  description: "Coffee shop management made simple",
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
        <ChakraProvider>
          <SidebarProvider defaultOpen> {/* SidebarProvider now directly from ui/sidebar */}
            <TooltipProvider> {/* TooltipProvider directly from ui/tooltip */}
              <AppShell>{children}</AppShell>
              <Toaster />
            </TooltipProvider>
          </SidebarProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}

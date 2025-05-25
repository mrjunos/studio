
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
// Direct imports for providers
import { SidebarProvider as ActualSidebarProvider } from "@/components/ui/sidebar"; 
import { TooltipProvider as ActualTooltipProvider } from "@/components/ui/tooltip"; 
import { AuthProvider } from "@/contexts/auth-context";


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
  description: "Gestión de cafetería simplificada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ActualSidebarProvider defaultOpen>
            <ActualTooltipProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </ActualTooltipProvider>
          </ActualSidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

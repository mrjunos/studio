
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import React from "react";
import {
  Sidebar,
  SidebarHeader as UiSidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Archive,
  Settings,
  Menu,
  Landmark,
  LogOut,
  Receipt, // Added Receipt icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetTitle } from "@/components/ui/sheet";


interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/products", icon: Coffee, label: "Products", tooltip: "Manage Products" },
  { href: "/sales", icon: ShoppingCart, label: "Sales", tooltip: "Record Sales" },
  { href: "/inventory", icon: Archive, label: "Inventory", tooltip: "Adjust Inventory" },
  { href: "/income", icon: Landmark, label: "Other Income", tooltip: "Track Other Income" },
  { href: "/expenses", icon: Receipt, label: "Expenses", tooltip: "Track Expenses" }, // New expense item
];

function AppSpecificSidebarHeader() {
  const { isMobile } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <UiSidebarHeader className="p-4" suppressHydrationWarning>
      <Link href="/" className="flex items-center gap-2">
        <Coffee className="h-8 w-8 text-primary" />
        {mounted && isMobile ? (
           <SheetTitle className="text-xl font-semibold text-primary">BrewBooks</SheetTitle>
        ) : (
          <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
            BrewBooks
          </h1>
        )}
      </Link>
    </UiSidebarHeader>
  );
}

function AppShellInternal({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <AppSpecificSidebarHeader />
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="h-full">
            <SidebarMenu className="p-4">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{
                      children: item.tooltip,
                      className: "group-data-[collapsible=icon]:block hidden",
                    }}
                    className={cn(
                      "justify-start",
                      pathname === item.href && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <Separator />
        <SidebarFooter className="p-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>BB</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium">BrewBooks User</p>
                  <p className="text-xs text-muted-foreground">admin@brewbooks.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md md:justify-end">
           <SidebarTrigger className="md:hidden">
              <Menu className="h-6 w-6" />
           </SidebarTrigger>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  // AppShell doesn't call useSidebar directly. AppShellInternal does.
  return <AppShellInternal>{children}</AppShellInternal>;
}

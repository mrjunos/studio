
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import React, { useState, useEffect } from "react";
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
  // SidebarContext, // Not directly used here, useSidebar hook is preferred
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
  LogIn as LogInIcon, // Renamed to avoid conflict
  Receipt,
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
import { useAuth } from "@/contexts/auth-context";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
  authRequired?: boolean; // To hide/show based on auth state if needed, not used yet
  public?: boolean; // Always show
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard", public: true },
  { href: "/products", icon: Coffee, label: "Productos", tooltip: "Gestionar Productos" },
  { href: "/sales", icon: ShoppingCart, label: "Ventas", tooltip: "Registrar Ventas" },
  { href: "/inventory", icon: Archive, label: "Inventario", tooltip: "Ajustar Inventario" },
  { href: "/income", icon: Landmark, label: "Otros Ingresos", tooltip: "Rastrear Otros Ingresos" },
  { href: "/expenses", icon: Receipt, label: "Gastos", tooltip: "Rastrear Gastos" },
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
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente."});
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const filteredNavItems = navItems.filter(item => item.public || isLoggedIn);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <AppSpecificSidebarHeader />
        <Separator />
        <SidebarContent asChild>
          <ScrollArea className="h-full">
            <SidebarMenu className="p-4">
              {filteredNavItems.map((item) => (
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
              {!isLoggedIn && (
                 <SidebarMenuItem key="/login">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/login"}
                    tooltip={{
                      children: "Iniciar Sesión",
                      className: "group-data-[collapsible=icon]:block hidden",
                    }}
                    className={cn(
                      "justify-start",
                      pathname === "/login" && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                     onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <Link href="/login">
                      <LogInIcon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Iniciar Sesión
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <Separator />
        <SidebarFooter className="p-4">
           {isLoggedIn && user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-2 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || "https://placehold.co/100x100.png"} alt="Avatar de Usuario" data-ai-hint="user avatar" />
                    <AvatarFallback>{user.email ? user.email.substring(0, 2).toUpperCase() : 'BB'}</AvatarFallback>
                  </Avatar>
                  <div className="group-data-[collapsible=icon]:hidden text-left">
                    <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                    {user.displayName && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled> 
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
             <Button variant="outline" asChild className="w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2">
                <Link href="/login">
                    <LogInIcon className="h-4 w-4 group-data-[collapsible=icon]:m-0 group-data-[collapsible=icon]:mr-0 mr-2" />
                    <span className="group-data-[collapsible=icon]:hidden">Iniciar Sesión</span>
                </Link>
             </Button>
           )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md md:justify-end">
           <SidebarTrigger className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Alternar Menú</span>
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
  return <AppShellInternal>{children}</AppShellInternal>;
}

"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ThemeToggle, MobileThemeToggle } from "@/components/ui/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

// Shadcn components
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarThemeToggle } from "@/components/ui/sidebar-theme-toggle";

// Sidebar navigation items
const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { setTheme, theme } = useTheme();
  
  useEffect(() => {
    // Check if user is loaded and authenticated
    if (isLoaded) {
      if (!user) {
        // Redirect to sign-in if not authenticated
        router.push(`/sign-in?redirect_url=${pathname ? encodeURIComponent(pathname) : '/admin'}`);
        return;
      }
      
      // Check if user has admin role
      const userRole = user.publicMetadata.role as string | undefined;
      if (userRole !== "admin") {
        // Redirect to store if not an admin
        router.push("/store");
        return;
      }
    }
  }, [user, isLoaded, pathname, router]);
  
  // Show loading state while checking authentication
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-1 space-x-4">
          <Skeleton className="h-full w-64 rounded-md" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile header */}
      <header className="border-b sticky top-0 z-10 bg-background lg:hidden">
        <div className="flex h-16 items-center px-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b shrink-0">
                <SheetTitle>
                  <Link href="/admin" className="flex items-center font-semibold">
                    <span className="text-xl bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">WesternStreet Admin</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              
              {/* Mobile sidebar content with flex layout */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-2">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1",
                          isActive 
                            ? "bg-red-50 text-red-600 font-medium dark:bg-red-950 dark:text-red-400" 
                            : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-red-600 dark:text-red-400" : "")} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              
              {/* Mobile bottom buttons - fixed at bottom */}
              <div className="border-t p-4 space-y-2 shrink-0">
                {/* Dark Mode Toggle for Mobile */}
                <MobileThemeToggle />
                
                {/* View Store Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                  asChild
                >
                  <Link href="/store">
                    <ChevronRight className="mr-2 h-4 w-4" />
                    <span>View Store</span>
                  </Link>
                </Button>
                
                {/* Sign Out Button */}
                <SignOutButton>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-950"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </SignOutButton>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex-1">
            <Link href="/admin" className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
              WesternStreet Admin
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar - fixed layout */}
        <aside className="hidden lg:block w-64 border-r h-screen sticky top-0 flex flex-col">
          {/* Sidebar header */}
          <div className="h-16 border-b flex items-center px-6 shrink-0">
            <Link href="/admin" className="font-semibold text-xl bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
              WesternStreet Admin
            </Link>
          </div>
          
          {/* Main navigation - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href || (pathname && pathname.startsWith(`${item.href}/`));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1",
                      isActive 
                        ? "bg-red-50 text-red-600 font-medium dark:bg-red-950 dark:text-red-400" 
                        : "text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-red-600 dark:text-red-400" : "")} />
                    <span>{item.name}</span>
                    {isActive && <div className="ml-auto w-1 h-5 bg-red-600 dark:bg-red-400 rounded-full"></div>}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* User info and action buttons - fixed at bottom */}
          <div className="border-t p-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{user.fullName || user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                asChild
              >
                <Link href="/store">
                  <ChevronRight className="mr-2 h-4 w-4" />
                  <span>View Store</span>
                </Link>
              </Button>
              
              <SidebarThemeToggle />
            </div>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

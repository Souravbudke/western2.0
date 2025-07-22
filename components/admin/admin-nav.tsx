"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ShoppingBag, LayoutDashboard, Settings, Users, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function AdminDashboardNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container px-4 mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600">
              WesternStreet Admin
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-8">
          <Link 
            href="/admin" 
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-red-600"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
          <Link 
            href="/admin/products" 
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-red-600"
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </Link>
          <Link 
            href="/admin/orders" 
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-red-600"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Link>
          <Link 
            href="/admin/customers" 
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-red-600"
          >
            <Users className="mr-2 h-4 w-4" />
            Customers
          </Link>
        </nav>

        {/* User and Notifications */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">New order received</p>
                    <p className="text-xs text-muted-foreground">Order #1234 from Jane Doe</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">Low stock alert</p>
                    <p className="text-xs text-muted-foreground">Pink Lipstick is running low</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">New customer registered</p>
                    <p className="text-xs text-muted-foreground">John Smith created an account</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/store">
            <Button variant="outline" size="sm">
              View Store
            </Button>
          </Link>

          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}

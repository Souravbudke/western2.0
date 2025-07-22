"use client";

import { UserButton as ClerkUserButton, useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ShoppingBag, User, LogIn, UserCog, LogOut } from "lucide-react";

export function UserButton() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const isAdmin = user?.publicMetadata?.role === "admin";

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" />
            <span className="hidden md:inline">Sign In</span>
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Sign Up</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link href="/admin">
          <Button variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50">
            <UserCog className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
          </Button>
        </Link>
      )}
      
      <Link href="/cart">
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden md:inline">Cart</span>
        </Button>
      </Link>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            <ClerkUserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                }
              }}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/orders">
            <DropdownMenuItem className="cursor-pointer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Orders</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

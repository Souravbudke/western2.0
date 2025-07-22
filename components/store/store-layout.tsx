"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Home, ShoppingBag, User, Menu, X, Search, Heart, LogOut, Camera } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle, MobileThemeToggle } from "@/components/ui/theme-toggle"

interface StoreLayoutProps {
  children: React.ReactNode
}

export function StoreLayout({ children }: StoreLayoutProps) {
  const { user, isSignedIn } = useUser()
  const { cart } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Track scroll position for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Define separate navigation arrays for desktop and mobile
  const desktopNavigation = [
    { name: "Home", href: "/store", icon: Home },
    { name: "Products", href: "/store/products", icon: ShoppingBag },
    { name: "Account", href: "/store/account", icon: User },
  ]
  
  const mobileNavigation = [
    { name: "Home", href: "/store", icon: Home },
    { name: "Products", href: "/store/products", icon: ShoppingBag },
    { name: "Image Search", href: "/store/image-search", icon: Camera },
    { name: "Account", href: "/store/account", icon: User },
  ]

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  // Check if we're on the home page to add the store-homepage class
  const isHomePage = pathname === "/store";

  return (
    <div className={cn("flex min-h-screen flex-col", isHomePage && "store-homepage")}>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled 
            ? "bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800" 
            : "bg-white dark:bg-gray-900"
        )}
      >
        <div className="container px-2 sm:px-4 mx-auto">
          <div className="flex h-16 items-center justify-between overflow-hidden">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/store" className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600">WesternStreet</span>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 xl:space-x-12 flex-1 ml-4 lg:ml-12 xl:ml-24">
              {desktopNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors",
                    pathname === item.href 
                      ? "text-red-600 font-semibold" 
                      : "text-muted-foreground hover:text-red-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4 z-20">
              <div className="relative">
                <div className="hidden lg:flex items-center gap-2">
                  <form className="relative" onSubmit={(e) => {
                    e.preventDefault();
                    const searchInput = e.currentTarget.querySelector('input');
                    if (searchInput && searchInput.value.trim()) {
                      router.push(`/store/products?search=${encodeURIComponent(searchInput.value.trim())}`);
                    }
                  }}>
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      name="search"
                      placeholder="Search products..." 
                      className="w-[150px] xl:w-[200px] pl-8 rounded-l-full border-muted focus:border-red-300 focus:ring-red-200 dark:border-gray-700 dark:focus:border-red-800 dark:focus:ring-red-900" 
                    />
                  </form>
                  <Link href="/store/image-search">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="rounded-r-full flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white h-10 -ml-1 px-3"
                      title="Search by Image"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Scan</span>
                    </Button>
                  </Link>
                </div>
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon">
                      <Search className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="top" className="w-full">
                    <SheetHeader className="space-y-4">
                      <SheetTitle asChild>
                        <h2>Search Products</h2>
                      </SheetTitle>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const searchInput = e.currentTarget.querySelector('input');
                        if (searchInput && searchInput.value.trim()) {
                          router.push(`/store/products?search=${encodeURIComponent(searchInput.value.trim())}`);
                          const closeButton = document.querySelector('[data-sheet-close]');
                          if (closeButton && closeButton instanceof HTMLElement) {
                            closeButton.click();
                          }
                        }
                      }}>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="search" 
                            name="search"
                            placeholder="Search products..." 
                            className="w-full pl-8 rounded-full" 
                          />
                        </div>
                      </form>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
              </div>
              
              <Link href="/store/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/store/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className={cn(
                    "h-5 w-5",
                    totalItems > 0 && "text-red-600 animate-bounce"
                  )} />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>

              {user?.publicMetadata?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" className="text-sm gap-2 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                    <User className="h-4 w-4" />
                    Admin Portal
                  </Button>
                </Link>
              )}

              {!isSignedIn && (
                <Link href="/sign-in">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Sign In
                  </Button>
                </Link>
              )}

              <ThemeToggle />
              {isSignedIn && <UserButton />}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-3">
              <Link href="/store/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              
              <Link href="/store/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className={cn(
                    "h-5 w-5",
                    totalItems > 0 && "text-red-600 animate-bounce"
                  )} />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[350px] p-0 flex flex-col">
                  <SheetHeader className="border-b p-4 flex items-center justify-center">
                    <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6">
                      <form className="relative mb-6" onSubmit={(e) => {
                        e.preventDefault();
                        const searchInput = e.currentTarget.querySelector('input');
                        if (searchInput && searchInput.value.trim()) {
                          router.push(`/store/products?search=${encodeURIComponent(searchInput.value.trim())}`);
                          // Close the mobile menu sheet after search
                          const closeButton = document.querySelector('[data-sheet-close]');
                          if (closeButton && closeButton instanceof HTMLElement) {
                            closeButton.click();
                          }
                        }
                      }}>
                        <div className="relative w-full">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="search" 
                            name="search"
                            placeholder="Search products..." 
                            className="w-full pl-8 rounded-full border-muted bg-muted/50" 
                          />
                        </div>
                      </form>
                    </div>
                    
                    {/* Main Navigation Links */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3">Main Menu</h3>
                      <nav className="grid gap-1">
                        {mobileNavigation.map((item) => (
                          <SheetClose asChild key={item.name}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                pathname === item.href
                                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                                  : "text-muted-foreground hover:bg-muted hover:text-red-600 dark:hover:text-red-400"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                    </div>
                    
                    {/* User Account Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3">Account</h3>
                      
                      {isSignedIn ? (
                        <div className="space-y-3">
                          {/* User info */}
                          <div className="flex items-center gap-3 px-3 py-2">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-red-600" />
                            </div>
                            <span className="text-base font-medium">{user?.firstName || 'User'}</span>
                          </div>
                          
                          {/* Admin Dashboard button */}
                          {user?.publicMetadata?.role === 'admin' && (
                            <SheetClose asChild>
                              <Link href="/admin" className="block px-3">
                                <Button variant="outline" className="w-full justify-start gap-2 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                                  <User className="h-5 w-5" />
                                  Admin Dashboard
                                </Button>
                              </Link>
                            </SheetClose>
                          )}
                          
                          {/* Always show Sign Out button */}
                          <SheetClose asChild>
                            <div className="px-3">
                              <SignOutButton>
                                <Button 
                                  variant="destructive" 
                                  className="w-full justify-start gap-2"
                                >
                                  <LogOut className="h-5 w-5" />
                                  Sign Out
                                </Button>
                              </SignOutButton>
                            </div>
                          </SheetClose>
                        </div>
                      ) : (
                        <div className="px-3">
                          <SheetClose asChild>
                            <Link href="/sign-in" className="block w-full">
                              <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                              >
                                Sign In
                              </Button>
                            </Link>
                          </SheetClose>
                        </div>
                      )}
                    </div>
                    
                    {/* Theme Toggle */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 px-3">Appearance</h3>
                      <div className="px-3">
                        <MobileThemeToggle />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 dark:border-gray-800">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-12">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">WesternStreet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Premium sneakers products curated for your unique style. Discover the perfect products that enhance your natural sneakers.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/mahimahovale/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-600 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/mahimahovale" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-red-600 transition-colors duration-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="md:justify-self-center">
              <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Shop</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/store" className="text-sm text-muted-foreground hover:text-red-600 transition-colors duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/store/products" className="text-sm text-muted-foreground hover:text-red-600 transition-colors duration-200">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/store/about" className="text-sm text-muted-foreground hover:text-red-600 transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/store/wishlist" className="text-sm text-muted-foreground hover:text-red-600 transition-colors duration-200">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/store/cart" className="text-sm text-muted-foreground hover:text-red-600 transition-colors duration-200">
                    Shopping Cart
                  </Link>
                </li>
              </ul>
            </div>

            {/* Feedback form section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">Send Feedback</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'd love to hear your thoughts on how we can improve your shopping experience.
              </p>
              <form className="space-y-3" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const message = formData.get('message') as string;
                
                // Create mailto link
                const mailtoLink = `mailto:mahimarhovale@gmail.com?subject=WesternStreet Feedback&body=${encodeURIComponent(message)}`;
                
                // Open email client
                window.open(mailtoLink, '_blank');
                
                // Reset form
                e.currentTarget.reset();
              }}>
                <div>
                  <textarea 
                    name="message" 
                    rows={3} 
                    className="w-full rounded-md border border-input p-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:border-red-300 focus:ring focus:ring-red-200 dark:focus:border-red-800 dark:focus:ring-red-900" 
                    placeholder="Type your feedback here..." 
                    required
                  ></textarea>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Send Feedback
                </Button>
              </form>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 dark:border-gray-700">
            <p className="text-sm text-muted-foreground order-2 md:order-1">
              © {new Date().getFullYear()} WesternStreet. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

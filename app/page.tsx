import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ShieldCheck, Truck, Users, Heart, Star, ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
// Remove ProductCard import since we're removing the featured products section
import { Product } from "@/lib/db";

export default async function Home() {
  // Just get products for potential future use, but remove the featuredProducts array creation
  const products = await db.getProducts();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container px-4 mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600">WesternStreet</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 space-x-12">
            <Link href="/" className="flex items-center text-sm font-semibold text-red-600">
              Home
            </Link>
            <Link href="/store" className="flex items-center text-sm font-medium text-muted-foreground hover:text-red-600">
              Shop
            </Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link href="/store">
              <Button className="bg-red-600 hover:bg-red-700 text-white">Shop Now</Button>
            </Link>
            <Link href="/sign-in" className="hidden md:block">
              <Button variant="outline">Login</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-red-50 via-purple-50 to-red-100 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2 relative z-10">
              <div className="flex flex-col justify-center space-y-6">
                <Badge className="w-fit bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 text-sm">Premium Sneakers</Badge>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-700">
                    Discover Your Sneakers Essentials
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Premium sneakers curated for your unique style. Explore our collection and enhance your
                    natural Sneakers with our carefully selected products.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row pt-4">
                  <Link href="/store">
                    <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all">
                      Shop Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button size="lg" variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                      Admin Portal
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-red-400 to-purple-400"></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Trusted by <span className="font-medium text-red-600">2,000+</span> customers</p>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-purple-500 rounded-2xl blur-2xl opacity-30 transform rotate-6"></div>
                  <div className="relative bg-white p-4 rounded-2xl shadow-xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&h=500&q=80"
                      alt="Sneakers Collection"
                      width={500}
                      height={500}
                      className="rounded-xl object-cover w-full h-[400px]"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-red-800">Premium Collection</h3>
                          <p className="text-sm text-muted-foreground">Discover our top-rated products</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">New Arrivals</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge className="mb-2 bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1">Why Choose Us</Badge>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-700">
                The WesternStreet Difference
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                We provide the highest quality Sneakers products with exceptional service and attention to detail
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 border border-red-100">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-red-100 opacity-20 group-hover:bg-red-200 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 text-white shadow-md">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    All our products are carefully selected for quality, and safety to ensure the best results for your Sneakers routine.
                  </p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 border border-red-100">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-red-100 opacity-20 group-hover:bg-red-200 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 text-white shadow-md">
                    <Truck className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Fast Delivery</h3>
                  <p className="text-muted-foreground">
                    Quick and reliable shipping with real-time tracking to get your Sneakers essentials to you faster, no matter where you are.
                  </p>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 border border-red-100">
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 transform rounded-full bg-red-100 opacity-20 group-hover:bg-red-200 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-purple-600 text-white shadow-md">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Expert Support</h3>
                  <p className="text-muted-foreground">
                    Our sneakers experts are always available to help with personalized recommendations and answer all your sneakers questions.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-16 flex justify-center">
              <Link href="/store">
                <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                  Explore Our Products <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="border-t border-gray-200 bg-white">
          <div className="container px-4 md:px-6 py-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <ShoppingBag className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-medium">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over Rs50</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-medium">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% secure transactions</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Star className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-medium">Quality Guarantee</h3>
                <p className="text-sm text-muted-foreground">Tested and approved</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-medium">Customer Support</h3>
                <p className="text-sm text-muted-foreground">24/7 dedicated support</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Products section removed */}
        
      </main>
      <footer className="w-full py-6 bg-gradient-to-br from-red-50 to-purple-50 border-t">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">About</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">Our Story</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">Careers</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">Press</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Help</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">FAQ</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">Shipping</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-red-600">Returns</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Contact</h3>
              <ul className="space-y-2">
                <li><p className="text-sm text-muted-foreground">Email: support@westernstreet.com</p></li>
                <li><p className="text-sm text-muted-foreground">Phone: +1 (555) 123-4567</p></li>
              </ul>
            </div>
            {/* <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Newsletter</h3>
              <p className="text-sm text-muted-foreground">Subscribe for updates on new products and special promotions.</p>
              <div className="flex space-x-2">
                <Input type="email" placeholder="Your email" className="max-w-[200px]" />
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Subscribe</Button>
              </div>
            </div> */}
          </div>
          <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 sm:mb-0">© 2023 WesternStreet. All rights reserved.</p>
            <div className="flex items-center space-x-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">Instagram</span>{/* Instagram icon */}</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">Twitter</span>{/* Twitter icon */}</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground"><span className="sr-only">Facebook</span>{/* Facebook icon */}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

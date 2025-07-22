import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { formatCurrency, getBestSellingProducts } from "@/lib/utils"
import { ArrowRight, ShoppingBag, TrendingUp, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StoreCarousel } from "@/components/store/carousel"
import { BestsellersSection } from "@/components/store/bestsellers-section"

// Product interface definition
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export default async function StorePage() {
  // Fetch products and orders for initial server-side rendering
  const allProducts = await db.getProducts();
  const allOrders = await db.getOrders();
  
  // Get best-selling products for initial render
  const initialBestSellerProducts = getBestSellingProducts(allOrders, allProducts, 8);

  return (
    <div className="flex flex-col">
      {/* Carousel Section */}
      <section className="w-full mb-8">
        <StoreCarousel />
      </section>

      {/* Best Seller Products - Dynamic Section */}
      <BestsellersSection initialProducts={initialBestSellerProducts} />

      {/* Why Choose Us Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-foreground">Why Choose Us</h2>
            <p className="max-w-[600px] mx-auto mt-3 text-muted-foreground">
              We're committed to providing you with the best sneakers products and experience
            </p>
            <div className="mt-6">
              <Link href="/store/about">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  About Us
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:border-foreground/20 transition-all h-full">
              <CardContent className="pt-6 text-center flex flex-col h-full">
                <div className="mx-auto rounded-full bg-background/80 p-3 w-14 h-14 flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Quality Products</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Carefully curated selection of premium sneakers products
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border hover:border-foreground/20 transition-all h-full">
              <CardContent className="pt-6 text-center flex flex-col h-full">
                <div className="mx-auto rounded-full bg-background/80 p-3 w-14 h-14 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Free Shipping</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Free shipping on all orders over Rs50
                </p>
              </CardContent>
            </Card>  
            <Card className="border-border hover:border-foreground/20 transition-all h-full">
              <CardContent className="pt-6 text-center flex flex-col h-full">
                <div className="mx-auto rounded-full bg-background/80 p-3 w-14 h-14 flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Cruelty-Free</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  We only carry products that are not tested on animals
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}

import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { db, Product } from "@/lib/db"
import { formatCurrency, formatImageUrl } from "@/lib/utils"
import { Minus, Plus, ShoppingCart, Heart, Share2, Star, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react"
import AddToCartButton from "./_components/add-to-cart-button"
import AddToWishlistButton from "./_components/add-to-wishlist-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import ProductCard from "@/components/store/product-card"
import { ReviewsSection, ProductRating } from "./_components/reviews-section"
import StockDisplay from "./_components/stock-display"
import WhatsAppShareButton from "./_components/whatsapp-share-button"

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Ensure params.id is properly awaited and used correctly
  const resolvedParams = await Promise.resolve(params);
  const id = String(resolvedParams?.id || "");
  
  if (!id) {
    redirect("/store/products");
  }

  const product = await db.getProduct(id);

  if (!product) {
    redirect("/store/products");
  }
  
  // Get related products (same category)
  const allProducts = await db.getProducts();
  const relatedProducts = allProducts
    .filter((p: Product) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container py-8 px-4 md:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/store" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/store/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <span className="mx-2">/</span>
        <Link 
          href={`/store/products?category=${product.category}`} 
          className="hover:text-foreground transition-colors"
        >
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground truncate max-w-[150px] sm:max-w-none">{product.name}</span>
      </div>
      
      {/* Back button - Mobile only */}
      <Link href="/store/products" className="inline-flex items-center mb-6 md:hidden">
        <Button variant="ghost" size="sm" className="gap-1 pl-0 hover:pl-1 transition-all">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
            <Image
              src={formatImageUrl(product.image)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
            <div className="absolute top-4 right-4">
              <AddToWishlistButton product={product} variant="icon" />
            </div>
          </div>
          
          {/* Thumbnail images - could be expanded with actual thumbnails */}
          <div className="hidden md:flex gap-4 overflow-auto pb-2">
            <div className="relative aspect-square w-[100px] shrink-0 rounded-md border overflow-hidden bg-white cursor-pointer ring-2 ring-red-500">
              <Image
                src={formatImageUrl(product.image)}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            {/* {[1, 2, 3].map((i) => (
              <div key={i} className="relative aspect-square w-[100px] shrink-0 rounded-md border overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <span className="text-xs">View {i + 1}</span>
                </div>
              </div>
            ))} */}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                {product.category}
              </Badge>
              <div className="flex items-center">
                <ProductRating productId={product.id} />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(product.price)}</p>
          </div>

          <p className="text-muted-foreground">{product.description}</p>
          
          {/* Live Stock Display Component */}
          <StockDisplay product={product} refreshInterval={30000} />

          {/* Add to cart button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <AddToCartButton product={product} />
            <AddToWishlistButton product={product} variant="outline" />
          </div>
          
          {/* Shipping and returns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Free shipping over Rs50</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Secure payment</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">30-day returns</span>
            </div>
          </div>
          
          {/* Share buttons */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-sm font-medium">Share:</span>
            <div className="flex items-center gap-2">
              <WhatsAppShareButton 
                productName={product.name}
                productPrice={product.price}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Product details tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="description" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              Description
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              Product Details
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-6">
            <div className="prose max-w-none">
              <p>{product.description}</p>
            </div>
          </TabsContent>
          <TabsContent value="details" className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Product Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Brand</span>
                    <span>WesternStreet</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Category</span>
                    <span>{product.category}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">SKU</span>
                    <span>SKU-{product.id.substring(0, 8)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Stock</span>
                    <StockDisplay product={product} refreshInterval={0} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Shipping & Returns</h3>
                <div className="space-y-4">
                  <p className="text-sm">Free standard shipping on orders over Rs50</p>
                  <p className="text-sm">Express shipping available for an additional fee</p>
                  <p className="text-sm">30-day return policy for unused items in original packaging</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="pt-6">
            <ReviewsSection productId={product.id} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

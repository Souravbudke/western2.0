import Link from "next/link"
import Image from "next/image"
import { db, Product } from "@/lib/db"
import { formatCurrency, formatImageUrl, getBestSellingProducts } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Search, SlidersHorizontal, Heart, Filter, X, Check, Award } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import ProductCard from "@/components/store/product-card"
import SortSelector from "./_components/sort-selector"

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string, search?: string, bestSellers?: string, sort?: string } }) {
  // Safely access searchParams - ensure it's properly awaited
  const params = await Promise.resolve(searchParams);
  const category = params?.category || null;
  const searchQuery = params?.search || "";
  const showBestSellers = params?.bestSellers === "true";
  const sortOption = params?.sort || "newest";

  // Fetch products asynchronously
  const allProducts = await db.getProducts();
  const allOrders = await db.getOrders();
  
  // Get best sellers if needed
  let bestSellerIds: string[] = [];
  if (showBestSellers) {
    const bestSellers = getBestSellingProducts(allOrders, allProducts);
    bestSellerIds = bestSellers.map(product => product.id);
  }
  
  // Filter products by category if provided
  let filteredProducts = category ? 
    allProducts.filter((product: Product) => product.category === category) : 
    allProducts;
    
  // Filter by search query if provided
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter((product: Product) => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query)
    );
  }
  
  // Filter by best sellers if requested
  if (showBestSellers) {
    filteredProducts = filteredProducts.filter((product: Product) => 
      bestSellerIds.includes(product.id)
    );
  }

  // Sort products based on the sort option
  switch (sortOption) {
    case "price-low-to-high":
      filteredProducts.sort((a: Product, b: Product) => a.price - b.price);
      break;
    case "price-high-to-low":
      filteredProducts.sort((a: Product, b: Product) => b.price - a.price);
      break;
    case "popularity":
      // Sort by best sellers first, then the rest
      filteredProducts.sort((a: Product, b: Product) => {
        const aIsBestSeller = bestSellerIds.includes(a.id);
        const bIsBestSeller = bestSellerIds.includes(b.id);
        if (aIsBestSeller && !bIsBestSeller) return -1;
        if (!aIsBestSeller && bIsBestSeller) return 1;
        return 0;
      });
      break;
    case "newest":
    default:
      // Keep default order (assumed to be newest first from the database)
      break;
  }

  // Get all unique categories
  const uniqueCategories = new Set<string>();
  allProducts.forEach((product: Product) => {
    uniqueCategories.add(product.category);
  });
  const categories = Array.from(uniqueCategories).sort();

  return (
    <div className="container px-4 mx-auto py-6 md:py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
            <p className="text-muted-foreground mt-1">
              Browse our collection of sneakers products
            </p>
          </div>
          
          <div className="flex w-full lg:w-auto gap-2">
            <div className="relative flex-grow">
              <form action="/store/products" method="GET">
                {category && <input type="hidden" name="category" value={category} />}
                {showBestSellers && <input type="hidden" name="bestSellers" value="true" />}
                {sortOption !== "newest" && <input type="hidden" name="sort" value={sortOption} />}
                <Input
                  type="search"
                  name="search"
                  placeholder="Search products..."
                  className="pl-8 py-2"
                  defaultValue={searchQuery}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </form>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <h3 className="font-medium mb-4">Categories</h3>
                  <div className="space-y-3">
                    <SheetClose asChild>
                      <Link
                        href={`/store/products${showBestSellers ? '?bestSellers=true' : ''}${sortOption !== "newest" ? `${showBestSellers ? '&' : '?'}sort=${sortOption}` : ''}`}
                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${!category ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                      >
                        <span>All Products</span>
                        {!category && <Check className="h-4 w-4" />}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href={`/store/products?bestSellers=${!showBestSellers}${category ? `&category=${category}` : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}`}
                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${showBestSellers ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2 text-red-600" />
                          <span>Best Sellers</span>
                        </div>
                        {showBestSellers && <Check className="h-4 w-4" />}
                      </Link>
                    </SheetClose>
                    {categories.map((cat: string) => (
                      <SheetClose asChild key={cat}>
                        <Link
                          href={`/store/products?category=${cat}${showBestSellers ? '&bestSellers=true' : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}`}
                          className={`flex items-center justify-between p-2 rounded-md transition-colors ${category === cat ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                        >
                          <span>{cat}</span>
                          {category === cat && <Check className="h-4 w-4" />}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="outline" className="rounded-md px-2 py-1 flex items-center gap-1">
              <span>Search: {searchQuery}</span>
              <Link href={category ? `/store/products?category=${category}${showBestSellers ? '&bestSellers=true' : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : showBestSellers ? `/store/products?bestSellers=true${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : sortOption !== "newest" ? `/store/products?sort=${sortOption}` : '/store/products'}>
                <X className="h-3 w-3" />
              </Link>
            </Badge>
          )}
          
          {category && (
            <Badge variant="outline" className="rounded-md px-2 py-1 flex items-center gap-1">
              <span>Category: {category}</span>
              <Link href={searchQuery ? `/store/products?search=${searchQuery}${showBestSellers ? '&bestSellers=true' : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : showBestSellers ? `/store/products?bestSellers=true${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : sortOption !== "newest" ? `/store/products?sort=${sortOption}` : '/store/products'}>
                <X className="h-3 w-3" />
              </Link>
            </Badge>
          )}
          
          {showBestSellers && (
            <Badge variant="outline" className="rounded-md px-2 py-1 flex items-center gap-1 border-red-200 text-red-700">
              <Award className="h-3 w-3 mr-1" />
              <span>Best Sellers</span>
              <Link href={category ? `/store/products?category=${category}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : searchQuery ? `/store/products?search=${searchQuery}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}` : sortOption !== "newest" ? `/store/products?sort=${sortOption}` : '/store/products'}>
                <X className="h-3 w-3" />
              </Link>
            </Badge>
          )}
          
          {sortOption !== "newest" && (
            <Badge variant="outline" className="rounded-md px-2 py-1 flex items-center gap-1">
              <span>Sort: {sortOption.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <Link href={`/store/products${category ? `?category=${category}` : ''}${showBestSellers ? `${category ? '&' : '?'}bestSellers=true` : ''}${searchQuery ? `${category || showBestSellers ? '&' : '?'}search=${searchQuery}` : ''}`}>
                <X className="h-3 w-3" />
              </Link>
            </Badge>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories sidebar - desktop only */}
          <div className="hidden lg:block w-64 shrink-0">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-lg mb-4">Categories</h2>
                <div className="space-y-2">
                  <Link
                    href={`/store/products${showBestSellers ? '?bestSellers=true' : ''}${sortOption !== "newest" ? `${showBestSellers ? '&' : '?'}sort=${sortOption}` : ''}${searchQuery ? `${showBestSellers || sortOption !== "newest" ? '&' : '?'}search=${searchQuery}` : ''}`}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${!category ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                  >
                    <span>All Products</span>
                    {!category && <Check className="h-4 w-4" />}
                  </Link>
                  <Link
                    href={`/store/products?bestSellers=${!showBestSellers}${category ? `&category=${category}` : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${showBestSellers ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-red-600" />
                      <span>Best Sellers</span>
                    </div>
                    {showBestSellers && <Check className="h-4 w-4" />}
                  </Link>
                  {categories.map((cat: string) => (
                    <Link
                      key={cat}
                      href={`/store/products?category=${cat}${showBestSellers ? '&bestSellers=true' : ''}${sortOption !== "newest" ? `&sort=${sortOption}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors ${category === cat ? "bg-red-50 text-red-700" : "hover:bg-muted/50"}`}
                    >
                      <span>{cat}</span>
                      {category === cat && <Check className="h-4 w-4" />}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main products grid */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredProducts.length} products found
              </p>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <SortSelector 
                  sortOption={sortOption}
                  category={category}
                  showBestSellers={showBestSellers}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
            
            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                <>
                  {filteredProducts.map((product: Product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      isBestSeller={bestSellerIds.includes(product.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <Filter className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">No products found</h3>
                  <p className="text-muted-foreground mt-2 mb-6">Try adjusting your search or filter criteria</p>
                  <Link href="/store/products">
                    <Button variant="outline">Clear all filters</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

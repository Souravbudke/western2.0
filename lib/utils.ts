import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format an image URL to ensure it's valid
 * @param url The image URL to format
 * @returns A valid image URL or fallback
 */
export function formatImageUrl(url: string | undefined): string {
  if (!url) return "/placeholder.svg";
  
  // Return as is if it's a relative path or data URL
  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  
  try {
    // Validate URL
    new URL(url);
    return url;
  } catch (e) {
    // If URL is invalid, use placeholder
    console.error(`Invalid image URL: ${url}`);
    return "/placeholder.svg";
  }
}

/**
 * Calculate best-selling products based on order history
 * @param orders Array of all orders
 * @param products Array of all products
 * @param limit Number of top products to return (default: 4)
 * @returns Array of products sorted by sales volume
 */
export function getBestSellingProducts(orders: any[], products: any[], limit: number = 4) {
  // Create a map to track product sales count
  const productSalesCount: Record<string, number> = {};
  
  // Count occurrences of each product in orders
  orders.forEach(order => {
    if (order?.products && Array.isArray(order.products)) {
      order.products.forEach((item: any) => {
        const productId = item.productId;
        const quantity = item.quantity || 1;
        
        if (productId) {
          productSalesCount[productId] = (productSalesCount[productId] || 0) + quantity;
        }
      });
    }
  });
  
  // Sort products by sales count
  const sortedProducts = [...products].sort((a, b) => {
    const countA = productSalesCount[a.id] || 0;
    const countB = productSalesCount[b.id] || 0;
    return countB - countA; // Descending order
  });
  
  // Return the top N products
  return sortedProducts.slice(0, limit);
}

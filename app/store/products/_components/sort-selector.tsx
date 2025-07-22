"use client"

import { useRouter } from "next/navigation"

interface SortSelectorProps {
  sortOption: string
  category?: string | null
  showBestSellers?: boolean
  searchQuery?: string
}

export default function SortSelector({ 
  sortOption, 
  category, 
  showBestSellers, 
  searchQuery 
}: SortSelectorProps) {
  const router = useRouter()
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const url = `/store/products${category ? `?category=${category}` : ''}${showBestSellers ? `${category ? '&' : '?'}bestSellers=true` : ''}${searchQuery ? `${category || showBestSellers ? '&' : '?'}search=${searchQuery}` : ''}${newSort !== "newest" ? `${category || showBestSellers || searchQuery ? '&' : '?'}sort=${newSort}` : ''}`;
    router.push(url)
  }
  
  return (
    <select 
      className="py-1 px-2 border rounded-md text-sm"
      onChange={handleSortChange}
      defaultValue={sortOption}
    >
      <option value="newest">Newest</option>
      <option value="price-low-to-high">Price: Low to High</option>
      <option value="price-high-to-low">Price: High to Low</option>
      <option value="popularity">Popularity</option>
    </select>
  )
} 
"use client"

import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  description: string
}

interface WishlistStore {
  wishlist: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
}

const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlist: [],
      addItem: (item) => set((state) => {
        const existingItem = state.wishlist.find((wishlistItem) => wishlistItem.id === item.id)
        
        if (existingItem) {
          // Item already exists, do nothing
          return { wishlist: state.wishlist }
        }
        
        // Add new item
        return { wishlist: [...state.wishlist, item] }
      }),
      removeItem: (id) => set((state) => ({
        wishlist: state.wishlist.filter((item) => item.id !== id),
      })),
      clearWishlist: () => set({ wishlist: [] }),
      isInWishlist: (id) => {
        const state = get()
        return state.wishlist.some(item => item.id === id)
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
)

export const useWishlist = () => {
  const [isMounted, setIsMounted] = useState(false)
  
  const wishlist = useWishlistStore((state) => state.wishlist)
  const addItem = useWishlistStore((state) => state.addItem)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const clearWishlist = useWishlistStore((state) => state.clearWishlist)
  const isInWishlist = useWishlistStore((state) => state.isInWishlist)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  if (!isMounted) {
    return {
      wishlist: [],
      addItem,
      removeItem,
      clearWishlist,
      isInWishlist: () => false,
    }
  }
  
  return {
    wishlist,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
  }
} 
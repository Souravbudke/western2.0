"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoryManagement } from "./_components/category-management"
import { CarouselManagement } from "./_components/carousel-management"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("categories")
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="carousel">Carousel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Create, edit, and delete product categories for your store.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="carousel">
          <Card>
            <CardHeader>
              <CardTitle>Carousel Management</CardTitle>
              <CardDescription>
                Manage the images displayed in your store's carousel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarouselManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
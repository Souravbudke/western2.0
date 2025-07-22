"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Product, Category } from "@/lib/db"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Trash } from "lucide-react"
import ImageUpload from "@/components/ui/image-upload"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useProductDelete } from "@/hooks/use-product-delete"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Define form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  category: z.string().min(2, { message: "Category must be at least 2 characters." }),
  image: z.string().min(1, { message: "Product image is required." }),
  imageCid: z.string().optional(),
  stock: z.coerce.number().int().nonnegative({ message: "Stock must be a non-negative integer." }),
})

// Define the Pinata group ID for product images from environment variable
const PRODUCT_GROUP_ID = process.env.NEXT_PUBLIC_PRODUCT_GROUP_ID || "";

interface ProductFormProps {
  product: Product | null
  id: string
  isNew: boolean
}

export function ProductForm({ product, id, isNew }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  
  // Use the image upload hook
  const { url: imageUrl, handleUpload, handleDelete: deleteImage } = useImageUpload({
    initialValue: product?.image || "",
  });
   
  // Use our product delete hook
  const { isDeleting, deleteProduct } = useProductDelete({
    onDeleteSuccess: () => {
      router.push('/admin/products');
      router.refresh();
    }
  });
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        
        const data = await response.json()
        // Filter to only include active categories
        const activeCategories = data.filter((category: Category) => category.isActive)
        setCategories(activeCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Failed to load categories", {
          description: "Using manual category input instead."
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    fetchCategories()
  }, [])
  
  const defaultValues = product ? {
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    image: product.image,
    imageCid: "",
    stock: product.stock,
  } : {
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    imageCid: "",
    stock: 0,
  }
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  
  // Update form values when image URL changes
  useEffect(() => {
    form.setValue("image", imageUrl);
  }, [imageUrl, form]);
  
  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      
      if (product) {
        // Update existing product
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update product')
        }
        
        toast.success('Product updated successfully')
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create product')
        }
        
        toast.success('Product created successfully')
      }
      
      // Redirect to products list after successful submission
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(product ? 'Failed to update product' : 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Delete product handler
  function handleProductDelete() {
    if (!id || isNew) return;
    
    // Open the confirmation dialog instead of using window.confirm
    setShowDeleteDialog(true);
  }

  // Function to confirm deletion after dialog confirmation
  async function confirmDelete() {
    // Close the dialog
    setShowDeleteDialog(false);
    
    // Call the hook's deleteProduct function
    await deleteProduct(id);
  }
  
  return (
    <div className="space-y-8">
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This will also delete all associated images from Pinata.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="flex items-center text-sm hover:opacity-75 transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
        
        {!isNew && (
          <Button variant="destructive" size="sm" onClick={handleProductDelete} disabled={isDeleting}>
            <Trash className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={(url, cid) => {
                      field.onChange(url);
                      form.setValue("imageCid", cid || "");
                      handleUpload(url, cid);
                    }}
                    onDelete={async () => {
                      const result = await deleteImage();
                      field.onChange("");
                      form.setValue("imageCid", "");
                      if (!result) {
                        toast.error("Failed to delete image from storage. Please try again.");
                      }
                    }}
                    disabled={isSubmitting}
                    label="Product Image"
                    groupId={PRODUCT_GROUP_ID}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Product description" 
                    className="min-h-24" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting || isLoadingCategories}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </form>
      </Form>
    </div>
  )
} 
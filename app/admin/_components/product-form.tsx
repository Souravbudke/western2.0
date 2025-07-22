"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { AlertTriangle, Trash2, Upload, X } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Helper function to get the base URL
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use current path
    return window.location.origin;
  }
  // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost
  return 'http://localhost:3000';
}

// Form validation schema
const productSchema = z.object({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().min(0.01, {
    message: "Price must be at least 0.01.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  image: z.string().url({
    message: "Please enter a valid URL for the image.",
  }).optional().or(z.literal("")),
  inventory: z.coerce.number().int().min(0, {
    message: "Inventory must be a non-negative integer.",
  })
});

// Define the Pinata group ID for product images
const PRODUCT_GROUP_ID = "db69246e-5c61-4f68-8af7-1da3c1ced4fb";

interface ProductFormProps {
  product: any;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      inventory: 0
    }
  });
  
  // Extract image CID from URL if it exists
  const extractImageCID = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    
    try {
      // Look for IPFS pattern in the URL
      const ipfsMatch = imageUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      if (ipfsMatch && ipfsMatch[1]) {
        return ipfsMatch[1];
      }
      return null;
    } catch (error) {
      console.error("Error extracting CID:", error);
      return null;
    }
  };
  
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        // Filter to only include active categories
        const activeCategories = data.filter((category: any) => category.isActive);
        setCategories(activeCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Failed to load categories",
          description: "Using manual category input instead.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, [toast]);
  
  // Initialize the form with product data after categories are loaded
  useEffect(() => {
    if (!formInitialized && !isLoadingCategories && product) {
      console.log('Setting form values with product:', product);
      
      // Set image preview first
      if (product.image) {
        setImagePreview(product.image);
      }
      
      // Now set all form values
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        category: product.category || "",
        image: product.image || "",
        inventory: product.stock || 0 // Map from stock to inventory
      });
      
      setFormInitialized(true);
    }
  }, [product, isLoadingCategories, form, formInitialized]);
  
  // Effect to ensure category is properly set after categories are loaded
  useEffect(() => {
    // Only run if we have a product with a category and categories are loaded
    if (product?.category && categories.length > 0 && !isLoadingCategories) {
      // Find if there's a category with a matching slug
      const matchingCategory = categories.find(cat => cat.slug === product.category);
      
      if (matchingCategory) {
        console.log('Setting category to:', matchingCategory.slug);
        // Update the category field explicitly
        form.setValue('category', matchingCategory.slug);
      } else {
        console.log('No matching category found for:', product.category);
        console.log('Available categories:', categories.map(c => c.slug).join(', '));
      }
    }
  }, [categories, isLoadingCategories, product, form]);
  
  // Log when form values change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'category') {
        console.log('Category field changed:', value.category);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Handle image upload to Pinata
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add the product group ID to the formData
      formData.append('groupId', PRODUCT_GROUP_ID);
      
      // Upload to Pinata via our API endpoint
      const uploadResponse = await fetch(`${getBaseUrl()}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to Pinata');
      }
      
      const data = await uploadResponse.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      
      // Update form with the new image URL
      // The API returns either url or a combination of gateway + CID
      const imageUrl = data.url;
      
      form.setValue('image', imageUrl);
      setImagePreview(imageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Remove image
  const handleRemoveImage = () => {
    form.setValue('image', '');
    setImagePreview(null);
  };
  
  // Handle product deletion
  const handleDelete = async () => {
    if (!product?.id) return;
    
    setIsDeleting(true);
    try {
      const imageCID = extractImageCID(product.image);
      
      // Delete the product from the database
      const deleteProductResponse = await fetch(`${getBaseUrl()}/api/products/${product.id}`, {
        method: 'DELETE',
      });
      
      if (!deleteProductResponse.ok) {
        throw new Error(`Failed to delete product: ${deleteProductResponse.statusText}`);
      }
      
      // If product had an image, delete it from Pinata
      if (imageCID) {
        try {
          // Delete image from Pinata
          await fetch(`${getBaseUrl()}/api/upload/delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cid: imageCID }),
          });
          
          console.log(`Deleted image with CID: ${imageCID} from Pinata`);
        } catch (imageError) {
          // Log but don't halt the process if image deletion fails
          console.error("Error deleting image from Pinata:", imageError);
        }
      }
      
      toast({
        title: "Product deleted",
        description: `${product.name} has been deleted successfully.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  // Handle product form submission and editing
  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    try {
      setIsSubmitting(true);
      
      const apiUrl = product?.id 
        ? `${getBaseUrl()}/api/products/${product.id}` 
        : `${getBaseUrl()}/api/products`;
      
      const method = product?.id ? 'PUT' : 'POST';
      
      // Map inventory field to stock for API compatibility
      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        image: values.image || "",
        imageCid: extractImageCID(values.image || "") || undefined,
        stock: values.inventory // Map inventory to stock
      };
      
      console.log(`${method} request to ${apiUrl} with data:`, productData);
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save product: ${error}`);
      }
      
      toast({
        title: product?.id ? "Product updated" : "Product created",
        description: `Successfully ${product?.id ? "updated" : "created"} ${values.name}`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: `Failed to save product: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingCategories || isSubmitting}>
                        <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading">Loading categories...</SelectItem>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.slug}
                          >
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
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter product description" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inventory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                
                <div className="space-y-4">
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative w-full max-w-[300px] h-[200px] rounded-md overflow-hidden border">
                      <Image 
                        src={imagePreview} 
                        alt="Product preview" 
                        fill 
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Image upload and URL input */}
                  <div className="space-y-4">
                    {!imagePreview && (
                      <div className="flex items-center gap-4">
                        <div className="relative cursor-pointer bg-muted hover:bg-muted/80 transition rounded-md flex flex-col items-center justify-center p-4 border-2 border-dashed border-muted-foreground/25 h-[100px] w-full">
                          <Input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                          <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {isUploading ? "Uploading..." : "Click to upload image"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <FormControl>
                      <Input 
                        placeholder="Or enter image URL" 
                        disabled={isUploading}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                </div>
                
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6 mt-6">
            <div className="flex items-center w-full sm:w-auto">
              {product?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSubmitting || isUploading || isDeleting}
                  className="flex items-center w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Product
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/products')}
                disabled={isSubmitting || isUploading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving..." : (product?.id ? "Update Product" : "Create Product")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
              {product?.image && (
                <span className="block mt-2">The product image stored on Pinata will also be deleted.</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
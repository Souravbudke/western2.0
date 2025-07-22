"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import GalleryUpload from "@/components/ui/gallery-upload";
import { useImageUpload } from "@/hooks/use-image-upload";
import { deleteMultipleImages } from "@/utils/multiple-upload";
import { Loader2 } from "lucide-react";

// Define the gallery image type
interface GalleryImage {
  url: string;
  cid?: string;
}

// Define the Pinata group ID for product images from environment variable
const PRODUCT_GROUP_ID = process.env.NEXT_PUBLIC_PRODUCT_GROUP_ID || "";

// Log the group ID for debugging
console.log("Product form using group ID:", PRODUCT_GROUP_ID);

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().min(1, "Product image is required"),
  imageCid: z.string().optional(),
  gallery: z.array(
    z.object({
      url: z.string(),
      cid: z.string().optional(),
    })
  ).optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>(initialData?.gallery || []);
  const { url: imageUrl, handleUpload, handleDelete } = useImageUpload({
    initialValue: initialData?.imageUrl || "",
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      price: 0,
      description: "",
      imageUrl: "",
      imageCid: "",
      gallery: [],
    },
  });

  useEffect(() => {
    form.setValue("imageUrl", imageUrl);
    form.setValue("gallery", gallery);
  }, [imageUrl, gallery, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      
      // Here you would implement your product creation/update logic
      // This is just a sample showing how to access the data
      console.log("Form data:", {
        ...data,
        gallery: gallery
      });
      
      // Redirect back to products page after submission
      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Product Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={(url, cid) => {
                        field.onChange(url);
                        form.setValue("imageCid", cid);
                        handleUpload(url, cid);
                      }}
                      onDelete={() => {
                        field.onChange("");
                        form.setValue("imageCid", "");
                        handleDelete();
                      }}
                      disabled={loading}
                      groupId={PRODUCT_GROUP_ID}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gallery"
              render={() => (
                <FormItem>
                  <FormLabel>Product Gallery</FormLabel>
                  <FormControl>
                    <GalleryUpload
                      value={gallery}
                      onChange={(images) => {
                        setGallery(images);
                        form.setValue("gallery", images);
                      }}
                      disabled={loading}
                      maxImages={5}
                      groupId={PRODUCT_GROUP_ID}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="9.99" {...field} />
                  </FormControl>
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
                    placeholder="Product description"
                    className="resize-none min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="ml-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Product</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}; 
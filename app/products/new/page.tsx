import { ProductForm } from "@/components/store/product-form";

export default function NewProductPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        <p className="text-gray-500">
          Fill out the form below to add a new product to the store. Upload a main product image and optional gallery images.
        </p>
      </div>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
} 
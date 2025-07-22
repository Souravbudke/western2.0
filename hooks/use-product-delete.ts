import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseProductDeleteProps {
  onDeleteSuccess?: () => void;
}

export const useProductDelete = ({ onDeleteSuccess }: UseProductDeleteProps = {}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const deleteProduct = async (productId: string) => {
    if (!productId) return;
    
    try {
      setIsDeleting(true);
      
      // Call the API endpoint to delete the product and its associated images
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      const result = await response.json();
      
      // Show success message
      toast.success('Product and associated images deleted successfully');
      
      // Execute success callback if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      
      // Refresh the router to update the UI
      router.refresh();
      
      return result;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
      return null;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    deleteProduct
  };
}; 
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Loader2, X, Upload, Plus } from "lucide-react";
import { uploadMultipleImages, deleteMultipleImages } from "@/utils/multiple-upload";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  url: string;
  cid?: string;
}

interface GalleryUploadProps {
  onChange: (images: GalleryImage[]) => void;
  value: GalleryImage[];
  disabled?: boolean;
  label?: string;
  maxImages?: number;
  groupId?: string;
}

const GalleryUpload: React.FC<GalleryUploadProps> = ({
  onChange,
  value = [],
  disabled,
  label = "Image Gallery",
  maxImages = 5,
  groupId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        // Limit the number of files that can be uploaded at once
        const totalImages = value.length + acceptedFiles.length;
        if (totalImages > maxImages) {
          setError(`Maximum of ${maxImages} images allowed. You can upload ${maxImages - value.length} more.`);
          return;
        }

        setIsUploading(true);
        setError(null);

        const results = await uploadMultipleImages(acceptedFiles, groupId);
        
        // Filter successful uploads
        const successfulUploads = results
          .filter(result => result.success && result.url && result.cid)
          .map(result => ({
            url: result.url as string,
            cid: result.cid as string,
          }));
        
        // Add new images to existing ones
        const newImages = [...value, ...successfulUploads];
        onChange(newImages);
        
        // Show error if some uploads failed
        const failedUploads = results.filter(result => !result.success);
        if (failedUploads.length > 0) {
          setError(`${failedUploads.length} image(s) failed to upload.`);
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        setError("An error occurred during upload.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, value, maxImages, groupId]
  );

  const removeImage = async (index: number) => {
    try {
      const image = value[index];
      
      // Create a new array without the removed image
      const newImages = value.filter((_, i) => i !== index);
      onChange(newImages);
      
      // Delete the image from Pinata if it has a CID
      if (image.cid) {
        await deleteMultipleImages([image.cid]);
      }
    } catch (error) {
      console.error("Error removing image:", error);
      setError("An error occurred while removing the image.");
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    disabled: isUploading || disabled || value.length >= maxImages,
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{label}</label>
        
        {/* Gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {value.map((image, index) => (
            <div 
              key={`image-${index}`}
              className="relative aspect-square rounded-md overflow-hidden border"
            >
              <Image
                src={image.url}
                alt={`Gallery image ${index + 1}`}
                className="object-cover"
                fill
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white z-10"
                disabled={disabled || isUploading}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {/* Add more images cell */}
          {value.length < maxImages && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-md aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer
                transition-colors duration-200
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                ${!disabled ? "hover:border-primary" : ""}
              `}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <>
                  <Plus className="h-8 w-8 text-gray-400" />
                  <p className="text-xs text-gray-500 text-center">
                    Add {value.length > 0 ? "more" : ""} images
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-xs text-gray-500">
        {value.length} of {maxImages} images uploaded. {maxImages - value.length} remaining.
      </p>
    </div>
  );
};

export default GalleryUpload; 
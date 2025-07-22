"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Loader2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onChange: (url: string, cid?: string) => void;
  onDelete: () => Promise<void> | void;
  value: string;
  disabled?: boolean;
  label?: string;
  groupId?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onChange,
  onDelete,
  value,
  disabled,
  label = "Upload an image",
  groupId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        setIsUploading(true);
        setError(null);

        const file = acceptedFiles[0];
        if (!file) return;

        console.log("Starting image upload with group ID:", groupId);

        const formData = new FormData();
        formData.append("file", file);
        
        // Always append the groupId if it exists, even if it's an empty string
        if (groupId) {
          console.log(`Adding file to group: ${groupId}`);
          formData.append("groupId", groupId);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success && result.url) {
          onChange(result.url, result.cid);
        } else {
          setError(result.message || "Failed to upload image.");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        setError("An error occurred during upload.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, groupId]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    disabled: isUploading || disabled,
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{label}</label>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-4 cursor-pointer
            transition-colors duration-200 min-h-[150px]
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
            ${!value ? "hover:border-primary" : ""}
          `}
        >
          <input {...getInputProps()} />
          {value ? (
            <div className="relative w-full h-[200px]">
              <Image
                src={value}
                alt="Uploaded image"
                className="object-contain rounded-md"
                fill
              />
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await onDelete();
                  } catch (error) {
                    console.error("Error deleting image:", error);
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-1 text-white"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500">
                Drag &apos;n&apos; drop an image here, or click to select one
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: .jpeg, .jpg, .png, .webp, .gif
              </p>
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ImageUpload; 
"use client";

import { useState, useEffect } from "react";
import GalleryUpload from "@/components/ui/gallery-upload";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CarouselImage {
  url: string;
  cid?: string;
}

export function CarouselManagement() {
  const [loading, setLoading] = useState(false);
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  
  // Pinata group ID for carousel images from environment variable
  const carouselGroupId = process.env.NEXT_PUBLIC_CAROUSEL_GROUP_ID || "";

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/carousel");
        const data = await response.json();
        if (response.ok) {
          setCarouselImages(data);
        } else {
          toast.error("Failed to fetch carousel images");
        }
      } catch (error) {
        console.error("Error fetching carousel:", error);
        toast.error("Failed to fetch carousel images");
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/carousel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: carouselImages }),
      });

      if (response.ok) {
        toast.success("Carousel images saved successfully");
      } else {
        toast.error("Failed to save carousel images");
      }
    } catch (error) {
      console.error("Error saving carousel:", error);
      toast.error("Failed to save carousel images");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Carousel Images</h3>
        <p className="text-sm text-muted-foreground">
          Upload and manage images for your store's carousel. Recommended size: 1920x1080px
        </p>
        <GalleryUpload
          value={carouselImages}
          onChange={setCarouselImages}
          disabled={loading}
          maxImages={5}
          label="Carousel Images"
          groupId={carouselGroupId}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
} 
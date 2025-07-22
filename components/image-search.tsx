"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Camera, Upload } from "lucide-react";
import { Product } from "@/lib/db";
import ProductCard from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";

export const ImageSearch = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [imageDescription, setImageDescription] = useState<string>("");
  const [keyTerms, setKeyTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for window resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const activateCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera");
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to file
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      setSelectedImage(file);
      setPreview(canvas.toDataURL("image/jpeg"));
      
      // Stop camera stream
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setIsCameraActive(false);
    }, "image/jpeg");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      
      const response = await fetch("/api/products/image-search", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to search for products");
      }
      
      const data = await response.json();
      setResults(data.matchedProducts);
      setImageDescription(data.imageDescription);
      setKeyTerms(data.keyTerms);
    } catch (err) {
      setError("An error occurred while searching for products");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col items-center">
        <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Search by Image</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 text-center">
          Upload or capture a product image to find similar items in our store
        </p>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 md:space-y-4">
          {!isCameraActive ? (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer text-sm md:text-base"
                />
              </div>
              
              <div className="flex justify-center">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={activateCamera}
                  className="flex items-center text-sm md:text-base w-full md:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <video 
                  ref={videoRef}
                  className="w-full h-48 md:h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
              
              <div className="flex justify-center space-x-2">
                <Button 
                  type="button"
                  onClick={captureImage}
                  variant="default"
                  className="flex-1 md:flex-none text-sm md:text-base"
                >
                  Capture
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    const stream = videoRef.current?.srcObject as MediaStream;
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                    setIsCameraActive(false);
                  }}
                  variant="outline"
                  className="flex-1 md:flex-none text-sm md:text-base"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {preview && (
            <div className="mt-3 md:mt-4">
              <Card>
                <CardContent className="p-2 md:p-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-auto max-h-48 md:max-h-64 object-contain"
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={!selectedImage || isLoading}
            className="w-full text-sm md:text-base py-2 md:py-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing image...
              </>
            ) : (
              "Search Products"
            )}
          </Button>
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>
      </div>
      
      {/* {imageDescription && (
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-muted rounded-lg">
          <h3 className="text-base md:text-lg font-semibold mb-2">AI Analysis</h3>
          <p className="text-xs md:text-sm">{imageDescription}</p>
          
          {keyTerms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 md:gap-2">
              {keyTerms.map((term, index) => (
                <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      )} */}
      
      {results.length > 0 && (
        <div className="mt-6 md:mt-8">
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Search Results</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
      
      {isLoading === false && results.length === 0 && preview && (
        <div className="text-center mt-6 md:mt-8">
          <p className="text-sm md:text-base text-muted-foreground">No matching products found</p>
        </div>
      )}
    </div>
  );
};

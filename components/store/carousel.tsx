"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarouselImage {
  url: string;
  cid?: string;
}

export function StoreCarousel() {
  const router = useRouter();
  const [images, setImages] = React.useState<CarouselImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [api, setApi] = React.useState<any>(null);
  const [showSwipeHint, setShowSwipeHint] = React.useState(true);

  // Handle click to navigate to products
  const handleCarouselClick = () => {
    router.push('/store/products');
  };

  // Auto-play functionality
  React.useEffect(() => {
    if (!api || !images.length) return;

    const autoPlayInterval = setInterval(() => {
      if (currentIndex === images.length - 1) {
        api.scrollTo(0);
      } else {
        api.scrollNext();
      }
    }, 4000); // 4 seconds

    return () => {
      clearInterval(autoPlayInterval);
    };
  }, [api, currentIndex, images.length]);

  // Update current index when the carousel slides
  React.useEffect(() => {
    if (!api) return;
    
    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
      // Hide swipe hint after user has interacted with carousel
      setShowSwipeHint(false);
    });
    
    return () => {
      api.off("select");
    };
  }, [api]);

  // Hide swipe hint after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const response = await fetch("/api/carousel");
        const data = await response.json();
        if (response.ok) {
          setImages(data);
        }
      } catch (error) {
        console.error("Error fetching carousel:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarouselImages();
  }, []);

  if (loading) {
    return (
      <div className="w-full aspect-[3/2] sm:aspect-[16/9] md:aspect-[21/9] bg-muted animate-pulse rounded-lg" />
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Carousel 
        setApi={setApi} 
        className="w-full"
        opts={{
          loop: true,
          align: "center",
          dragFree: false,
          containScroll: "keepSnaps",
          slidesToScroll: 1
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div 
                className="relative w-full aspect-[3/2] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-lg cursor-pointer"
                onClick={handleCarouselClick}
              >
                <Image
                  src={image.url}
                  alt={`Carousel image ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                
                {/* Mobile swipe hint animation */}
                {showSwipeHint && index === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none sm:hidden">
                    <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm animate-pulse">
                      Swipe to view more
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10" />
        <CarouselNext className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10" />
        
        {/* Swipe indicator for mobile */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 sm:hidden">
          {images.map((_, index) => (
            <span
              key={index}
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-primary/30"
              }`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
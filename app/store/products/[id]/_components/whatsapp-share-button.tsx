"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface WhatsAppShareButtonProps {
  productName: string;
  productPrice: number;
}

export default function WhatsAppShareButton({ productName, productPrice }: WhatsAppShareButtonProps) {
  const handleShare = () => {
    // Get current URL
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${productName} - ${formatCurrency(productPrice)}`);
    // Open WhatsApp share
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full bg-green-50 hover:bg-green-50 active:bg-green-50 text-green-600 hover:text-green-600 active:text-green-600"
      onClick={handleShare}
    >
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.373-12-12-12zm0 22.5c-5.799 0-10.5-4.701-10.5-10.5S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5z"/>
      </svg>
      <span className="sr-only">Share on WhatsApp</span>
    </Button>
  );
}

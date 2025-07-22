import { useState } from "react";

interface UseImageUploadProps {
  initialValue?: string;
}

interface ImageUploadResult {
  url: string;
  cid: string | null;
  setUrl: (url: string) => void;
  reset: () => void;
  handleDelete: () => Promise<boolean>;
  handleUpload: (url: string, newCid?: string) => void;
}

export const useImageUpload = ({ initialValue = "" }: UseImageUploadProps = {}): ImageUploadResult => {
  const [url, setUrl] = useState<string>(initialValue);
  const [cid, setCid] = useState<string | null>(null);

  const extractCidFromUrl = (url: string): string | null => {
    // Try to extract CID from gateway URL pattern
    // Example: https://amaranth-imaginative-mammal-401.mypinata.cloud/ipfs/bafkreidvbhs33ighmljlvr7zbv2ywwzcmp5adtf4kqvlly67cy56bdtmve
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      if (pathname.includes('/ipfs/')) {
        return pathname.split('/ipfs/')[1];
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleUpload = (newUrl: string, newCid?: string) => {
    setUrl(newUrl);
    setCid(newCid || extractCidFromUrl(newUrl));
  };

  const handleDelete = async (): Promise<boolean> => {
    // If we have a CID, try to delete from Pinata first
    if (cid) {
      try {
        console.log(`Attempting to delete image with CID: ${cid} from Pinata`);
        const response = await fetch("/api/upload/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cid }),
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error("Failed to delete from Pinata:", result.message);
          return false;
        }
        
        console.log("Successfully deleted image from Pinata");
      } catch (error) {
        console.error("Error deleting image:", error);
        return false;
      }
    } else if (url) {
      // If no CID but we have a URL, try to extract CID from URL
      const extractedCid = extractCidFromUrl(url);
      if (extractedCid) {
        try {
          console.log(`Extracted CID ${extractedCid} from URL, attempting to delete from Pinata`);
          const response = await fetch("/api/upload/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cid: extractedCid }),
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error("Failed to delete from Pinata:", result.message);
          } else {
            console.log("Successfully deleted image from Pinata using extracted CID");
          }
        } catch (error) {
          console.error("Error deleting image with extracted CID:", error);
        }
      }
    }
    
    // Reset the state regardless of deletion success
    reset();
    return true;
  };

  const reset = () => {
    setUrl("");
    setCid(null);
  };

  return {
    url,
    cid,
    setUrl,
    reset,
    handleDelete,
    handleUpload,
  };
}; 
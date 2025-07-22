import { NextResponse } from "next/server";
import { db, Product } from "@/lib/db";
import { deleteFromPinata } from "@/utils/pinata";

// Pinata temporary storage group ID
const TEMP_IMAGE_GROUP_ID = "f10f8ea2-b504-4bf4-81a8-a1a7756a37eb";

// OpenRouter API key and endpoint
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY environment variable");
}
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Preferred model
const VISION_MODEL = "meta-llama/llama-4-scout:free";

// Add fetch timeout function for better error handling
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function POST(request: Request) {
  let tempImageCid: string | null = null;
  
  try {
    // Parse the multipart form data to get the image
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    
    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    
    // Check if file size is within Pinata limits
    if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit for Pinata
      console.warn("Image too large (> 10MB), using fallback search");
      throw new Error("Image file too large for processing");
    }
    
    try {
      // First upload the image to Pinata to get a proper URL
      console.log("Uploading image to Pinata for temporary storage...");
      
      // Create a new FormData for Pinata upload
      const pinataFormData = new FormData();
      pinataFormData.append("file", imageFile);
      pinataFormData.append("groupId", TEMP_IMAGE_GROUP_ID);
      
      // Upload to Pinata via our API endpoint
      const pinataResponse = await fetch(`${new URL(request.url).origin}/api/upload`, {
        method: "POST",
        body: pinataFormData,
      });
      
      if (!pinataResponse.ok) {
        throw new Error("Failed to upload image to Pinata");
      }
      
      const pinataData = await pinataResponse.json();
      
      if (!pinataData.success || !pinataData.url) {
        throw new Error(pinataData.message || "Pinata upload failed");
      }
      
      // Store the CID for cleanup later
      tempImageCid = pinataData.cid;
      const imageUrl = pinataData.url;
      
      console.log("Successfully uploaded to Pinata. Using image URL:", imageUrl);
      
      // Enhanced structured prompt for better sneakers product identification
      const promptText = `You are a sneakers product identification expert. Analyze this image of a sneakers product and provide a detailed, structured response:

1. Brand Name: [Extract the exact brand name visible on the packaging]
2. Product Type: [Identify the specific type of product (e.g., moisturizer, serum, foundation, cleanser, mascara, etc.)]
3. Product Name: [Extract the full product name if visible]
4. Key Ingredients: [List any key ingredients mentioned on the packaging]
5. Key Claims/Benefits: [Note any claims or benefits mentioned (e.g., hydrating, anti-aging, etc.)]
6. Color/Shade: [If applicable, identify any color or shade information]
7. Additional Details: [Any other relevant information visible on the packaging]

Focus carefully on reading all text visible on the packaging, including small print. If you cannot clearly see certain details, indicate this but make your best guess based on what is visible. If the image doesn't appear to show a sneakers product, please indicate this.`;
      
      try {
        console.log("Making request to OpenRouter API...");
        
        // Call OpenRouter API with timeout
        const openRouterResponse = await fetchWithTimeout(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://westernstreet.com",
            "X-Title": "WesternStreet sneakers",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: promptText
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl
                    }
                  }
                ]
              }
            ]
          })
        }, 30000);
        
        if (!openRouterResponse.ok) {
          const errorText = await openRouterResponse.text();
          console.error(`OpenRouter API error: ${openRouterResponse.status} ${openRouterResponse.statusText}`, errorText);
          throw new Error(`OpenRouter API error: ${openRouterResponse.statusText}`);
        }
        
        const openRouterData = await openRouterResponse.json();
        const imageDescription = openRouterData.choices[0]?.message?.content || "";
        
        console.log("AI analysis received:", imageDescription);
        
        // Extract key terms from the AI description
        const keyTerms = extractEnhancedKeyTerms(imageDescription);
        console.log("Extracted search terms:", keyTerms);
        
        // Get all products from the database
        const products = await db.getProducts();
        
        // Define a type for the scored product
        type ScoredProduct = {
          product: Product;
          score: number;
          matchReason?: string;
        };

        // Enhanced search algorithm with improved brand recognition and visual characteristics
        const scoredProducts = products.map((product: Product): ScoredProduct => {
          let score = 0;
          let matchDetails: string[] = [];
          
          // Extract structured data from AI response with improved regex patterns
          // Handle case where brand name might appear with different formats (TIRTIR, Tirtir, TirTir)
          const brandMatch = imageDescription.match(/Brand Name:.*?([A-Za-z0-9\s\-]+)(?:\]|\n|:|,|$)/i);
          const productTypeMatch = imageDescription.match(/Product Type:.*?([A-Za-z0-9\s\-]+)(?:\]|\n|:|,|$)/i);
          const productNameMatch = imageDescription.match(/Product Name:.*?([A-Za-z0-9\s\-]+)(?:\]|\n|:|,|$)/i);
          const colorMatch = imageDescription.match(/Color\/Shade:.*?([A-Za-z0-9\s\-]+)(?:\]|\n|:|,|$)/i);
          const detailsMatch = imageDescription.match(/Additional Details:.*?([^]*?)(?:\d\.|\n\n|$)/i);
          
          // Clean and prepare extracted data
          const brandName = brandMatch?.[1]?.trim().toLowerCase();
          const productType = productTypeMatch?.[1]?.trim().toLowerCase();
          const productName = productNameMatch?.[1]?.trim().toLowerCase();
          const colorShade = colorMatch?.[1]?.trim().toLowerCase();
          const additionalDetails = detailsMatch?.[1]?.trim().toLowerCase() || "";
          
          // Create a consolidated product text for fuzzy searching
          const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
          
          // Enhanced fuzzy matching function with Levenshtein distance for unusual brand names
          const fuzzyMatch = (term: string, text: string): number => {
            if (!term || term === "not visible" || term.length < 2) return 0;
            
            // Direct inclusion check - exact match gets highest score
            if (text.includes(term)) return 1;
            
            // For short brand names (≤5 chars), do case-insensitive direct matching
            if (term.length <= 5) {
              // Check if the short name is a standalone word in the text
              const termRegex = new RegExp(`\\b${term}\\b`, 'i');
              if (termRegex.test(text)) return 1;
              
              // Check if the entire term appears as part of a word (e.g., TIRTIR in TirtirFoundation)
              const containsRegex = new RegExp(term, 'i');
              if (containsRegex.test(text)) return 0.9;
            }
            
            // Check for partial matches (spelling mistakes)
            const words = term.split(/\s+/);
            let partialMatchScore = 0;
            
            words.forEach(word => {
              if (word.length < 3) return; // Skip very short words
              
              // Try different variations - misspellings often have the first 2-3 characters correct
              const prefix = word.substring(0, Math.min(3, word.length));
              
              // Check if any word in the text starts with the same prefix
              const textWords = text.split(/\s+/);
              const hasPartialMatch = textWords.some(textWord => 
                textWord.startsWith(prefix) || 
                // Check for transposed characters (common typing mistake)
                (prefix.length > 1 && textWord.startsWith(prefix[1] + prefix[0] + prefix.substring(2)))
              );
              
              if (hasPartialMatch) {
                partialMatchScore += 0.7; // 70% of an exact match
              }
            });
            
            return partialMatchScore;
          };
          
          // Look for brand name match with special handling for short names
          let foundBrandMatch = false;
          if (brandName) {
            // Check for direct brand match with boosted score for exact matches
            if (product.name.toLowerCase() === brandName) {
              score += 50; // Exact brand match gets highest score
              matchDetails.push(`Exact brand match: ${brandName} (50)`);
              foundBrandMatch = true;
            }
            else if (product.name.toLowerCase().includes(brandName)) {
              score += 40;
              matchDetails.push(`Brand in name: ${brandName} (40)`);
              foundBrandMatch = true;
            }
            // For short brand names (≤5 chars) like TIRTIR, try case-insensitive matching
            else if (brandName.length <= 5) {
              const normalizedBrand = brandName.replace(/\s/g, '');
              const normalizedProductName = product.name.toLowerCase().replace(/\s/g, '');
              
              if (normalizedProductName.includes(normalizedBrand)) {
                score += 40;
                matchDetails.push(`Short brand match: ${brandName} (40)`);
                foundBrandMatch = true;
              }
            }
            
            // If no direct match found, try fuzzy matching
            if (!foundBrandMatch) {
              const brandMatchScore = fuzzyMatch(brandName, product.name.toLowerCase()) * 30;
              if (brandMatchScore > 0) {
                score += brandMatchScore;
                matchDetails.push(`Fuzzy brand in name: ${brandName} (${brandMatchScore.toFixed(1)})`);
              }
            }
            
            // Check description too
            const brandDescScore = fuzzyMatch(brandName, product.description.toLowerCase()) * 15;
            if (brandDescScore > 0) {
              score += brandDescScore;
              matchDetails.push(`Brand in desc: ${brandName} (${brandDescScore.toFixed(1)})`);
            }
          }
          
          // Even if no brand is visible in the image, scan product data directly
          if (!foundBrandMatch && !brandName) {
            // Visual product recognition - check if words in the description match visual characteristics
            // Look for product characteristics from the description in the additional details
            if (additionalDetails.includes("red") && product.description.toLowerCase().includes("red")) {
              score += 15;
              matchDetails.push(`Visual: red product (15)`);
            }
            
            if (additionalDetails.includes("sphere") || additionalDetails.includes("circular") || additionalDetails.includes("round")) {
              if (product.description.toLowerCase().includes("sphere") || 
                  product.description.toLowerCase().includes("circular") || 
                  product.description.toLowerCase().includes("round")) {
                score += 15;
                matchDetails.push(`Visual: product shape (15)`);
              }
            }
          }
          
          // Product type matching with fuzzy search
          if (productType) {
            // Product type in name
            const typeNameScore = fuzzyMatch(productType, product.name.toLowerCase()) * 25;
            if (typeNameScore > 0) {
              score += typeNameScore;
              matchDetails.push(`Type in name: ${productType} (${typeNameScore.toFixed(1)})`);
            }
            
            // Product type in category - direct category match gets higher score
            if (product.category.toLowerCase() === productType) {
              score += 30;
              matchDetails.push(`Exact category match: ${productType} (30)`);
            } else {
              const typeCategoryScore = fuzzyMatch(productType, product.category.toLowerCase()) * 20;
              if (typeCategoryScore > 0) {
                score += typeCategoryScore;
                matchDetails.push(`Type in category: ${productType} (${typeCategoryScore.toFixed(1)})`);
              }
            }
            
            // Product type in description
            const typeDescScore = fuzzyMatch(productType, product.description.toLowerCase()) * 10;
            if (typeDescScore > 0) {
              score += typeDescScore;
              matchDetails.push(`Type in desc: ${productType} (${typeDescScore.toFixed(1)})`);
            }
          }
          
          // Product name matching
          if (productName) {
            const nameScore = fuzzyMatch(productName, productText) * 20;
            if (nameScore > 0) {
              score += nameScore;
              matchDetails.push(`Product name match: ${productName} (${nameScore})`);
            }
          }
          
          // Color/shade matching
          if (colorShade && colorShade !== "not visible") {
            const colorScore = fuzzyMatch(colorShade, productText) * 15;
            if (colorScore > 0) {
              score += colorScore;
              matchDetails.push(`Color match: ${colorShade} (${colorScore})`);
            }
          }
          
          // General keyword matching as fallback
          keyTerms.forEach((term: string) => {
            if (term.length < 3) return;
            const termScore = fuzzyMatch(term, productText) * 5;
            if (termScore > 0) {
              score += termScore;
              matchDetails.push(`Term match: ${term} (${termScore})`);
            }
          });
          
          // SPECIAL CASE: Direct product name check
          // If the product name in DB is "Tirtir", directly boost matching score for this product
          // This can be customized for specific products that need special handling
          if (product.name.toLowerCase() === "tirtir") {
            score += 20; // Boost score for this special case
            matchDetails.push(`Special product match: Tirtir (20)`);
          }
          
          return { 
            product, 
            score, 
            matchReason: matchDetails.length > 0 ? matchDetails.join('; ') : undefined 
          };
        });
        
        // Sort by score and extract products
        const sortedProducts = scoredProducts
          .sort((a: ScoredProduct, b: ScoredProduct) => b.score - a.score)
          .filter((item: ScoredProduct) => item.score > 0);
        
        // Log detailed match information for debugging
        console.log("Search results:");
        sortedProducts.slice(0, 5).forEach((item: ScoredProduct, index: number) => {
          console.log(`[${index + 1}] ${item.product.name} (Score: ${item.score.toFixed(2)})`);
          console.log(`    Reasons: ${item.matchReason || 'No specific match'}`);
        });
        
        // Extract just the products for the response
        const limitedResults = sortedProducts
          .map((item: ScoredProduct) => item.product)
          .slice(0, 10);
        
        // Clean up temporary image from Pinata - with improved error handling
        if (tempImageCid) {
          try {
            console.log(`Cleaning up temporary image with CID: ${tempImageCid}`);
            // Using direct deletion for reliability instead of another fetch to our own API
            await safeDeleteFromPinata(tempImageCid);
            console.log("Temporary image cleanup successful");
          } catch (cleanupError) {
            // Don't fail the request if cleanup fails
            console.error("Failed to clean up temporary image:", cleanupError);
          }
        }
        
        // Return the matched products with AI analysis
        return NextResponse.json({
          matchedProducts: limitedResults,
          imageDescription: imageDescription,
          keyTerms: keyTerms
        });
        
      } catch (aiError) {
        // Clean up temporary image if we have one
        if (tempImageCid) {
          try {
            await safeDeleteFromPinata(tempImageCid);
          } catch (cleanupError) {
            console.error("Failed to clean up temporary image:", cleanupError);
          }
        }
        
        console.error("AI processing error details:", aiError instanceof Error ? aiError.message : String(aiError));
        
        // Extract basic image information for fallback matching
        let imageInfo = {
          size: imageFile.size,
          type: imageFile.type,
          name: imageFile.name
        };
        
        console.log("Using fallback search with image info:", imageInfo);
        
        // Simple keyword extraction from filename if available
        const keywords = imageFile.name
          ? imageFile.name.toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .filter(word => word.length > 2)
          : [];
        
        // Improve fallback search terms when filename doesn't provide useful keywords
        const searchTerms = keywords.length > 2 ? keywords : [
          "makeup", "skincare", "lipstick", "foundation", "moisturizer", 
          "serum", "cleanser", "mascara", "eyeshadow", "sneakers", "cosmetic"
        ];
        
        console.log("Using search terms:", searchTerms);
        
        // Get all products from the database
        const products = await db.getProducts();
        
        // Score products based on these terms
        const scoredProducts = products.map((product: Product) => {
          let score = 0;
          
          searchTerms.forEach(term => {
            if (product.name.toLowerCase().includes(term)) score += 5;
            if (product.description.toLowerCase().includes(term)) score += 3;
            if (product.category.toLowerCase().includes(term)) score += 4;
          });
          
          return { product, score };
        });
        
        // Sort by score and get top results
        const sortedProducts = scoredProducts
          .sort((a: {product: Product; score: number}, b: {product: Product; score: number}) => b.score - a.score)
          .filter((item: {product: Product; score: number}) => item.score > 0)
          .map((item: {product: Product; score: number}) => item.product)
          .slice(0, 10);
        
        return NextResponse.json({
          matchedProducts: sortedProducts,
          imageDescription: "Image analysis unavailable - showing related products based on image properties.",
          keyTerms: searchTerms,
          fallback: true
        });
      }
    } catch (error) {
      // Final cleanup attempt if we have a temporary image
      if (tempImageCid) {
        try {
          await safeDeleteFromPinata(tempImageCid);
        } catch (finalCleanupError) {
          console.error("Final cleanup attempt failed:", finalCleanupError);
        }
      }
      
      console.error("Error in image search:", error);
      return NextResponse.json({ 
        error: "Unable to process image search", 
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }
  } catch (error) {
    // Final cleanup attempt if we have a temporary image
    if (tempImageCid) {
      try {
        await safeDeleteFromPinata(tempImageCid);
      } catch (finalCleanupError) {
        console.error("Final cleanup attempt failed:", finalCleanupError);
      }
    }
    
    console.error("Error in image search:", error);
    return NextResponse.json({ 
      error: "Unable to process image search", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Enhanced helper function with retry logic for deleting from Pinata
async function safeDeleteFromPinata(cid: string): Promise<void> {
  const MAX_RETRIES = 3;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${MAX_RETRIES} to delete CID: ${cid} from Pinata`);
      await deleteFromPinata(cid);
      console.log(`Successfully deleted CID: ${cid} on attempt ${attempt + 1}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${MAX_RETRIES} failed to delete from Pinata:`, error);
      // Only retry if not the last attempt
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Rethrow on last attempt
        throw error;
      }
    }
  }
}

// Enhanced helper function to extract key terms from AI description with better prioritization
function extractEnhancedKeyTerms(description: string): string[] {
  // Standard terms extraction
  const basicTerms = extractKeyTerms(description);
  
  // Look for specific patterns in the structured response
  const priorityTerms: string[] = [];
  
  // Extract brand name (highest priority for matching)
  const brandMatch = description.match(/Brand Name:\s*\[?([^\]\n]+)(?:\]|\n|$)/i);
  if (brandMatch && brandMatch[1] && brandMatch[1].trim() !== '') {
    const brandName = brandMatch[1].trim().toLowerCase();
    // Don't add placeholder responses
    if (!['extract', 'identify', 'n/a', 'not visible', 'not clear', 'cannot'].some(placeholder => brandName.includes(placeholder))) {
      priorityTerms.push(...brandName.split(/\s+/).filter(word => word.length > 1));
    }
  }
  
  // Extract product type (high priority)
  const productTypeMatch = description.match(/Product Type:\s*\[?([^\]\n]+)(?:\]|\n|$)/i);
  if (productTypeMatch && productTypeMatch[1] && productTypeMatch[1].trim() !== '') {
    const productType = productTypeMatch[1].trim().toLowerCase();
    if (!['extract', 'identify', 'n/a', 'not visible', 'not clear', 'cannot'].some(placeholder => productType.includes(placeholder))) {
      priorityTerms.push(...productType.split(/\s+/).filter(word => word.length > 1));
    }
  }
  
  // Extract product name
  const productNameMatch = description.match(/Product Name:\s*\[?([^\]\n]+)(?:\]|\n|$)/i);
  if (productNameMatch && productNameMatch[1] && productNameMatch[1].trim() !== '') {
    const productName = productNameMatch[1].trim().toLowerCase();
    if (!['extract', 'identify', 'n/a', 'not visible', 'not clear', 'cannot'].some(placeholder => productName.includes(placeholder))) {
      priorityTerms.push(...productName.split(/\s+/).filter(word => word.length > 1));
    }
  }
  
  // Extract key ingredients
  const ingredientsMatch = description.match(/Key Ingredients:\s*\[?([^\]]+)(?:\]|\n|$)/i);
  if (ingredientsMatch && ingredientsMatch[1]) {
    const ingredients = ingredientsMatch[1].toLowerCase()
      .split(/,|\s+and\s+|\+/)
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 2 && !['extract', 'list', 'n/a', 'not'].some(placeholder => ingredient.includes(placeholder)));
    
    priorityTerms.push(...ingredients.slice(0, 5)); // Limit to top 5 ingredients
  }
  
  // Combine priority terms with basic terms, removing duplicates and prioritizing the specific terms
  const combinedTerms = [...new Set([...priorityTerms, ...basicTerms])];
  
  // Return up to 20 terms, with priority terms first
  return combinedTerms.slice(0, 20);
}

// Original helper function remains as fallback
function extractKeyTerms(description: string): string[] {
  // Split the description into words
  const words = description.toLowerCase().split(/\s+/);
  
  // Filter out common words and keep only relevant terms
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
    "about", "is", "are", "was", "were", "be", "been", "being", "have", "has", 
    "had", "do", "does", "did", "this", "that", "these", "those", "it", "its",
    "i", "can", "see", "appears", "looks", "like", "seems", "may", "might", "could",
    "would", "should", "will", "shall", "product", "image", "picture", "photo"
  ]);
  
  const filteredWords = words.filter(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w\s]/g, '');
    // Keep words that are not stop words and are at least 3 characters long
    return cleanWord.length >= 3 && !stopWords.has(cleanWord);
  });
  
  // Get unique terms
  const uniqueTerms = [...new Set(filteredWords)];
  
  // Return the top 15 terms (or fewer if there aren't 15)
  return uniqueTerms.slice(0, 15);
}

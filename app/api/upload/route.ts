import { NextRequest, NextResponse } from "next/server";

// Log environment variables for debugging
console.log("API Upload Route - Environment Variables:", {
  jwtAvailable: !!process.env.PINATA_JWT,
  gatewayAvailable: !!process.env.NEXT_PUBLIC_GATEWAY_URL,
  gateway: process.env.NEXT_PUBLIC_GATEWAY_URL
});

// Helper function to create gateway URL
function createGatewayUrl(cid: string): string {
  if (!cid) {
    console.warn("createGatewayUrl called with empty CID, returning placeholder");
    return "/placeholder.svg";
  }
  
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || '';
  if (!gateway) {
    console.warn("NEXT_PUBLIC_GATEWAY_URL is not set or empty");
  }
  
  const url = `https://${gateway}/ipfs/${cid}`;
  console.log(`Created gateway URL for CID ${cid}: ${url}`);
  return url;
}

export const maxDuration = 60; // Maximum duration for the API route (in seconds)

export async function POST(req: NextRequest) {
  console.log("Upload API called");
  
  try {
    console.log("Parsing form data...");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string || undefined;
    
    console.log("Form data parsed:", {
      fileReceived: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      groupId
    });

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Get file type and check if it's allowed
    const fileType = file.type;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        success: false, 
        message: "File type not allowed. Only JPEG, PNG, WebP, and GIF are supported." 
      }, { status: 400 });
    }

    // Convert File to Buffer for Pinata upload
    console.log("Converting file to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a new FormData for direct API call
    console.log("Creating FormData for Pinata API...");
    const pinataFormData = new FormData();
    
    // Create a new File instance from the buffer
    const pinataFile = new File([buffer], file.name, { type: file.type });
    pinataFormData.append("file", pinataFile);
    
    // Add pinataMetadata
    const metadata = JSON.stringify({
      name: file.name,
    });
    pinataFormData.append("pinataMetadata", metadata);
    
    // Add pinataOptions
    const options = JSON.stringify({
      cidVersion: 1
    });
    pinataFormData.append("pinataOptions", options);
    
    // Add to group if groupId is provided
    if (groupId) {
      console.log(`Adding to group: ${groupId}`);
      
      // For Pinata API, we need to use a specific endpoint for adding to a group
      // We'll use the dedicated group endpoint after the initial upload
    }
    
    // Execute the upload using fetch directly
    console.log("Executing Pinata upload via direct API call...");
    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PINATA_JWT}`
      },
      body: pinataFormData
    });
    
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error("Pinata API error:", {
        status: pinataResponse.status,
        statusText: pinataResponse.statusText,
        errorText
      });
      throw new Error(`Pinata API error: ${pinataResponse.status} ${pinataResponse.statusText} - ${errorText}`);
    }
    
    const upload = await pinataResponse.json();
    console.log("Pinata upload successful:", upload);
    
    // If groupId is provided, add the file to the specified group
    if (groupId) {
      try {
        console.log(`Adding file with CID ${upload.IpfsHash} to group ${groupId}...`);
        
        // Verify that the JWT token is available
        const jwt = process.env.PINATA_JWT;
        if (!jwt) {
          console.error("PINATA_JWT is not available in environment variables");
          throw new Error("PINATA_JWT is not available");
        }
        
        // Use the metadata approach to associate the file with a group
        // This works with the free Pinata plan
        console.log("Adding to group via metadata update...");
        
        const updateMetadataResponse = await fetch(`https://api.pinata.cloud/pinning/hashMetadata`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ipfsPinHash: upload.IpfsHash,
            name: file.name,
            keyvalues: {
              groupId: groupId
            }
          })
        });
        
        console.log("Metadata update response status:", updateMetadataResponse.status);
        
        if (!updateMetadataResponse.ok) {
          const metadataErrorText = await updateMetadataResponse.text();
          console.error(`Failed to update metadata with group: ${metadataErrorText}`);
        } else {
          console.log("Successfully updated metadata with group information");
        }
      } catch (groupError) {
        console.error("Error adding to group (continuing anyway):", groupError);
        // We don't throw here as the upload was successful, just the group assignment failed
      }
    }
    
    // Generate gateway URL
    console.log("Generating gateway URL...");
    const url = createGatewayUrl(upload.IpfsHash);

    const response = {
      success: true,
      cid: upload.IpfsHash,
      name: file.name,
      url: url
    };
    
    console.log("Returning successful response:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.log("Returning error response:", { success: false, message: errorMessage });
    
    // Return a more user-friendly error message
    return NextResponse.json({ 
      success: false, 
      message: "Failed to upload image. Please try again or contact support if the issue persists.",
      technicalDetails: errorMessage 
    }, { status: 500 });
  }
} 
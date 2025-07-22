/**
 * Utility for uploading multiple images to Pinata
 */

interface UploadResult {
  success: boolean;
  url?: string;
  cid?: string;
  error?: string;
}

/**
 * Uploads multiple files to Pinata and returns the results
 * @param files Array of files to upload
 * @param groupId Optional Pinata group ID to add files to
 * @returns Promise with array of upload results
 */
export const uploadMultipleImages = async (
  files: File[],
  groupId?: string
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  // Upload files sequentially to avoid overwhelming the server
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Add groupId to formData if provided
      if (groupId) {
        formData.append("groupId", groupId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        results.push({
          success: true,
          url: result.url,
          cid: result.cid,
        });
      } else {
        results.push({
          success: false,
          error: result.message || "Failed to upload image",
        });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  return results;
};

/**
 * Deletes multiple files from Pinata
 * @param cids Array of CIDs to delete
 * @returns Promise with success status
 */
export const deleteMultipleImages = async (cids: string[]): Promise<boolean> => {
  try {
    // Filter out any null/undefined/empty values
    const validCids = cids.filter(cid => !!cid);
    
    if (validCids.length === 0) {
      return true;
    }

    // Delete images sequentially
    for (const cid of validCids) {
      await fetch("/api/upload/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid }),
      });
    }

    return true;
  } catch (error) {
    console.error("Error deleting images:", error);
    return false;
  }
}; 
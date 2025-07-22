# Pinata Integration for sneakersStore

This document explains how Pinata is integrated into the sneakersStore project for content and image storage.

## Overview

Pinata is an IPFS (InterPlanetary File System) pinning service that allows for decentralized file storage. In this project, it's used to store product images and other content.

## Setup

1. **Install the Pinata SDK:**
   ```bash
   npm install pinata --legacy-peer-deps
   ```

2. **Environment Variables:**
   Add the following to your `.env.local` file:
   ```
   PINATA_JWT=your_pinata_jwt_here
   PINATA_GATEWAY=your_gateway_domain_here
   ```
   
   You can get these values from your Pinata account. The Gateway domain should look like `example-gateway.mypinata.cloud`.

## Components

### 1. Pinata Configuration (`utils/pinata.ts`)

This file initializes the Pinata SDK and provides utility functions for file operations:
- uploadToPinata: Upload a file to Pinata
- getFromPinata: Retrieve a file from Pinata
- createGatewayUrl: Create a URL for a file
- deleteFromPinata: Delete a file from Pinata

### 2. Image Upload Component (`components/ui/image-upload.tsx`)

A reusable component for uploading a single image. Features include:
- Drag and drop functionality
- Preview of uploaded image
- Delete functionality
- Loading states

### 3. Gallery Upload Component (`components/ui/gallery-upload.tsx`)

A component for uploading multiple images for product galleries:
- Grid display of uploaded images
- Add/remove individual images
- Maximum image limit

### 4. API Routes

- `/api/upload`: Handles secure server-side file uploads to Pinata
- `/api/upload/delete`: Handles file deletion from Pinata

### 5. Custom Hook (`hooks/use-image-upload.ts`)

A hook to simplify image upload state management in forms.

### 6. Multiple Upload Utility (`utils/multiple-upload.ts`)

Functions for handling multiple file uploads and deletions.

## Usage Example

```tsx
// Import the component
import ImageUpload from "@/components/ui/image-upload";
import { useImageUpload } from "@/hooks/use-image-upload";

// In your component
const { url, handleUpload, handleDelete } = useImageUpload();

// In your JSX
<ImageUpload
  value={url}
  onChange={(newUrl, cid) => handleUpload(newUrl, cid)}
  onDelete={handleDelete}
/>
```

For gallery uploads, use the `GalleryUpload` component:

```tsx
// Import the component
import GalleryUpload from "@/components/ui/gallery-upload";

// In your component
const [gallery, setGallery] = useState([]);

// In your JSX
<GalleryUpload
  value={gallery}
  onChange={setGallery}
  maxImages={5}
/>
```

## Best Practices

1. Always implement server-side validation for file uploads
2. Store CIDs along with URLs for deletion capability
3. Handle loading and error states for better UX
4. Delete unused files to manage storage costs
5. Set appropriate file type and size limits

## API Reference

For more information about Pinata's API and SDK, refer to the [official documentation](https://docs.pinata.cloud/sdk/getting-started). 

import { ImageSearch } from "@/components/image-search";

export const metadata = {
  title: "Search by Image | WesternStreet",
  description: "Find products by uploading or taking a photo",
};

export default function ImageSearchPage() {
  return (
    <div className="container mx-auto py-8">
      <ImageSearch />
    </div>
  );
}

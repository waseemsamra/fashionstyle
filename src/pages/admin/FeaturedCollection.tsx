// FeaturedCollection.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function FeaturedCollection() {
  return (
    <CollectionManager 
      collectionId="featuredCollection"
      collectionName="Featured Collection"
      maxProducts={20}
      description="Select up to 20 products to feature in the Featured Collection carousel on the home page"
    />
  );
}

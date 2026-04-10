// WeddingTalesCMS.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function WeddingTalesCMS() {
  return (
    <CollectionManager 
      collectionId="weddingTales"
      collectionName="Wedding Tales"
      maxProducts={20}
      description="Select up to 20 products to feature in the Wedding Tales section on the home page"
    />
  );
}

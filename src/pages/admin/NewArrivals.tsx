// NewArrivals.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function NewArrivals() {
  return (
    <CollectionManager 
      collectionId="newArrivals"
      collectionName="New Arrivals"
      maxProducts={10}
      description="Select up to 10 products to feature in the New Arrivals section on the home page"
    />
  );
}

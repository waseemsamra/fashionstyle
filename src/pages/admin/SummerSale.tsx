// SummerSale.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function SummerSale() {
  return (
    <CollectionManager 
      collectionId="summerSale"
      collectionName="Summer Sale"
      maxProducts={15}
      description="Select up to 15 products to feature in the Summer Sale section"
    />
  );
}

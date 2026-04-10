// DesignersDiscountCMS.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function DesignersDiscountCMS() {
  return (
    <CollectionManager 
      collectionId="designersDiscount"
      collectionName="Designers On Discount"
      maxProducts={8}
      description="Select up to 8 products to feature in the Designers On Discount section on the home page"
    />
  );
}

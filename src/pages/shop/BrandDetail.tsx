import { useParams } from 'react-router-dom';
import { useBrands } from '@/hooks/useBrands';
import { Loader2 } from 'lucide-react';

export default function BrandDetailPage() {
  const { slug } = useParams();
  const { brands, loading } = useBrands();
  
  // Find brand by slug
  const brand = brands.find(b => b.slug === slug);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Brand not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <h1>{brand.name}</h1>
      <p>{brand.description}</p>
      {/* Products will be loaded separately */}
    </div>
  );
}

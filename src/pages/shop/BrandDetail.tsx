import { useParams } from 'react-router-dom';
import { useBrand, useBrandProducts } from '@/hooks/useBrands';
import ProductCard from '@/components/products/ProductCard';
import { Loader2, Package, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BrandDetailPage() {
  const { slug } = useParams();
  const { brand, isLoading: brandLoading, isError: brandError } = useBrand(slug);
  const { products, isLoading: productsLoading } = useBrandProducts(brand?.name);

  if (brandLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (brandError || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Brand not found</h2>
        <p className="text-gray-600 mb-4">This brand may have been removed or doesn't exist</p>
        <Link to="/brands" className="text-gold hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          View all brands
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Cover Image */}
      <div className="relative h-80 bg-gradient-to-r from-gold/30 to-gold/10">
        <img
          src={brand.coverImage}
          alt={brand.name}
          className="w-full h-full object-cover opacity-30"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <Link to="/brands" className="inline-flex items-center text-gold hover:underline mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Brands
            </Link>
            <div className="flex items-center gap-6">
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-24 h-24 rounded-full bg-white p-2 shadow-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/96x96/333333/ffffff?text=${brand.name.charAt(0)}`;
                }}
              />
              <div>
                <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
                <p className="text-lg text-gray-700 max-w-2xl">{brand.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold" />
                    <span>{brand.productCount} Products</span>
                  </div>
                  {brand.isFeatured && (
                    <span className="bg-gold text-white px-3 py-1 rounded-full text-sm">
                      Featured Brand
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Products from {brand.name}</h2>
        
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">No products found for this brand.</p>
        )}
      </div>
    </div>
  );
}

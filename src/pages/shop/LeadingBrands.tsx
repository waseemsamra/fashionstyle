import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductUrl } from '@/utils/productUrl';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function LeadingBrandsShop() {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const data = await api.getAllProducts();
        if (isMounted) {
          const items = (data.items || []);
          setProducts(items);
          const brandList = Array.from(new Set(items.filter((p: any) => p.isLeadingBrands).map((p: any) => p.brand).filter(Boolean))) as string[];
          setBrands(brandList);
          if (brandList.length > 0) setSelectedBrand(brandList[0]);
        }
      } catch (error) {
        console.error('Failed to load leading brands:', error);
        if (isMounted) setProducts([]);
      }
    };
    fetchProducts();
    return () => { isMounted = false };
  }, []);

  const leadingProducts = useMemo(() => {
    return products.filter((p: any) => p.isLeadingBrands);
  }, [products]);

  const brandProducts = useMemo(() => {
    return leadingProducts.filter((p: any) => p.brand === selectedBrand);
  }, [leadingProducts, selectedBrand]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'View Cart',
        onClick: () => setIsCartOpen(true),
      },
    });
  };

  if (leadingProducts.length === 0) {
    return (
      <div className="min-h-screen bg-beige-100 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-2">Leading Brands</h1>
            <p className="text-gray-500">No products found in this collection.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leading Brands</h1>
          <p className="text-gray-600">
            Discover products from our leading brand partners - {leadingProducts.length} products
          </p>
        </div>

        {/* Brand Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 ${
                  selectedBrand === brand
                    ? 'bg-gold text-white shadow-lg'
                    : 'bg-white text-black hover:bg-gold/10 hover:text-gold shadow-sm'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
            >
              <div
                className="relative aspect-[3/4] overflow-hidden cursor-pointer"
                onClick={() => navigate(getProductUrl(product))}
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => handleImageError(e, product.name)}
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                  {product.isSale && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      Sale
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full py-3 bg-black text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-500 text-xs uppercase mb-1">{product.brand}</p>
                <h3
                  onClick={() => navigate(getProductUrl(product))}
                  className="font-semibold text-lg mb-2 cursor-pointer hover:text-gold transition"
                >
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-gold fill-gold'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-gray-400 line-through text-sm">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

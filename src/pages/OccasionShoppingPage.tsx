import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import OccasionShopping from '@/components/features/OccasionShopping';
import { getAllProducts } from '@/services/productService';
import { useAddToCart } from '@/hooks/useCart';

export default function OccasionShoppingPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useAddToCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart.mutate({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        quantity,
      });
      toast.success('Added to cart!');
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading occasion collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        <OccasionShopping
          products={products}
          onAddToCart={handleAddToCart}
          onViewProduct={handleViewProduct}
        />
      </div>
    </div>
  );
}

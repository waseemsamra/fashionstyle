import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { featuredProducts, newArrivals } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const allProducts = [...featuredProducts, ...newArrivals];
  const product = allProducts.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-lg shadow-lg p-8">
          <div>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-gray-500 uppercase">{product.category}</span>
              <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
            </div>

            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.rating})</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">${product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {product.isSale && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  Sale
                </span>
              )}
              {product.isNew && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  New
                </span>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-gray-600">
                Experience the perfect blend of traditional craftsmanship and modern design. 
                This exquisite piece features intricate embroidery work and premium quality fabric 
                that ensures both comfort and elegance. Perfect for any special occasion.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Features</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Premium quality fabric</li>
                <li>Intricate embroidery work</li>
                <li>Comfortable fit</li>
                <li>Easy to maintain</li>
                <li>Available in multiple sizes</li>
              </ul>
            </div>

            <Button 
              onClick={handleAddToCart}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

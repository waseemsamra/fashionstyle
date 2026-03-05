import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getProductIdFromSlug } from '@/utils/productUrl';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const productId = getProductIdFromSlug(slug);

  const normalizeId = (value: unknown) =>
    String(value ?? '')
      .replace(/^PRODUCT#/i, '')
      .trim();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    const findFromList = async (requestedId: string) => {
      const listData = await api.listProducts();
      const listItems = Array.isArray(listData?.items) ? listData.items : [];
      return (
        listItems.find((p: any) => {
          const id = normalizeId(p?.id);
          const pk = normalizeId(p?.PK);
          return id === requestedId || pk === requestedId;
        }) || null
      );
    };

    const fetchProduct = async () => {
      const requestedId = normalizeId(productId);

      try {
        setLoading(true);
        let directProduct: any = null;

        try {
          const data = await api.getProduct(requestedId);
          directProduct = data?.item || data?.product || data;
        } catch (error) {
          // Some environments currently return 500 for /products/:id.
          // We'll fallback to list endpoint below.
          console.warn('Direct product endpoint failed, using list fallback.', error);
        }

        if (directProduct?.id || directProduct?.PK) {
          if (isMounted) {
            setProduct(directProduct);
          }
          return;
        }

        const match = await findFromList(requestedId);

        if (isMounted) {
          setProduct(match || null);
        }
      } catch (error) {
        console.error('Failed to load product details:', error);
        if (isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setProduct(null);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

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

  const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

  const detailGroups = [
    { label: 'Occasions', values: asList(product.occasions) },
    { label: 'Patterns', values: asList(product.patterns) },
    { label: 'Sizes', values: asList(product.sizes) },
    { label: 'Cloth Materials', values: asList(product.materials) },
    { label: 'Colours', values: asList(product.colors) },
  ].filter((group) => group.values.length > 0);

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
              <p className="text-sm text-gray-600 mt-1">Product ID: {product.id || product.PK}</p>
              {product.brand && (
                <p className="text-sm text-gray-600 mt-1">Brand: {product.brand}</p>
              )}
            </div>

            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(Number(product.rating || 0))
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
                {product.description ||
                  'Experience the perfect blend of traditional craftsmanship and modern design.'}
              </p>
            </div>

            {detailGroups.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Product Details</h3>
                <div className="space-y-3">
                  {detailGroups.map((group) => (
                    <div key={group.label}>
                      <p className="text-sm font-medium text-gray-700 mb-2">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.values.map((value) => (
                          <span key={`${group.label}-${value}`} className="px-3 py-1 rounded-full bg-beige-100 text-sm text-gray-700">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useProduct } from '@/hooks/useProducts';
import { getProductIdFromSlug } from '@/utils/productUrl';
import LazyImage from '@/components/ui/LazyImage';
import VirtualTryOn from '@/components/features/VirtualTryOn';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState<'inch' | 'cm'>('cm');
  const [sizeGuideTab, setSizeGuideTab] = useState<'size' | 'measuring' | 'how-to-measure'>('size');
  const productId = getProductIdFromSlug(slug);

  // Use React Query with caching
  const { data: product, isLoading, error } = useProduct(productId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Show minimal loading state without spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container-custom py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image placeholder */}
            <div className="aspect-[3/4] bg-beige-100 rounded-lg" />
            {/* Content placeholder */}
            <div className="space-y-4 py-8">
              <div className="h-8 bg-beige-100 rounded w-3/4" />
              <div className="h-6 bg-beige-100 rounded w-1/4" />
              <div className="h-20 bg-beige-100 rounded" />
              <div className="h-12 bg-beige-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
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
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors?.length && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    addToCart({ ...product, selectedSize, selectedColor });
    toast.success('Added to cart!');
  };

  const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

  const detailGroups = [
    { label: 'Occasions', values: asList(product.occasions) },
    { label: 'Patterns', values: asList(product.patterns) },
    { label: 'Genders', values: asList(product.genders) },
    { label: 'Cloth Materials', values: asList(product.materials) },
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
            <LazyImage
              src={product.image}
              alt={product.name}
              productName={product.name}
              productId={product.id}
              className="w-full rounded-lg"
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

            <div className="space-y-4">
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Size</label>
                    <button 
                      onClick={() => setShowSizeGuide(true)}
                      className="text-xs text-gold hover:underline font-medium"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded ${selectedSize === size ? 'bg-gold text-white' : 'bg-white'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border rounded ${selectedColor === color ? 'bg-gold text-white' : 'bg-white'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

            <div className="space-y-3">
              <VirtualTryOn 
                productImage={product.image} 
                productName={product.name} 
              />
              
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

      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end items-end md:items-stretch">
          <div className="bg-white w-full md:w-96 h-screen md:h-auto overflow-y-auto slide-in-right md:rounded-l-lg">
            <div className="sticky top-0 bg-white border-b">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Size Guide</h2>
                <button onClick={() => setShowSizeGuide(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex border-b">
                <button
                  onClick={() => setSizeGuideTab('size')}
                  className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition ${
                    sizeGuideTab === 'size' ? 'border-gold text-gold' : 'border-transparent text-gray-600'
                  }`}
                >
                  Size Guide
                </button>
                <button
                  onClick={() => setSizeGuideTab('measuring')}
                  className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition ${
                    sizeGuideTab === 'measuring' ? 'border-gold text-gold' : 'border-transparent text-gray-600'
                  }`}
                >
                  Measuring Guide
                </button>
                <button
                  onClick={() => setSizeGuideTab('how-to-measure')}
                  className={`flex-1 py-3 px-4 text-center font-medium border-b-2 transition ${
                    sizeGuideTab === 'how-to-measure' ? 'border-gold text-gold' : 'border-transparent text-gray-600'
                  }`}
                >
                  How To Measure
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {sizeGuideTab === 'size' && (
                <>
                  {/* Unit Toggle */}
                  <div className="flex items-center gap-4 justify-center">
                    <button
                      onClick={() => setSizeGuideUnit('cm')}
                      className={`px-4 py-2 rounded ${sizeGuideUnit === 'cm' ? 'bg-gold text-white' : 'bg-gray-200'}`}
                    >
                      cm
                    </button>
                    <button
                      onClick={() => setSizeGuideUnit('inch')}
                      className={`px-4 py-2 rounded ${sizeGuideUnit === 'inch' ? 'bg-gold text-white' : 'bg-gray-200'}`}
                    >
                      inch
                    </button>
                  </div>

                  {/* Size Chart */}
                  <div className="overflow-x-auto">
                    <h3 className="font-semibold text-lg mb-3">Size Chart for Women</h3>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Size</th>
                          <th className="text-left p-2">UK</th>
                          <th className="text-left p-2">Bust</th>
                          <th className="text-left p-2">Waist</th>
                          <th className="text-left p-2">Hip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { size: 'XS', uk: 6, bust: 32, waist: 26, hip: 36 },
                          { size: 'S', uk: 8, bust: 34, waist: 28, hip: 38 },
                          { size: 'M', uk: 10, bust: 36, waist: 30, hip: 40 },
                          { size: 'L', uk: 12, bust: 38, waist: 32, hip: 42 },
                          { size: 'XL', uk: 14, bust: 40, waist: 34, hip: 44 },
                          { size: 'XXL', uk: 16, bust: 42, waist: 36, hip: 46 },
                          { size: '3XL', uk: 18, bust: 44, waist: 38, hip: 48 },
                          { size: '4XL', uk: 20, bust: 46, waist: 40, hip: 50 },
                          { size: '5XL', uk: 22, bust: 48, waist: 42, hip: 52 },
                          { size: '6XL', uk: 24, bust: 50, waist: 44, hip: 54 },
                        ].map((row) => (
                          <tr key={row.size} className="border-b">
                            <td className="p-2 font-medium">{row.size}</td>
                            <td className="p-2">{row.uk}</td>
                            <td className="p-2">{sizeGuideUnit === 'cm' ? Math.round(row.bust * 2.54) : row.bust}</td>
                            <td className="p-2">{sizeGuideUnit === 'cm' ? Math.round(row.waist * 2.54) : row.waist}</td>
                            <td className="p-2">{sizeGuideUnit === 'cm' ? Math.round(row.hip * 2.54) : row.hip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-medium text-blue-900 mb-2">About Size Guide</p>
                    <p>
                      This is a standard size guide for basic body measurements. Length will vary according to style. 
                      If you are unsure of your size, please contact our customer care.
                    </p>
                  </div>
                </>
              )}

              {sizeGuideTab === 'measuring' && (
                <div className="space-y-4">
                  <img 
                    src="https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/measuring-guide.jpg"
                    alt="How to measure" 
                    className="w-full rounded-lg"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-medium text-blue-900 mb-2">How to Measure</p>
                    <p>
                      Use this guide to understand where each measurement is taken. Measure straight across your body while wearing the clothing that fits you well. 
                      For accurate sizing, wear minimal clothing when measuring.
                    </p>
                  </div>
                </div>
              )}

              {sizeGuideTab === 'how-to-measure' && (
                <div className="space-y-4">
                  <img 
                    src="https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/measuring-guide.jpg"
                    alt="How to measure" 
                    className="w-full rounded-lg"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-medium text-blue-900 mb-2">Measuring Instructions</p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Wear minimal, fitted clothing when measuring</li>
                      <li>Measure straight across, not diagonally</li>
                      <li>Keep the measuring tape snug but not tight</li>
                      <li>Write down all measurements for reference</li>
                      <li>Compare with our size chart above</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

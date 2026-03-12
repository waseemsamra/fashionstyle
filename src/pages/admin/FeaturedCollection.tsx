import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Save, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { getProductImage, handleImageError } from '@/utils/productImage';

const MAX_FEATURED = 20;

export default function FeaturedCollection() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.listProducts();
      const productsArray = Array.isArray(data) ? data : (data.items || data.products || []);
      setAllProducts(productsArray);
      
      // Get currently featured products
      const featured = productsArray.filter((p: any) => p.isFeatured);
      setFeaturedIds(featured.map((p: any) => p.id));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = (productId: string) => {
    setFeaturedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= MAX_FEATURED) {
          alert(`You can only select up to ${MAX_FEATURED} featured products. Please deselect one first.`);
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get JWT token for authentication
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        alert('Please login as admin first');
        navigate('/admin/login');
        return;
      }
      
      const updatePromises = allProducts.map(async (product: any) => {
        const isFeatured = featuredIds.includes(product.id);
        if (product.isFeatured !== isFeatured) {
          // Use fetch with proper headers for authentication
          const response = await fetch(
            `https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products/${product.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...product,
                isFeatured
              })
            }
          );
          
          if (!response.ok) {
            throw new Error(`Failed to update product ${product.id}`);
          }
        }
      });

      await Promise.all(updatePromises);
      
      alert(`Successfully saved ${featuredIds.length} featured products!`);
      console.log('✅ Featured collection updated:', featuredIds.length, 'products');
    } catch (error: any) {
      console.error('Failed to save featured collection:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Featured Collection</h1>
            <p className="text-gray-600">Select up to {MAX_FEATURED} products to feature on the homepage</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Selected</p>
              <p className={`text-2xl font-bold ${featuredIds.length >= MAX_FEATURED ? 'text-red-600' : 'text-gold'}`}>
                {featuredIds.length} / {MAX_FEATURED}
              </p>
            </div>
            
            <Button onClick={handleSave} disabled={saving || featuredIds.length === 0} className="bg-gold hover:bg-gold/90 disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Collection'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <div className="flex items-center gap-2 border-l pl-4">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} isFeatured={featuredIds.includes(product.id)} onToggle={() => toggleFeatured(product.id)} disabled={featuredIds.length >= MAX_FEATURED && !featuredIds.includes(product.id)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {filteredProducts.map((product: any) => (
              <ProductListItem key={product.id} product={product} isFeatured={featuredIds.includes(product.id)} onToggle={() => toggleFeatured(product.id)} disabled={featuredIds.length >= MAX_FEATURED && !featuredIds.includes(product.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, isFeatured, onToggle, disabled }: any) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden transition-all ${disabled ? 'opacity-50' : 'hover:shadow-lg'}`}>
      <div className="relative aspect-[3/4] bg-beige-50">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, product.name)} />
        {isFeatured && <div className="absolute top-2 left-2 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full">Featured</div>}
        <button onClick={onToggle} disabled={disabled && !isFeatured} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFeatured ? 'bg-gold text-white' : disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>
          {isFeatured ? <Check className="w-4 h-4" /> : <span className="text-lg font-bold">+</span>}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.brand} • {product.category}</p>
        <p className="text-gold font-bold">${product.price}</p>
      </div>
    </div>
  );
}

function ProductListItem({ product, isFeatured, onToggle, disabled }: any) {
  return (
    <div className={`p-4 flex items-center gap-4 transition-all ${disabled ? 'opacity-50' : 'hover:bg-gray-50'}`}>
      <div className="w-20 h-24 bg-beige-50 rounded overflow-hidden flex-shrink-0">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, product.name)} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
          <span>{product.brand}</span>
          <span>•</span>
          <span>{product.category}</span>
          <span>•</span>
          <span>SKU: {product.sku}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-gold font-bold text-lg">${product.price}</p>
        {isFeatured && <p className="text-xs text-gold mt-1">Featured</p>}
      </div>
      <button onClick={onToggle} disabled={disabled && !isFeatured} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFeatured ? 'bg-gold text-white' : disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gold hover:text-white'}`}>
        {isFeatured ? <Check className="w-5 h-5" /> : <span className="text-xl font-bold">+</span>}
      </button>
    </div>
  );
}

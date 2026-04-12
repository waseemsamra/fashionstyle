// components/admin/CollectionManager.tsx - Generic collection manager for ALL home page sections
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useSaveCollection } from '@/hooks/useCollection';
import { getProductImage, handleImageError } from '@/utils/productImage';

interface CollectionManagerProps {
  collectionId: string; // e.g., 'featuredCollection', 'designersDiscount'
  collectionName: string; // e.g., 'Featured Collection', 'Designers On Discount'
  maxProducts?: number; // Maximum products allowed
  description?: string;
}

export default function CollectionManager({ 
  collectionId, 
  collectionName, 
  maxProducts = 20,
  description = 'Select products to feature in this collection'
}: CollectionManagerProps) {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { save, saving } = useSaveCollection(collectionId);

  useEffect(() => {
    loadProducts();
  }, [collectionId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Load ALL products for admin selection - bypass cache to get fresh data
      const data = await api.listProducts({ limit: 1000, _bypassCache: true });
      console.log('📦 CollectionManager - API response:', data);
      console.log('📦 Is array?', Array.isArray(data));
      console.log('📦 Has items?', data?.items);

      const productsArray = Array.isArray(data) ? data : (data?.items || data?.products || []);
      console.log('📦 Products array:', productsArray.length, 'products');

      setAllProducts(productsArray);

      // Load existing collection
      const existingCollection = await api.getCollection(collectionId);
      console.log('📦 Existing collection:', existingCollection);
      console.log('📦 Existing product IDs:', existingCollection.products.map((p: any) => p.id));
      
      setSelectedIds(existingCollection.products.map((p: any) => p.id));

      console.log(`✅ Loaded ${productsArray.length} products, ${existingCollection.products.length} in collection`);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= maxProducts) {
          alert(`You can only select up to ${maxProducts} products. Please deselect one first.`);
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleSave = async () => {
    try {
      await save({
        productIds: selectedIds,
        displayName: collectionName,
        description,
        metadata: {
          maxProducts,
          updatedAt: new Date().toISOString()
        }
      });

      alert(`✅ Successfully saved ${selectedIds.length} products to ${collectionName}!`);
      console.log(`✅ Collection ${collectionId} saved with ${selectedIds.length} products`);
    } catch (error) {
      console.error('Failed to save collection:', error);
      alert('Failed to save collection. Please try again.');
    }
  };

  // Filter products by search
  const filteredProducts = allProducts.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{collectionName}</h1>
            <p className="text-gray-600">{description}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Products Selected</p>
              <p className={`text-2xl font-bold ${selectedIds.length >= maxProducts ? 'text-red-600' : 'text-gold'}`}>
                {selectedIds.length} / {maxProducts}
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold hover:bg-gold/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Collection'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products by name, brand, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product: any) => {
              const isSelected = selectedIds.includes(product.id);
              
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-gold bg-gold/5 shadow-lg'
                      : 'border-gray-200 hover:border-gold/50'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, product.name)}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-gold text-white rounded-full p-1">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">{product.brand}</p>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gold">${product.price}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isSelected ? 'bg-gold text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {isSelected ? '✓' : <Plus className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

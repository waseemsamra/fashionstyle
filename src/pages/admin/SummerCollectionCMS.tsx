import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Save, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { getProductImage, handleImageError } from '@/utils/productImage';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://u3c5ywl3vp3gz3tkcczpr5pztm0ozkbc.lambda-url.us-east-1.on.aws';
const MAX_SUMMER = 20;

export default function SummerCollectionCMS() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllProducts();
      const productsArray = (data.items || []).filter((p: any) => p && p.id && p.name && p.name !== 'undefined' && p.price != null);
      setAllProducts(productsArray);
      
      const featured = productsArray.filter((p: any) => p.isSummerCollection).slice(0, MAX_SUMMER);
      const allFlagged = productsArray.filter((p: any) => p.isSummerCollection);
      if (allFlagged.length > MAX_SUMMER) {
        console.warn(`Backend has ${allFlagged.length} summer products, capping to ${MAX_SUMMER} for editing`);
      }
      setSelectedIds(featured.map((p: any) => p.id));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= MAX_SUMMER) {
          alert(`You can only select up to ${MAX_SUMMER} products. Please deselect one first.`);
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        alert('Please login as admin first');
        navigate('/admin/login');
        return;
      }
      
      const uniqueIds = [...new Set(selectedIds)].slice(0, MAX_SUMMER);
      
      // Find products that need to be UNFLAGGED (was selected but no longer is)
      const previouslyFlagged = allProducts.filter((p: any) => p.isSummerCollection && !uniqueIds.includes(p.id));
      // Find products that need to be FLAGGED (now selected but wasn't)
      const newlyFlagged = allProducts.filter((p: any) => !p.isSummerCollection && uniqueIds.includes(p.id));
      
      const toUpdate = [...previouslyFlagged, ...newlyFlagged];
      console.log(`Unflagging ${previouslyFlagged.length}, Flagging ${newlyFlagged.length}`);
      
      if (toUpdate.length === 0) {
        alert('No changes to save');
        setSaving(false);
        return;
      }
      
      const batchSize = 5;
      const succeeded: string[] = [];
      const failed: any[] = [];
      
      for (let i = 0; i < toUpdate.length; i += batchSize) {
        const batch = toUpdate.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toUpdate.length / batchSize)}:`, batch.map(p => ({ id: p.id, name: p.name, flag: !uniqueIds.includes(p.id) })));
        
        const batchPromises = batch.map(async (product) => {
          const shouldFlag = uniqueIds.includes(product.id);
          const payload = { ...product, isSummerCollection: shouldFlag };
          
          try {
            const response = await fetch(`${ADMIN_API_URL}/products/${product.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.replace(/^["']|["']$/g, '')}`
              },
              body: JSON.stringify(payload)
            });
            
            const responseText = await response.text().catch(() => '');
            
            if (!response.ok) {
              console.error(`Failed product ${product.id}:`, response.status, responseText);
              failed.push({ productId: product.id, status: response.status, body: responseText });
            } else {
              console.log(`Updated product ${product.id}:`, product.name, '→', shouldFlag);
              succeeded.push(product.id);
            }
          } catch (err: any) {
            console.error(`Network error product ${product.id}:`, err.message);
            failed.push({ productId: product.id, reason: err.message });
          }
        });
        
        await Promise.allSettled(batchPromises);
        
        if (i + batchSize < toUpdate.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      
      console.log(`Save complete: ${succeeded.length} succeeded, ${failed.length} failed`);
      if (failed.length > 0) console.table(failed);
      
      if (failed.length > 0) {
        alert(`⚠️ ${failed.length} products failed to save. Check console for details.`);
      } else {
        alert(`✅ Successfully saved ${uniqueIds.length} products!`);
        loadProducts();
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
         
  const filteredProducts = allProducts.filter(product => {
    if (!product || !product.name) return false;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const brandMatch = product.brand && product.brand.toLowerCase().includes(searchLower);
    const categoryMatch = product.category && product.category.toLowerCase().includes(searchLower);
    const skuMatch = product.sku && product.sku.toLowerCase().includes(searchLower);
    return nameMatch || brandMatch || categoryMatch || skuMatch;
  });

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Summer Collection</h1>
            <p className="text-gray-600">Select up to {MAX_SUMMER} products to feature in Summer Collection ({allProducts.length} total available)</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selected</p>
            <p className={`text-2xl font-bold ${selectedIds.length >= MAX_SUMMER ? 'text-red-600' : 'text-gold'}`}>
              {selectedIds.length} / {MAX_SUMMER}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving || selectedIds.length === 0} className="bg-gold hover:bg-gold/90 disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Collection'}
          </Button>
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
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} isSelected={selectedIds.includes(product.id)} onToggle={() => toggleProduct(product.id)} disabled={selectedIds.length >= MAX_SUMMER && !selectedIds.includes(product.id)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {filteredProducts.map((product) => (
              <ProductListItem key={product.id} product={product} isSelected={selectedIds.includes(product.id)} onToggle={() => toggleProduct(product.id)} disabled={selectedIds.length >= MAX_SUMMER && !selectedIds.includes(product.id)} />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, isSelected, onToggle, disabled }: any) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden transition-all ${disabled ? 'opacity-50' : 'hover:shadow-lg'}`}>
      <div className="relative aspect-[3/4] bg-beige-50">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, product.name)} />
        {isSelected && <div className="absolute top-2 left-2 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full">Selected</div>}
        <button onClick={onToggle} disabled={disabled && !isSelected} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-gold text-white' : disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'}`}>
          {isSelected ? <Check className="w-4 h-4" /> : <span className="text-lg font-bold">+</span>}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.brand || ''} • {product.category || ''}</p>
        <p className="text-gold font-bold">${product.price}</p>
      </div>
    </div>
  );
}

function ProductListItem({ product, isSelected, onToggle, disabled }: any) {
  return (
    <div className={`p-4 flex items-center gap-4 transition-all ${disabled ? 'opacity-50' : 'hover:bg-gray-50'}`}>
      <div className="w-20 h-24 bg-beige-50 rounded overflow-hidden flex-shrink-0">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, product.name)} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
          <span>{product.brand || ''}</span>
          <span>•</span>
          <span>{product.category || ''}</span>
          <span>•</span>
          <span>SKU: {product.sku || ''}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-gold font-bold text-lg">${product.price}</p>
        {isSelected && <p className="text-xs text-gold mt-1">Selected</p>}
      </div>
      <button onClick={onToggle} disabled={disabled && !isSelected} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-gold text-white' : disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gold hover:text-white'}`}>
        {isSelected ? <Check className="w-5 h-5" /> : <span className="text-xl font-bold">+</span>}
      </button>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { getProductImage, handleImageError } from '@/utils/productImage';

export default function WeddingTalesCMS() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.listProducts();
      const productsArray = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
      
      // Filter wedding/bridal products
      const weddingProducts = productsArray.filter((p: any) => 
        p.category?.toLowerCase().includes('bridal') || 
        p.category?.toLowerCase().includes('wedding') ||
        p.occasions?.some((o: any) => o.toLowerCase().includes('wedding'))
      );
      
      setAllProducts(weddingProducts);
      
      // Get currently selected from backend (isWeddingTales flag)
      const selected = weddingProducts.filter((p: any) => p.isWeddingTales).map((p: any) => p.id);
      setSelectedIds(selected);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (productId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 20) {
          alert('You can only select up to 20 products.');
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
      
      console.log('📝 Starting save with', selectedIds.length, 'wedding tales products');
      
      // Update all products in batch
      const response = await fetch(
        'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/products/batch-wedding',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            weddingTales: selectedIds
          })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully saved ${selectedIds.length} products to Wedding Tales!`);
        console.log('✅ Wedding Tales updated:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Save failed:', response.status, errorText);
        alert(`❌ Failed to save: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to save wedding tales:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold mb-2">Wedding Tales - CMS</h1>
            <p className="text-gray-600">Select products for the Wedding Tales carousel (max 20)</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Selected</p>
              <p className={`text-2xl font-bold ${selectedIds.length >= 20 ? 'text-red-600' : 'text-gold'}`}>
                {selectedIds.length} / 20
              </p>
            </div>
            
            <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold/90 disabled:opacity-50">
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
              placeholder="Search wedding products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedIds.includes(product.id)}
                onToggle={() => toggleSelected(product.id)}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No wedding products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, isSelected, onToggle }: any) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 ${isSelected ? 'ring-2 ring-gold' : ''}`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-beige-50">
        <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, product.name)} />
        
        {isSelected && (
          <div className="absolute top-2 left-2 px-3 py-1 bg-gold text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Selected
          </div>
        )}

        <button
          onClick={onToggle}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
            isSelected ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gold hover:text-white'
          }`}
        >
          {isSelected ? <Check className="w-4 h-4" /> : <span className="text-lg font-bold">+</span>}
        </button>
      </div>

      <div className="p-4">
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-playfair text-lg font-semibold text-black mb-2">{product.name}</h3>
        <p className="text-gold font-semibold text-lg">${product.price}</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://u3c5ywl3vp3gz3tkcczpr5pztm0ozkbc.lambda-url.us-east-1.on.aws';

export default function HandPickedCMS() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'brands' | 'products'>('brands');
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);
const loadData = async () => { try { setLoading(true); const data = await api.getAllProducts(); const productsArray = (data.items || []).filter((p: any) => p && p.id); setAllBrands([...new Set(productsArray.map((p: any) => p.brand).filter(Boolean))] as string[]); setProducts(productsArray); const collectionProducts = productsArray.filter((p: any) => p.isHandPicked); const selectedBrandSet = new Set(collectionProducts.map((p: any) => p.brand).filter(Boolean) as string[]); setSelectedBrands([...selectedBrandSet]); setSelectedProductIds(collectionProducts.map((p: any) => p.id)); } catch (error) { console.error('Failed to load data:', error); } finally { setLoading(false); } };
const toggleBrand = (brand: string) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
const toggleProduct = (productId: string) => setSelectedProductIds(prev => { if (prev.includes(productId)) return prev.filter(id => id !== productId); if (prev.length >= 8) { alert('You can only select up to 8 products'); return prev; } return [...prev, productId]; });
const handleSave = async () => { try { setSaving(true); localStorage.setItem('handPickedProducts', JSON.stringify(selectedProductIds)); const token = localStorage.getItem('jwt_token'); if (!token) { alert('✅ Saved locally!'); return; } await Promise.all(products.map(async (product: any) => { const shouldFlag = selectedProductIds.includes(product.id); if (product.isHandPicked !== shouldFlag) return fetch(`${ADMIN_API_URL}/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token.replace(/^["']|["']$/g, '')}` }, body: JSON.stringify({ ...product, isHandPicked: shouldFlag }) }); })); alert(`✅ Saved ${selectedProductIds.length} products!`); } catch (error) { alert('Failed to save'); } finally { setSaving(false); } };

return (
    <div className="min-h-screen bg-beige-100 py-12"><div className="container mx-auto px-4 max-w-7xl">
      <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
      <div className="flex items-center justify-center mb-8"><div className="flex items-center gap-4"><div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step === 'brands' ? 'bg-gold text-white' : 'bg-gray-200'}`}><span>1</span><span>Brands</span></div><ChevronRight className="w-6 h-6 text-gray-400" /><div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step === 'products' ? 'bg-gold text-white' : 'bg-gray-200'}`}><span>2</span><span>Products</span></div></div></div>
      <div className="flex items-center justify-between mb-8"><div><h1 className="text-3xl font-bold">{step === 'brands' ? 'Select Brands' : 'Select Products'}</h1><p className="text-gray-600">{step === 'brands' ? `Select brands (${allBrands.length} available)` : `Select products from ${selectedBrands.length} brands`}</p></div><div className="flex items-center gap-4">{step === 'products' && <Button variant="outline" onClick={() => setStep('brands')}><ChevronLeft className="w-4 h-4 mr-2" />Back</Button>}<div className="text-right"><p className="text-sm">Selected</p><p className={`text-2xl font-bold ${step === 'brands' ? 'text-gold' : selectedProductIds.length >= 8 ? 'text-red-600' : 'text-gold'}`}>{step === 'brands' ? selectedBrands.length : `${selectedProductIds.length} / 8`}</p></div><Button onClick={step === 'brands' ? () => setStep('products') : handleSave} disabled={saving || (step === 'brands' && selectedBrands.length === 0)} className="bg-gold"><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : step === 'brands' ? 'Next' : 'Save'}</Button></div></div>
      <div className="bg-white rounded-lg shadow p-4 mb-6"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
      {loading ? <p>Loading...</p> : step === 'brands' ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{allBrands.filter(b => b.toLowerCase().includes(searchTerm.toLowerCase())).map(brand => <div key={brand} className={`bg-white rounded-xl p-6 text-center border-2 cursor-pointer ${selectedBrands.includes(brand) ? 'border-gold' : 'border-gray-200'}`} onClick={() => toggleBrand(brand)}><h3>{brand}</h3></div>)}</div> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{products.filter(p => selectedBrands.includes(p.brand) && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase()))).map(product => <div key={product.id} className={`bg-white rounded-xl overflow-hidden border-2 cursor-pointer ${selectedProductIds.includes(product.id) ? 'border-gold' : 'border-gray-200'}`} onClick={() => toggleProduct(product.id)}><img src={product.image || '/placeholder.png'} alt={product.name} className="aspect-[3/4] object-cover w-full" /><div className="p-4"><h3>{product.name}</h3></div></div>)}</div>}
    </div></div>
  );
}
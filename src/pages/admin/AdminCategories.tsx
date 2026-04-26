import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Save, Search, ArrowLeft, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import LazyImage from '@/components/ui/LazyImage';
import { getProductUrl } from '@/utils/productUrl';
import { toCDNUrl } from '@/utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || 'https://zbdw3piterihfqm37o3swldeca0qitsj.lambda-url.us-east-1.on.aws';

interface Category {
  name: string;
  count: number;
  image?: string;
  description?: string;
  products?: any[];
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading categories and products...');

      // Fetch categories from the dedicated endpoint
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/products?limit=2000`),
      ]);

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();
      
      const products = productsData.items || [];
      setAllProducts(products);

      // Use categories from the dedicated endpoint with images
      const cats: Category[] = (categoriesData.categories || categoriesData.items || [])
        .map((cat: any) => ({
          name: cat.name,
          count: cat.count || 0,
          image: cat.image || '',
          description: cat.description || `${cat.count || 0} products`,
        }))
        .sort((a: Category, b: Category) => b.count - a.count);

      setCategories(cats);
      console.log(`✅ Loaded ${cats.length} categories from ${products.length} products`);
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const getProductsInCategory = (categoryName: string) => {
    return allProducts.filter(p => p.category === categoryName);
  };

  const handleSaveCategory = async (oldName: string) => {
    if (!editName) {
      toast.error('Category name is required');
      return;
    }

    try {
      // Save category metadata (image, description)
      const saveRes = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          image: editImage,
          description: editDescription,
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save category');

      // If name changed, update all products
      if (editName !== oldName) {
        const productsToUpdate = allProducts.filter(p => p.category === oldName);
        console.log(`🔄 Renaming "${oldName}" to "${editName}" (${productsToUpdate.length} products)`);

        let updated = 0;
        for (const product of productsToUpdate) {
          const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...product, category: editName }),
          });
          if (response.ok) updated++;
        }
        console.log(`✅ Renamed ${updated}/${productsToUpdate.length} products`);
        toast.success(`Renamed ${updated} products and updated category image`);
      } else {
        toast.success('Category updated');
      }

      setEditingCategory(null);
      setEditName('');
      setEditImage('');
      setEditDescription('');
      loadData();
    } catch (error) {
      console.error('❌ Failed to save category:', error);
      toast.error('Failed to save category');
    }
  };
  const handleDeleteCategory = async (categoryName: string) => {
    const productsInCategory = allProducts.filter(p => p.category === categoryName);
    
    if (!confirm(`Remove "${categoryName}" from ${productsInCategory.length} products? Products will become uncategorized.`)) {
      return;
    }

    try {
      console.log(`🗑️ Deleting category "${categoryName}" from ${productsInCategory.length} products`);

      let updated = 0;
      for (const product of productsInCategory) {
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...product, category: '' }),
        });

        if (response.ok) updated++;
      }

      console.log(`✅ Removed category from ${updated} products`);
      toast.success(`Removed "${categoryName}" from ${updated} products`);
      loadData();
    } catch (error) {
      console.error('❌ Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    toast.info(`Category "${newCategoryName}" created! Assign products to it from the Products page.`);
    setNewCategoryName('');
    setShowAddModal(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-100 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Category Management</h1>
            <p className="text-gray-600 mt-1">
              {categories.length} categories across {allProducts.length} products
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-gold hover:bg-gold/90">
            <Plus className="w-4 h-4 mr-1" /> Add Category
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category Name</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCategories.map((category) => (
                  <tr key={category.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingCategory === category.name ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {editImage ? (
                              <img src={editImage} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Category name"
                              className="max-w-xs"
                              autoFocus
                            />
                            <Input
                              value={editImage}
                              onChange={(e) => setEditImage(e.target.value)}
                              placeholder="Image URL (S3 or external)"
                              className="max-w-xs text-xs"
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Description"
                              className="max-w-xs text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {category.image ? (
                              <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                              <p className="text-xs text-gray-500">{category.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gold/10 text-gold">
                          {category.count} products
                        </span>
                        <button
                          onClick={() => setViewingCategory(category.name)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View products"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingCategory === category.name ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSaveCategory(category.name)}
                            >
                              <Save className="w-4 h-4 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingCategory(null); }}
                            >
                              <X className="w-4 h-4" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(category.name);
                                setEditName(category.name);
                                setEditImage(category.image || '');
                                setEditDescription(category.description || '');
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:border-red-200"
                              onClick={() => handleDeleteCategory(category.name)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Products Modal */}
      {viewingCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">{viewingCategory} ({getProductsInCategory(viewingCategory).length} products)</h2>
              <button onClick={() => setViewingCategory(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {getProductsInCategory(viewingCategory).map((product: any) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
                    onClick={() => navigate(getProductUrl(product))}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-beige-50">
                      <LazyImage
                        src={toCDNUrl(product.image)}
                        alt={product.name}
                        productName={product.name}
                        productId={product.id}
                        className="w-full h-full"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {product.isNew && <span className="px-2 py-0.5 bg-black text-white text-xs rounded">New</span>}
                        {product.isSale && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded">Sale</span>}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                      <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                      <p className="font-semibold text-gold mt-1">${product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              {getProductsInCategory(viewingCategory).length === 0 && (
                <div className="text-center py-8 text-gray-500">No products in this category</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Summer Collection"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>Tip:</strong> After creating the category, edit products and assign them to this category from the Products page.
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddCategory} className="flex-1 bg-gold hover:bg-gold/90">
                  Create Category
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

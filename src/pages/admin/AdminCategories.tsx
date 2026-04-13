import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Save, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API_URL = 'https://tmdoc0q5ij.execute-api.us-east-1.amazonaws.com';

interface Category {
  name: string;
  productCount: number;
  products: any[];
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading products for categories...');

      const response = await fetch(`${API_URL}/products?limit=2000`);
      const data = await response.json();
      const products = data.items || [];
      setAllProducts(products);

      // Extract unique categories with product counts
      const categoryMap: Record<string, any[]> = {};
      products.forEach((p: any) => {
        if (p.category) {
          if (!categoryMap[p.category]) {
            categoryMap[p.category] = [];
          }
          categoryMap[p.category].push(p);
        }
      });

      const cats: Category[] = Object.entries(categoryMap).map(([name, products]) => ({
        name,
        productCount: products.length,
        products,
      })).sort((a, b) => b.productCount - a.productCount);

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

  const handleRenameCategory = async (oldName: string) => {
    if (!newName || newName === oldName) {
      setEditingCategory(null);
      return;
    }

    try {
      // Find all products with the old category
      const productsToUpdate = allProducts.filter(p => p.category === oldName);
      
      console.log(`🔄 Renaming "${oldName}" to "${newName}" (${productsToUpdate.length} products)`);

      // Update each product
      let updated = 0;
      for (const product of productsToUpdate) {
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            category: newName,
          }),
        });

        if (response.ok) {
          updated++;
        }
      }

      console.log(`✅ Renamed ${updated}/${productsToUpdate.length} products`);
      toast.success(`Renamed ${updated} products from "${oldName}" to "${newName}"`);
      
      setEditingCategory(null);
      setNewName('');
      loadData(); // Reload
    } catch (error) {
      console.error('❌ Failed to rename category:', error);
      toast.error('Failed to rename category');
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
          body: JSON.stringify({
            ...product,
            category: '', // Remove category
          }),
        });

        if (response.ok) {
          updated++;
        }
      }

      console.log(`✅ Removed category from ${updated} products`);
      toast.success(`Removed "${categoryName}" from ${updated} products`);
      loadData(); // Reload
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

    // Check if category already exists
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
                      <div className="flex items-center gap-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="New category name"
                          className="max-w-xs"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleRenameCategory(category.name)}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingCategory(null); setNewName(''); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gold/10 text-gold">
                      {category.productCount} products
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingCategory(category.name); setNewName(category.name); }}
                      >
                        <Edit className="w-4 h-4 mr-1" /> Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        onClick={() => handleDeleteCategory(category.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
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

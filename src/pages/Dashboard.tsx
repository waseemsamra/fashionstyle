import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { checkAdminAccess } from '@/utils/auth';
import { Package, ShoppingCart, Users as UsersIcon, DollarSign, LogOut, LayoutDashboard, Settings, Tag, Edit, Trash2, X, UserCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showColorModal, setShowColorModal] = useState(false);
  const [editingColor, setEditingColor] = useState<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [editingSize, setEditingSize] = useState<any>(null);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<any>(null);
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<any>(null);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [editingGender, setEditingGender] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [genders, setGenders] = useState([
    { id: 1, name: 'Men', description: 'Mens clothing' },
    { id: 2, name: 'Women', description: 'Womens clothing' },
    { id: 3, name: 'Unisex', description: 'For all' },
  ]);
  const [sizes, setSizes] = useState([
    { id: 1, name: 'Small', code: 'S' },
    { id: 2, name: 'Medium', code: 'M' },
    { id: 3, name: 'Large', code: 'L' },
    { id: 4, name: 'Extra Large', code: 'XL' },
  ]);
  const [patterns, setPatterns] = useState([
    { id: 1, name: 'Embroidered', description: 'Hand embroidery work' },
    { id: 2, name: 'Printed', description: 'Digital prints' },
    { id: 3, name: 'Plain', description: 'Solid colors' },
  ]);
  const [occasions, setOccasions] = useState([
    { id: 1, name: 'Wedding', description: 'Bridal and formal events' },
    { id: 2, name: 'Party', description: 'Evening parties' },
    { id: 3, name: 'Casual', description: 'Daily wear' },
  ]);
  const [colors, setColors] = useState([
    { id: 1, name: 'Red', code: '#FF0000' },
    { id: 2, name: 'Blue', code: '#0000FF' },
    { id: 3, name: 'Green', code: '#00FF00' },
    { id: 4, name: 'Black', code: '#000000' },
  ]);
  const [materials, setMaterials] = useState([
    { id: 1, name: 'Cotton', description: 'Soft and breathable' },
    { id: 2, name: 'Silk', description: 'Luxurious and smooth' },
    { id: 3, name: 'Chiffon', description: 'Light and elegant' },
    { id: 4, name: 'Lawn', description: 'Summer fabric' },
  ]);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Casual Wear', description: 'Everyday clothing', products: 120 },
    { id: 2, name: 'Formal Wear', description: 'Special occasion dresses', products: 78 },
    { id: 3, name: 'Bridal Wear', description: 'Wedding ensembles', products: 45 },
    { id: 4, name: 'Accessories', description: 'Complete your look', products: 56 },
  ]);
  const [brands, setBrands] = useState([
    { id: 1, name: 'Al Karam', description: 'Premium Pakistani fashion', products: 45 },
    { id: 2, name: 'Gul Ahmed', description: 'Traditional & modern wear', products: 67 },
    { id: 3, name: 'Maria B', description: 'Luxury bridal collection', products: 32 },
    { id: 4, name: 'Khaadi', description: 'Contemporary fashion', products: 89 },
  ]);
  const [products, setProducts] = useState([
    { id: 1, name: 'Embroidered Lawn Suit', category: 'Casual Wear', price: 89, stock: 45, brand: 'Al Karam', image: '/product-1.jpg', occasions: ['Casual'], patterns: ['Embroidered'], sizes: ['S', 'M', 'L'], materials: ['Lawn', 'Cotton'], colors: ['Blue', 'White'], genders: ['Women'] },
    { id: 2, name: 'Chiffon Formal Dress', category: 'Formal Wear', price: 149, stock: 32, brand: 'Gul Ahmed', image: '/product-2.jpg', occasions: ['Party'], patterns: ['Printed'], sizes: ['S', 'M', 'L', 'XL'], materials: ['Chiffon'], colors: ['White', 'Beige'], genders: ['Women'] },
    { id: 3, name: 'Silk Lehenga Set', category: 'Bridal Wear', price: 299, stock: 18, brand: 'Maria B', image: '/product-3.jpg', occasions: ['Wedding'], patterns: ['Embroidered'], sizes: ['S', 'M', 'L'], materials: ['Silk'], colors: ['Gold', 'Red'], genders: ['Women'] },
    { id: 4, name: 'Cotton Kurti', category: 'Casual Wear', price: 59, stock: 67, brand: 'Khaadi', image: '/product-4.jpg', occasions: ['Casual'], patterns: ['Plain'], sizes: ['S', 'M', 'L', 'XL'], materials: ['Cotton'], colors: ['Green', 'Black'], genders: ['Women'] },
    { id: 5, name: 'Bridal Sharara', category: 'Bridal Wear', price: 499, stock: 12, brand: 'Asim Jofa', image: '/product-5.jpg', occasions: ['Wedding'], patterns: ['Embroidered'], sizes: ['S', 'M', 'L'], materials: ['Silk', 'Chiffon'], colors: ['Red', 'Gold'], genders: ['Women'] },
  ]);

  const ensureArray = (value: any): string[] => Array.isArray(value) ? value : [];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        const isAdmin = await checkAdminAccess();
        if (!isAdmin) {
          alert('Access denied. Admin privileges required.');
          navigate('/admin/login');
          return;
        }
        setLoading(false);
      } catch {
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct({
      ...product,
      sku: product.sku || '',
      description: product.description || '',
      genders: ensureArray(product.genders),
      occasions: ensureArray(product.occasions),
      patterns: ensureArray(product.patterns),
      sizes: ensureArray(product.sizes),
      materials: ensureArray(product.materials),
      colors: ensureArray(product.colors),
    });
    setShowEditModal(true);
  };

  const handleAddProduct = () => {
    const defaultCategory = categories[0]?.name || '';
    const defaultBrand = brands[0]?.name || '';

    setEditingProduct({
      id: Date.now(),
      name: '',
      sku: '',
      description: '',
      category: defaultCategory,
      brand: defaultBrand,
      price: 0,
      stock: 0,
      image: '/product-1.jpg',
      genders: [],
      occasions: [],
      patterns: [],
      sizes: [],
      materials: [],
      colors: [],
    });
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (products.find(p => p.id === editingProduct.id)) {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    } else {
      setProducts([...products, editingProduct]);
    }
    setShowEditModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditBrand = (brand: any) => {
    setEditingBrand(brand);
    setShowBrandModal(true);
  };

  const handleAddBrand = () => {
    setEditingBrand({ id: Date.now(), name: '', description: '', products: 0 });
    setShowBrandModal(true);
  };

  const handleSaveBrand = () => {
    if (brands.find(b => b.id === editingBrand.id)) {
      setBrands(brands.map(b => b.id === editingBrand.id ? editingBrand : b));
    } else {
      setBrands([...brands, editingBrand]);
    }
    setShowBrandModal(false);
  };

  const handleDeleteBrand = (id: number) => {
    if (confirm('Delete this brand?')) {
      setBrands(brands.filter(b => b.id !== id));
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleAddCategory = () => {
    setEditingCategory({ id: Date.now(), name: '', description: '', products: 0 });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (categories.find(c => c.id === editingCategory.id)) {
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    } else {
      setCategories([...categories, editingCategory]);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleEditColor = (color: any) => {
    setEditingColor(color);
    setShowColorModal(true);
  };

  const handleAddColor = () => {
    setEditingColor({ id: Date.now(), name: '', code: '#000000' });
    setShowColorModal(true);
  };

  const handleSaveColor = () => {
    if (colors.find(c => c.id === editingColor.id)) {
      setColors(colors.map(c => c.id === editingColor.id ? editingColor : c));
    } else {
      setColors([...colors, editingColor]);
    }
    setShowColorModal(false);
  };

  const handleDeleteColor = (id: number) => {
    if (confirm('Delete this color?')) {
      setColors(colors.filter(c => c.id !== id));
    }
  };

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setShowMaterialModal(true);
  };

  const handleAddMaterial = () => {
    setEditingMaterial({ id: Date.now(), name: '', description: '' });
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = () => {
    if (materials.find(m => m.id === editingMaterial.id)) {
      setMaterials(materials.map(m => m.id === editingMaterial.id ? editingMaterial : m));
    } else {
      setMaterials([...materials, editingMaterial]);
    }
    setShowMaterialModal(false);
  };

  const handleDeleteMaterial = (id: number) => {
    if (confirm('Delete this material?')) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const handleSaveSize = () => {
    if (sizes.find(s => s.id === editingSize.id)) {
      setSizes(sizes.map(s => s.id === editingSize.id ? editingSize : s));
    } else {
      setSizes([...sizes, editingSize]);
    }
    setShowSizeModal(false);
  };

  const handleSavePattern = () => {
    if (patterns.find(p => p.id === editingPattern.id)) {
      setPatterns(patterns.map(p => p.id === editingPattern.id ? editingPattern : p));
    } else {
      setPatterns([...patterns, editingPattern]);
    }
    setShowPatternModal(false);
  };

  const handleSaveOccasion = () => {
    if (occasions.find(o => o.id === editingOccasion.id)) {
      setOccasions(occasions.map(o => o.id === editingOccasion.id ? editingOccasion : o));
    } else {
      setOccasions([...occasions, editingOccasion]);
    }
    setShowOccasionModal(false);
  };

  const handleSaveGender = () => {
    if (genders.find(g => g.id === editingGender.id)) {
      setGenders(genders.map(g => g.id === editingGender.id ? editingGender : g));
    } else {
      setGenders([...genders, editingGender]);
    }
    setShowGenderModal(false);
  };

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: UsersIcon },
    { id: 'users', label: 'Users', icon: UsersIcon, link: '/admin/users' },
    { id: 'brands', label: 'Brands', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserCircle, link: '/admin/profile' },
  ];

  const stats = [
    { label: 'Total Revenue', value: '$45,231', change: '+20.1%', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Orders', value: '356', change: '+12.5%', icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Products', value: '1,234', change: '+5.2%', icon: Package, color: 'bg-purple-500' },
    { label: 'Customers', value: '8,549', change: '+18.3%', icon: UsersIcon, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">Fashion Admin</h1>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.link ? navigate(item.link) : setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                activeTab === item.id ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-4">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      <div className="ml-64 flex-1">
        <div className="bg-white shadow">
          <div className="px-8 py-4">
            <h2 className="text-2xl font-bold">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-lg shadow">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-gray-600 text-sm">{stat.label}</h3>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-end">
                <button onClick={handleAddProduct} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Add Product
                </button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      </td>
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4">{product.brand}</td>
                      <td className="px-6 py-4 font-semibold">${product.price}</td>
                      <td className="px-6 py-4">{product.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'brands' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Brands Management</h3>
                <button onClick={handleAddBrand} className="px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Add Brand
                </button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Brand Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Products</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{brand.name}</td>
                      <td className="px-6 py-4 text-gray-600">{brand.description}</td>
                      <td className="px-6 py-4">{brand.products}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditBrand(brand)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBrand(brand.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Store Information */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'store' ? null : 'store')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Store Information</h3>
                  <span className="text-2xl">{expandedSection === 'store' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'store' && (
                  <div className="p-6 border-t space-y-4">
                    <input type="text" placeholder="Store Name" defaultValue="Fashion Style" className="w-full p-3 border rounded-lg" />
                    <input type="email" placeholder="Email" defaultValue="info@fashionstyle.com" className="w-full p-3 border rounded-lg" />
                    <input type="tel" placeholder="Phone" defaultValue="+92 300 1234567" className="w-full p-3 border rounded-lg" />
                    <textarea placeholder="Address" defaultValue="Karachi, Pakistan" className="w-full p-3 border rounded-lg" rows={2} />
                    <button className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">Save</button>
                  </div>
                )}
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'categories' ? null : 'categories')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Categories</h3>
                  <span className="text-2xl">{expandedSection === 'categories' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'categories' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={handleAddCategory} className="px-4 py-2 bg-gold text-white rounded-lg">Add Category</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                      {categories.map((cat) => (
                        <div key={cat.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{cat.name}</h4>
                          <p className="text-sm text-gray-600">{cat.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleEditCategory(cat)} className="text-sm text-blue-600">Edit</button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-sm text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'colors' ? null : 'colors')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Colors</h3>
                  <span className="text-2xl">{expandedSection === 'colors' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'colors' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={handleAddColor} className="px-4 py-2 bg-gold text-white rounded-lg">Add Color</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-4 gap-4">
                      {colors.map((color) => (
                        <div key={color.id} className="border rounded-lg p-4">
                          <div className="w-full h-12 rounded mb-2" style={{ backgroundColor: color.code }}></div>
                          <p className="font-medium text-sm">{color.name}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleEditColor(color)} className="text-xs text-blue-600">Edit</button>
                            <button onClick={() => handleDeleteColor(color.id)} className="text-xs text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Materials */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'materials' ? null : 'materials')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Cloth Materials</h3>
                  <span className="text-2xl">{expandedSection === 'materials' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'materials' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={handleAddMaterial} className="px-4 py-2 bg-gold text-white rounded-lg">Add Material</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-2 gap-4">
                      {materials.map((mat) => (
                        <div key={mat.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{mat.name}</h4>
                          <p className="text-sm text-gray-600">{mat.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleEditMaterial(mat)} className="text-sm text-blue-600">Edit</button>
                            <button onClick={() => handleDeleteMaterial(mat.id)} className="text-sm text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'sizes' ? null : 'sizes')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Sizes</h3>
                  <span className="text-2xl">{expandedSection === 'sizes' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'sizes' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={() => { setEditingSize({ id: Date.now(), name: '', code: '' }); setShowSizeModal(true); }} className="px-4 py-2 bg-gold text-white rounded-lg">Add Size</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-4 gap-4">
                      {sizes.map((size) => (
                        <div key={size.id} className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold">{size.code}</div>
                          <p className="text-sm">{size.name}</p>
                          <div className="flex gap-2 mt-2 justify-center">
                            <button onClick={() => { setEditingSize(size); setShowSizeModal(true); }} className="text-xs text-blue-600">Edit</button>
                            <button onClick={() => { if (confirm('Delete?')) setSizes(sizes.filter(s => s.id !== size.id)); }} className="text-xs text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Patterns */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'patterns' ? null : 'patterns')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Patterns</h3>
                  <span className="text-2xl">{expandedSection === 'patterns' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'patterns' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={() => { setEditingPattern({ id: Date.now(), name: '', description: '' }); setShowPatternModal(true); }} className="px-4 py-2 bg-gold text-white rounded-lg">Add Pattern</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                      {patterns.map((pat) => (
                        <div key={pat.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{pat.name}</h4>
                          <p className="text-sm text-gray-600">{pat.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => { setEditingPattern(pat); setShowPatternModal(true); }} className="text-sm text-blue-600">Edit</button>
                            <button onClick={() => { if (confirm('Delete?')) setPatterns(patterns.filter(p => p.id !== pat.id)); }} className="text-sm text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Occasions */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'occasions' ? null : 'occasions')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Occasions</h3>
                  <span className="text-2xl">{expandedSection === 'occasions' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'occasions' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={() => { setEditingOccasion({ id: Date.now(), name: '', description: '' }); setShowOccasionModal(true); }} className="px-4 py-2 bg-gold text-white rounded-lg">Add Occasion</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                      {occasions.map((occ) => (
                        <div key={occ.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{occ.name}</h4>
                          <p className="text-sm text-gray-600">{occ.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => { setEditingOccasion(occ); setShowOccasionModal(true); }} className="text-sm text-blue-600">Edit</button>
                            <button onClick={() => { if (confirm('Delete?')) setOccasions(occasions.filter(o => o.id !== occ.id)); }} className="text-sm text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'gender' ? null : 'gender')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">Gender</h3>
                  <span className="text-2xl">{expandedSection === 'gender' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'gender' && (
                  <div className="border-t">
                    <div className="p-6 flex justify-end">
                      <button onClick={() => { setEditingGender({ id: Date.now(), name: '', description: '' }); setShowGenderModal(true); }} className="px-4 py-2 bg-gold text-white rounded-lg">Add Gender</button>
                    </div>
                    <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                      {genders.map((gender) => (
                        <div key={gender.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{gender.name}</h4>
                          <p className="text-sm text-gray-600">{gender.description}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => { setEditingGender(gender); setShowGenderModal(true); }} className="text-sm text-blue-600">Edit</button>
                            <button onClick={() => { if (confirm('Delete?')) setGenders(genders.filter(g => g.id !== gender.id)); }} className="text-sm text-red-600">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* General Settings */}
              <div className="bg-white rounded-lg shadow">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'general' ? null : 'general')}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <h3 className="text-xl font-bold">General Settings</h3>
                  <span className="text-2xl">{expandedSection === 'general' ? '−' : '+'}</span>
                </button>
                {expandedSection === 'general' && (
                  <div className="p-6 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <select className="w-full p-3 border rounded-lg">
                        <option>USD ($)</option>
                        <option>PKR (₨)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                      <input type="number" defaultValue="0" className="w-full p-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Shipping Fee ($)</label>
                      <input type="number" defaultValue="0" className="w-full p-3 border rounded-lg" />
                    </div>
                    <button className="px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">Save Settings</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{products.find(p => p.id === editingProduct.id) ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Brand</label>
                <select
                  value={editingProduct.brand}
                  onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {genders.map((gender) => (
                    <label key={gender.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.genders).includes(gender.name)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.genders);
                          setEditingProduct({
                            ...editingProduct,
                            genders: e.target.checked
                              ? [...current, gender.name]
                              : current.filter((x: string) => x !== gender.name),
                          });
                        }}
                      />
                      {gender.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Occasions</label>
                <div className="grid grid-cols-3 gap-2">
                  {occasions.map((occ) => (
                    <label key={occ.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.occasions).includes(occ.name)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.occasions);
                          setEditingProduct({
                            ...editingProduct,
                            occasions: e.target.checked
                              ? [...current, occ.name]
                              : current.filter((x: string) => x !== occ.name),
                          });
                        }}
                      />
                      {occ.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Patterns</label>
                <div className="grid grid-cols-3 gap-2">
                  {patterns.map((pat) => (
                    <label key={pat.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.patterns).includes(pat.name)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.patterns);
                          setEditingProduct({
                            ...editingProduct,
                            patterns: e.target.checked
                              ? [...current, pat.name]
                              : current.filter((x: string) => x !== pat.name),
                          });
                        }}
                      />
                      {pat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sizes</label>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((size) => (
                    <label key={size.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.sizes).includes(size.code)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.sizes);
                          setEditingProduct({
                            ...editingProduct,
                            sizes: e.target.checked
                              ? [...current, size.code]
                              : current.filter((x: string) => x !== size.code),
                          });
                        }}
                      />
                      {size.code}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cloth Materials</label>
                <div className="grid grid-cols-2 gap-2">
                  {materials.map((mat) => (
                    <label key={mat.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.materials).includes(mat.name)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.materials);
                          setEditingProduct({
                            ...editingProduct,
                            materials: e.target.checked
                              ? [...current, mat.name]
                              : current.filter((x: string) => x !== mat.name),
                          });
                        }}
                      />
                      {mat.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Colours</label>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <label key={color.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ensureArray(editingProduct.colors).includes(color.name)}
                        onChange={(e) => {
                          const current = ensureArray(editingProduct.colors);
                          setEditingProduct({
                            ...editingProduct,
                            colors: e.target.checked
                              ? [...current, color.name]
                              : current.filter((x: string) => x !== color.name),
                          });
                        }}
                      />
                      {color.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleSave} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Save Changes
                </button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBrandModal && editingBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingBrand.id > 1000 ? 'Add Brand' : 'Edit Brand'}</h2>
              <button onClick={() => setShowBrandModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Brand Name</label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({...editingBrand, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingBrand.description}
                  onChange={(e) => setEditingBrand({...editingBrand, description: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleSaveBrand} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Save
                </button>
                <button onClick={() => setShowBrandModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingCategory.id > 1000 ? 'Add Category' : 'Edit Category'}</h2>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleSaveCategory} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Save
                </button>
                <button onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showColorModal && editingColor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingColor.id > 1000 ? 'Add Color' : 'Edit Color'}</h2>
              <button onClick={() => setShowColorModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Color Name</label>
                <input
                  type="text"
                  value={editingColor.name}
                  onChange={(e) => setEditingColor({...editingColor, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color Code</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={editingColor.code}
                    onChange={(e) => setEditingColor({...editingColor, code: e.target.value})}
                    className="w-16 h-12 border rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingColor.code}
                    onChange={(e) => setEditingColor({...editingColor, code: e.target.value})}
                    className="flex-1 p-3 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleSaveColor} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Save
                </button>
                <button onClick={() => setShowColorModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMaterialModal && editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingMaterial.id > 1000 ? 'Add Material' : 'Edit Material'}</h2>
              <button onClick={() => setShowMaterialModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Material Name</label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({...editingMaterial, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingMaterial.description}
                  onChange={(e) => setEditingMaterial({...editingMaterial, description: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={handleSaveMaterial} className="flex-1 py-3 bg-gold text-white rounded-lg hover:bg-gold/90">
                  Save
                </button>
                <button onClick={() => setShowMaterialModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSizeModal && editingSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Size</h2>
              <button onClick={() => setShowSizeModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={editingSize.name} onChange={(e) => setEditingSize({...editingSize, name: e.target.value})} className="w-full p-3 border rounded-lg" />
              <input type="text" placeholder="Code" value={editingSize.code} onChange={(e) => setEditingSize({...editingSize, code: e.target.value})} className="w-full p-3 border rounded-lg" />
              <div className="flex gap-4">
                <button onClick={handleSaveSize} className="flex-1 py-3 bg-gold text-white rounded-lg">Save</button>
                <button onClick={() => setShowSizeModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPatternModal && editingPattern && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Pattern</h2>
              <button onClick={() => setShowPatternModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={editingPattern.name} onChange={(e) => setEditingPattern({...editingPattern, name: e.target.value})} className="w-full p-3 border rounded-lg" />
              <textarea placeholder="Description" value={editingPattern.description} onChange={(e) => setEditingPattern({...editingPattern, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} />
              <div className="flex gap-4">
                <button onClick={handleSavePattern} className="flex-1 py-3 bg-gold text-white rounded-lg">Save</button>
                <button onClick={() => setShowPatternModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOccasionModal && editingOccasion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Occasion</h2>
              <button onClick={() => setShowOccasionModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={editingOccasion.name} onChange={(e) => setEditingOccasion({...editingOccasion, name: e.target.value})} className="w-full p-3 border rounded-lg" />
              <textarea placeholder="Description" value={editingOccasion.description} onChange={(e) => setEditingOccasion({...editingOccasion, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} />
              <div className="flex gap-4">
                <button onClick={handleSaveOccasion} className="flex-1 py-3 bg-gold text-white rounded-lg">Save</button>
                <button onClick={() => setShowOccasionModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenderModal && editingGender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gender</h2>
              <button onClick={() => setShowGenderModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Name" value={editingGender.name} onChange={(e) => setEditingGender({...editingGender, name: e.target.value})} className="w-full p-3 border rounded-lg" />
              <textarea placeholder="Description" value={editingGender.description} onChange={(e) => setEditingGender({...editingGender, description: e.target.value})} className="w-full p-3 border rounded-lg" rows={3} />
              <div className="flex gap-4">
                <button onClick={handleSaveGender} className="flex-1 py-3 bg-gold text-white rounded-lg">Save</button>
                <button onClick={() => setShowGenderModal(false)} className="flex-1 py-3 bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

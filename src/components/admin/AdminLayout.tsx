import { type ReactNode, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { checkAdminAccess } from '@/utils/auth';
import { Package, ShoppingCart, Users as UsersIcon, LogOut, LayoutDashboard, Settings, Tag, UserCircle, Star, FolderOpen, ChevronDown, ChevronRight, Heart, ShoppingBag } from 'lucide-react';

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['cms']); // CMS expanded by default

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuItemActive = (item: any) => {
    if (!item?.path) return false;
    const [pathPart, queryPart] = item.path.split('?');
    if (location.pathname !== pathPart) return false;

    if (!queryPart) return true;
    const expectedParams = new URLSearchParams(queryPart);
    const currentParams = new URLSearchParams(location.search);

    for (const [key, value] of expectedParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  };

  // Check if any sub-item is active
  const isSubItemActive = (subItems: any[]) => {
    return subItems.some(sub => isMenuItemActive(sub));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check for JWT token in localStorage (primary auth method)
        const jwtToken = localStorage.getItem('jwt_token');
        const userEmail = localStorage.getItem('user_email');
        
        console.log('🔍 Admin auth check - JWT token:', !!jwtToken, 'Email:', userEmail);

        if (jwtToken && userEmail) {
          // User is authenticated via JWT (backend login)
          const isAdmin = await checkAdminAccess();
          console.log('✅ JWT auth - Admin check result:', isAdmin);
          
          if (!isAdmin) {
            alert('Access denied. Admin privileges required.');
            navigate('/admin/login');
            return;
          }
          setLoading(false);
          return;
        }

        // Fallback: Try Cognito auth (for backward compatibility)
        try {
          await getCurrentUser();
          const isAdmin = await checkAdminAccess();
          if (!isAdmin) {
            alert('Access denied. Admin privileges required.');
            navigate('/admin/login');
            return;
          }
          setLoading(false);
        } catch (cognitoErr) {
          console.log('⚠️ Cognito auth failed, no valid session');
          navigate('/admin/login');
        }
      } catch (err) {
        console.error('❌ Auth check failed:', err);
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Clear JWT token and localStorage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('refreshToken');

      // Try to sign out from Amplify (if used)
      try {
        await signOut();
      } catch (e) {
        // Ignore Amplify sign out errors
      }

      console.log('✅ Admin logged out');
      navigate('/');  // Redirect to home page
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even on error
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_email');
      navigate('/');  // Redirect to home page
    }
  };

  const resolveMenuPath = (id: string) => {
    switch (id) {
      case 'dashboard':
        return '/admin/dashboard?tab=overview';
      case 'products':
        return '/admin/dashboard?tab=products';
      case 'customers':
        return '/admin/dashboard?tab=customers';
      case 'brands':
        return '/admin/dashboard?tab=brands';
      case 'settings':
        return '/admin/dashboard?tab=settings';
      default:
        return '/admin/dashboard';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: resolveMenuPath('dashboard') },
    {
      id: 'cms',
      label: 'CMS',
      icon: FolderOpen,
      subItems: [
        { id: 'featured', label: 'Featured Collection', icon: Star, path: '/admin/featured' },
        { id: 'wedding', label: 'Wedding Tales', icon: Heart, path: '/admin/wedding-tales' },
        { id: 'designers', label: 'Designers Discount', icon: ShoppingBag, path: '/admin/designers-discount' }
      ]
    },
    { id: 'products', label: 'Products', icon: Package, path: resolveMenuPath('products') },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'customers', label: 'Customers', icon: UsersIcon, path: resolveMenuPath('customers') },
    { id: 'users', label: 'Users', icon: UsersIcon, path: '/admin/users' },
    { id: 'brands', label: 'Brands', icon: Tag, path: resolveMenuPath('brands') },
    { id: 'settings', label: 'Settings', icon: Settings, path: resolveMenuPath('settings') },
    { id: 'profile', label: 'Profile', icon: UserCircle, path: '/admin/profile' },
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
            <div key={item.id}>
              {item.subItems ? (
                // Menu with sub-items
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-2 ${
                      location.pathname.startsWith('/admin/' + item.id) || isSubItemActive(item.subItems) ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {expandedMenus.includes(item.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedMenus.includes(item.id) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem: any) => (
                        <button
                          key={subItem.id}
                          onClick={() => navigate(subItem.path)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${
                            location.pathname === subItem.path ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Regular menu item
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                    isMenuItemActive(item) ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              )}
            </div>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 mt-4">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </div>

      <div className="ml-64 flex-1">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}

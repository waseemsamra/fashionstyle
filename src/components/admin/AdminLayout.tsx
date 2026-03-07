import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { checkAdminAccess } from '@/utils/auth';
import { Package, ShoppingCart, Users as UsersIcon, LogOut, LayoutDashboard, Settings, Tag, UserCircle } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/dashboard' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'customers', label: 'Customers', icon: UsersIcon, path: '/admin/dashboard' },
    { id: 'users', label: 'Users', icon: UsersIcon, path: '/admin/users' },
    { id: 'brands', label: 'Brands', icon: Tag, path: '/admin/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/dashboard' },
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
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                location.pathname === item.path ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-100'
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
        {children}
      </div>
    </div>
  );
}

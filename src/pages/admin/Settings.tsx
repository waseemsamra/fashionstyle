import { useState } from 'react';
import { 
  Palette, 
  Shirt, 
  Ruler, 
  Heart, 
  Star, 
  Users,
  Settings as SettingsIcon,
  DollarSign
} from 'lucide-react';
import SimpleSettings from '@/components/admin/SimpleSettings';
import StoreSettings from '@/pages/admin/StoreSettings';
import GeneralSettings from '@/pages/admin/GeneralSettings';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('store');

  const sections = [
    { id: 'store', name: 'Store Information', icon: SettingsIcon },
    { id: 'colors', name: 'Colors', icon: Palette },
    { id: 'materials', name: 'Materials', icon: Shirt },
    { id: 'sizes', name: 'Sizes', icon: Ruler },
    { id: 'patterns', name: 'Patterns', icon: Heart },
    { id: 'occasions', name: 'Occasions', icon: Star },
    { id: 'gender', name: 'Gender', icon: Users },
    { id: 'general', name: 'General Settings', icon: DollarSign },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'store':
        return <StoreSettings />;
      
      case 'colors':
        return (
          <SimpleSettings
            section="colors"
            title="Colors"
            description="Manage color options for products"
            icon={Palette}
            showDescription={true}
            showColor={true}
            showActive={true}
          />
        );
      
      case 'materials':
        return (
          <SimpleSettings
            section="materials"
            title="Materials"
            description="Manage fabric and material options"
            icon={Shirt}
            showDescription={true}
            showActive={true}
          />
        );
      
      case 'sizes':
        return (
          <SimpleSettings
            section="sizes"
            title="Sizes"
            description="Manage size options (S, M, L, XL, etc.)"
            icon={Ruler}
            showDescription={false}
            showActive={true}
          />
        );
      
      case 'patterns':
        return (
          <SimpleSettings
            section="patterns"
            title="Patterns"
            description="Manage pattern options (Solid, Striped, etc.)"
            icon={Heart}
            showDescription={true}
            showActive={true}
          />
        );
      
      case 'occasions':
        return (
          <SimpleSettings
            section="occasions"
            title="Occasions"
            description="Manage occasion options (Casual, Formal, etc.)"
            icon={Star}
            showDescription={true}
            showActive={true}
          />
        );

      case 'gender':
        return (
          <SimpleSettings
            section="gender"
            title="Gender"
            description="Manage gender options (Men, Women, Kids, etc.)"
            icon={Users}
            showDescription={true}
            showActive={true}
          />
        );

      case 'general':
        return <GeneralSettings />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed h-full overflow-y-auto">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeSection === section.id
                    ? 'bg-gold text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="ml-64 flex-1">
        {renderSection()}
      </div>
    </div>
  );
}

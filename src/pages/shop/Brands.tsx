import { BrandsGrid } from '@/components/brands/BrandsGrid';
import { useState } from 'react';

export default function BrandsPage() {
  const [showFeatured, setShowFeatured] = useState(false);

  return (
    <div className="min-h-screen bg-beige-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Brands</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover premium fashion from the world's most celebrated brands
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowFeatured(false)}
            className={`px-6 py-2 rounded-full transition ${
              !showFeatured 
                ? 'bg-gold text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Brands
          </button>
          <button
            onClick={() => setShowFeatured(true)}
            className={`px-6 py-2 rounded-full transition ${
              showFeatured 
                ? 'bg-gold text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Featured Brands
          </button>
        </div>

        {/* Brands Grid */}
        <BrandsGrid />
      </div>
    </div>
  );
}

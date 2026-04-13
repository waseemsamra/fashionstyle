import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://tmdoc0q5ij.execute-api.us-east-1.amazonaws.com';
const BRANDS_API_URL = `${API_URL}/admin/brands`;

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  active?: boolean;
  products?: number;
}

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await fetch(BRANDS_API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const brandsData = data.brands || data.items || [];
      setBrands(brandsData);
    } catch (error) {
      console.error('❌ Failed to load brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  const filteredBrands = useMemo(() => {
    let filtered = sortedBrands;

    if (searchTerm) {
      filtered = filtered.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedLetter !== 'ALL' && !searchTerm) {
      filtered = filtered.filter(b => b.name.charAt(0).toUpperCase() === selectedLetter);
    }

    return filtered;
  }, [sortedBrands, selectedLetter, searchTerm]);

  const groupedBrands = useMemo(() => {
    const groups: Record<string, Brand[]> = {};
    filteredBrands.forEach(brand => {
      const letter = brand.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(brand);
    });
    return groups;
  }, [filteredBrands]);

  const carouselBrands = sortedBrands.slice(0, 20);
  const visibleBrands = 4;
  const maxIndex = Math.max(0, carouselBrands.length - visibleBrands);

  const scrollCarousel = (dir: 'left' | 'right') => {
    setCarouselIndex(prev => {
      if (dir === 'left') return Math.max(0, prev - 1);
      return Math.min(maxIndex, prev + 1);
    });
  };

  const createSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-8">Brands</h1>

        {/* Brand Logos Carousel */}
        {carouselBrands.length > 0 && (
          <div className="relative mb-8">
            <button
              onClick={() => scrollCarousel('left')}
              disabled={carouselIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-600 text-white p-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="overflow-hidden mx-8">
              <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${carouselIndex * (100 / visibleBrands)}%)` }}>
                {carouselBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    to={`/brand/${createSlug(brand.name)}`}
                    className="flex-shrink-0 w-1/4 border border-gray-200 rounded-lg p-6 flex items-center justify-center bg-white hover:border-gold/30 transition"
                  >
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="max-h-16 w-auto object-contain" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">{brand.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            <button
              onClick={() => scrollCarousel('right')}
              disabled={carouselIndex >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-600 text-white p-2 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a brand..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) setSelectedLetter('ALL');
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gold/50"
            />
          </div>
        </div>

        {/* Alphabet Filter */}
        <div className="flex flex-wrap justify-center gap-1 mb-10">
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => {
                setSelectedLetter(letter);
                setSearchTerm('');
              }}
              className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-sm transition ${
                selectedLetter === letter
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Brands Grouped by Letter */}
        {filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No brands found</p>
          </div>
        ) : (
          Object.entries(groupedBrands).map(([letter, letterBrands]) => (
            <div key={letter} className="mb-10">
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">{letter}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-3">
                {letterBrands.map(brand => (
                  <Link
                    key={brand.id}
                    to={`/brand/${createSlug(brand.name)}`}
                    className="text-sm text-gray-700 hover:text-gold transition-colors py-1"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


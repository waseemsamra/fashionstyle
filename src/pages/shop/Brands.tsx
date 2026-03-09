import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBrands } from '@/services/brandService';

interface Brand {
  id: string;
  name: string;
  description?: string;
  products?: number;
}

export default function Brands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      console.log('🏷️ Loading brands from DynamoDB...');
      const brandsData = await getAllBrands();
      
      // Handle both array and object responses
      const brandsArray = Array.isArray(brandsData) 
        ? brandsData 
        : (brandsData as any).brands || (brandsData as any).items || [];
      
      console.log('✅ Loaded', brandsArray.length, 'brands from DynamoDB');
      setBrands(brandsArray);
    } catch (error) {
      console.error('❌ Failed to load brands:', error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedBrands = brands.reduce((acc, brand) => {
    const firstLetter = brand.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  const sortedLetters = Object.keys(groupedBrands).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Carousel Section */}
      <div className="bg-white py-8 overflow-hidden">
        <div className="animate-scroll flex gap-8 whitespace-nowrap">
          {[...brands, ...brands].map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}  // ✅ Added unique key
              className="inline-flex items-center justify-center px-6 py-3 bg-beige-50 rounded-lg min-w-[200px]"
            >
              <span className="font-medium text-gray-700">{brand.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brands List */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Our Brands</h1>

        {brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No brands available</p>
          </div>
        ) : (
          <>
            {/* Alphabet Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {sortedLetters.map((letter) => (
                <a
                  key={letter}
                  href={`#${letter}`}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-gold hover:text-white transition font-semibold"
                >
                  {letter}
                </a>
              ))}
            </div>

            {/* Brands by Letter */}
            <div className="space-y-12">
              {sortedLetters.map((letter) => (
                <div key={letter} id={letter} className="scroll-mt-24">
                  <h2 className="text-3xl font-bold mb-6 text-gold">{letter}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedBrands[letter].map((brand) => (
                      <div
                        key={brand.id}
                        onClick={() => navigate(`/brand/${encodeURIComponent(brand.name)}`)}
                        className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:scale-105"
                      >
                        <p className="font-medium text-gray-800">{brand.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

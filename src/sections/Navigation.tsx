import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Search, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { featuredProducts, newArrivals } from '@/data/products';

const brands = [
  'AIK Atelier', 'AJR Couture - Abbas Jamil Rajpoot', 'AR Apparel', 'AWA Scrunchies', 'AY Textile',
  'Aabyaan', 'Aahang', 'Aalaya', 'Aayra', 'Abaan Zohan', 'Abaya pk', 'Adaa By Mahnoor',
  "Adam's Couture", 'Addee', 'Afrozeh', 'Aisha Fatema', 'Aizaz Zafar', 'Akbar Aslam',
  'Al Dawood Textile', 'Al Harir Apparel', 'Al Karam', 'Al Siyaab', 'Al Zohaib', 'Aleen',
  'Alif Yay', 'Alizeh Fashion by Bilal Embroidery', 'Amal', 'Ameerah Usman', 'Anayra Amal',
  'Annafeu Apparels', 'Annara Begum', 'Annus Abrar', 'Ansab Jahangir', 'Apricocia', 'Aqs n Man',
  'Arif Ashraf', 'Artistic Wear', 'Asifa & Nabeel', 'Asim Jofa', 'Atiya Irfan Studio',
  'Avyana', 'Awwal', 'Ayesha Closet', 'Ayla Studio', 'Aylin', 'Ayzel By Afrozeh', 'Azure',
  'Azzal By Ayesha & Usman', 'BURAQ', 'Baby Nest', 'Bagsify', 'Banafsheh', 'Bareeq', 'Baroque',
  'Beechtree', 'Bibayas', 'Bin Ilyas', 'Bin Musab', 'Bin Saeed', 'Blanche Fashion',
  'Brands & Blends', 'Brumano', 'Buraq Online', 'Bonanza Satrangi', 'Canvas Gallery',
  'Casual Lite', 'Chandan Nagri', 'Charizma', 'Cheeco Chic', 'Clarity Glam',
  'Coco By Zara Shahjahan', 'Crimson', 'Cross Stitch', 'Cyanic', 'Damask Clothing Studio',
  'Deck Up', 'Dhaga', 'Dhanak', 'Dhara Couture', 'Diara Couture', 'Divinely Crafted',
  'Dot & Dot', 'Diners', 'Deepak Perwani', 'Dhaani', 'Edge Republic', 'Edowlark', 'Eileen',
  'Elaf', 'Elan', 'Elegance', 'Eleshia', 'Emaan Adeel', 'Eman Butt', 'Erum Khan', 'Esmel',
  'Esra Fashion', 'Ezra', 'Ethnic', 'Embroidered', 'Fabiha Fatima', 'Fabrich', 'Fahza',
  'Fais Couture', 'Faiza Faisal', 'Faiza Saqlain', 'Farah Agha', 'Farah Talib', 'Farasha',
  'Fascino', 'Fashion With Style Hub', 'Fauve', 'Feathers', 'Feroza', 'Filly', 'Fine Tex',
  'Fiona', 'Firdous Fashion', 'Florent', 'Flossie', 'Fozia Khalid', 'Freesia Premium',
  'Farah Talib Aziz', 'Firdous', 'Feeha Jamshed', 'Garnet Clothing Pret', 'Gem Garments',
  'Gisele', 'Gul Ahmed', 'Gulaal', 'Gulmina', 'Gulposh', 'Generation', 'HEM', 'HK Fashion',
  'HZ Textiles', 'Hana', 'Hanim', 'Haniya Mahnoor', 'Happy Princess', 'Hareem Fatima',
  'Hassan Jee', 'Hijab ul Ameer', 'House of Maryum N Maria', 'House of Nawab',
  'House of Nyyra', 'Hues Atelier', 'Humdum', 'Hussain Rehar', 'Hypnotic', 'HSY',
  'House of Ittehad', 'IQ Exclusive', 'Ibraysha', 'Imran Aftab', 'Imran Ramzan',
  'Imrozia Premium', 'Inayat', 'Innovative Official', 'Insiya Clothing', 'Ixample', 'Izel',
  'Iznik', 'Ideas', 'Imrozia', 'Javeria khalid', 'Jazmin', 'Jild', 'Junaid Jamshed', 'Jeem',
  'Kahf Premium', 'Kanwal Malik', 'Kanwal Zainab', 'Karashe', 'Kesori', 'Ketifa',
  'Khaatoon Clothing', 'Khair-ul-wara', "Khan's Wear", 'Khurshid', 'Khussa Darbar',
  'Khuwab by Kazma', 'Khaadi', 'Kayseria', 'Kross Kulture', 'La Khilaba', 'La Rosaa',
  'Label M', 'Lafanzo', 'Lajwanti', 'Lakhany', 'Lamorado', 'Lapel By Gem Garments',
  'Lavish Premium', 'Lawrencepur', 'Layout', 'Leena Fatima', 'LimeLight', 'LuxebyFatima',
  'Lawn Studio', 'Lala Textiles', 'MHK Pret', 'MIRAS', 'MOB', 'Madame', 'Madiha Gohar',
  'Maham Sultan', 'Mahiymaan By Al Zohaib', 'Mahnoor Ejaaz', 'Mahnur', 'Mahroo',
  'Malika Shahnaz', 'Malook By Shazia Ovais', 'Manahils', 'Manara', 'Manara by Maria',
  'Mannat Clothing', 'Marasim', 'Mardaz Fashion', 'Maria B', 'Maria Osama Khan',
  'Mariam Malik London', 'Maroon by Iqra Chaudhry', 'Marwat Textiles', 'Maryam Hussain',
  'Maryum Hussain', 'Maryum N Maria', 'Mashq', 'Mashriki', 'Mavie', 'Mazham',
  'MeBae Apparel', 'Meerak', 'Meeral', 'Meerina By Hinshah', 'Mehak Yaqoob', 'Mina Hasan',
  'Minahil Collections', 'Minutiae', 'Misaal by Ayesha Somaya', 'Modest', 'Mohagni',
  'Mohsin Naveed Ranjha - MNR', 'Mom4Little', 'Mona Embroidery', 'Morbagh by Beechtree',
  'Motifz', 'Movement', 'Muneefa Naz', 'Muraad', 'Muraqsh', 'Musferah Saad', 'Mushq',
  'Muzains', 'Myeesha', 'Maheen Karim', 'Mausummery', 'Naayas', 'Naaz Couture', 'Nadia Khan',
  "Narmin by Narkin's", 'Nayab', 'Nazmina', 'Neeshay', 'Nisa Hussain', 'Nosheen Khalid',
  'Nishat Linen', 'Nomi Ansari', 'Nimsay', 'Ochre', 'Omal by Komal', 'Ombrella Official',
  'On Your Feets', 'Orient Textile', 'Outfitters', 'Orient Textiles', 'Oyemah', 'PSK Couture',
  'Pakdaman', 'Panache Apparel', 'Paras by Pasha', 'Parishay', 'Pashma Khan', 'Pashmire',
  'Plush Mink', 'Pret Bee', 'Pret by Kayseria', 'Phatyma Khan', 'Panache', 'Qalamkar',
  'Qurratulain Saqib', 'Qline', 'REET CLOTHING', 'RTW Creation', "Rabia's Textiles",
  'RajBari', 'Rajwani By HM', 'Ramsha', 'Rang Rasiya', 'Rangeen', 'Real Image', "Reeza's",
  'Regalia Textiles', 'Rehan N Muzammil', 'Reign', 'Republic WomensWear', 'Resham Ghar',
  'Retro', 'Riaz Arts', 'Ricamo', 'Riley', 'Ripret', 'Roheenaz', 'Ruby Suleiman',
  'Rozina Munib', 'Republic', 'SEJ', 'Saadia Asad', 'Sable Vogue', 'Sadaf Fawad Khan',
  'Saffron', 'Safwa', 'Sahane', 'Saheliyan', 'Saira Rizwan', 'Saira Shakira', 'Saira Sultana',
  'Salitex', 'Sana Safinaz', "Sana Sarah's Salon", 'Sanaulla Exclusive Range', 'Sania Khan',
  'Saphron', 'Sara Jahan', 'Sardinia', 'Sarkhail', 'Scherezade', 'Seran', 'Seraph',
  'Serene Premium', 'Shahjahan', 'Shahzeb Textiles', 'Shamaeel Ansari', 'Shamooz',
  'Shariq Textiles', 'Shazme', 'Sheen By Shaista Lodhi', 'Shiza Hassan', 'Shurooq',
  'Sidra Aleem', 'Silcot', 'Sitara', 'Sk by Sahar Kashif', 'Sobia Nazir', 'Sprinkles',
  'Stitch Vibes', 'Strawberry', 'Studio By ARJ', 'Stylish Garments', 'Suffuse by Sana Yasir',
  'Sundas Ahad', 'Syah', 'sahar', 'Sapphire', 'Suffuse', 'Shehla Chatoor', 'TNG', 'Tabeer',
  'Tahra By Zainab Chottani', 'Tana Bana', 'Tassawur', 'Tassels', 'Tawakkal Fabrics',
  'Tee Zania', 'TeeKayDot', 'Tessa', 'Textilelime', 'The Girl Store', 'The Great Master (TGM)',
  'The Slay Wear', 'Threads & Motifs', 'Threads & Weaves', 'Topnotch', 'Tosheeza Saith',
  'Taana Baana', 'Tena Durrani', 'URBAN CUT', 'Unstitched', 'Umsha by Uzma Babar',
  'VS Textiles', 'Valerie', 'Vibgyor Fashion', 'Vitalia', 'Vivawalk', 'Vaneeza Ahmed',
  'Veena Durrani', 'Wardha Saleem', 'Wearik', 'Warda', 'Warda Saleem', 'Wardha',
  'Xenia Formals', 'Xevor', 'Xenia', 'Yusra Ansari', 'Yasmeen Jiwa', 'Yolo', 'ZEB', 'ZLooms',
  'ZS Textiles', 'Zaaviay', 'Zaha By Khadijah Shah', 'Zaib un Nisa', 'Zainab Chottani',
  'Zainab Hasan', 'Zam Zam', 'Zar', 'Zara Shahjahan', 'Zara Yamin', 'Zarah & Sarah', 'Zaren',
  'Zarif', 'Zariya', 'Zarizaa', 'Zarposh', 'Zarqash', 'Zauk', 'Zeek Store', 'Zellbury',
  'Zenyre', 'Ziara pk', 'Ziphyer', 'Zohan Ateeq', 'Zouhaira', 'Zouj', 'Zoya & Fatima',
  'Zunuj', 'Zuri', 'Zuruj', 'Zyna', 'Zyra', 'Zeen', 'Zonia Anwaar'
];

const allProducts = [...featuredProducts, ...newArrivals];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Brands', href: '/brands' },
    { name: 'Collection', href: '/#featured' },
    { name: 'New Arrivals', href: '/#new-arrivals' },
    { name: 'About', href: '/#about' },
  ];

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <span className={`font-playfair text-2xl md:text-3xl font-semibold tracking-tight transition-colors duration-300 ${
              isScrolled ? 'text-black' : 'text-white'
            }`}>
              Noor
            </span>
            <span className={`font-dancing text-lg md:text-xl transition-colors duration-300 ${
              isScrolled ? 'text-gold' : 'text-white/90'
            }`}>
              by Faisal
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.href.startsWith('/#')) {
                    e.preventDefault();
                    const id = link.href.substring(2);
                    const element = document.getElementById(id);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`text-sm font-medium tracking-wide underline-animation transition-colors duration-300 ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setShowSearch(true)}
              className={`p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/admin/login')}
              className={`hidden md:block p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button
                  className={`relative p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                    isScrolled ? 'text-black' : 'text-white'
                  }`}
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-xs font-medium rounded-full flex items-center justify-center animate-scale-in">
                      {totalItems}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white">
                <SheetHeader>
                  <SheetTitle className="font-playfair text-2xl">Shopping Cart</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col h-[calc(100vh-180px)]">
                  {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">Your cart is empty</p>
                      <p className="text-sm text-gray-400 mt-1">Add some items to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto space-y-4 pr-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 p-3 bg-beige-50 rounded-lg"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-24 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-gold font-semibold mt-1">
                                ${item.price}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-playfair text-xl font-semibold">
                            ${totalPrice.toFixed(2)}
                          </span>
                        </div>
                        <Button 
                          onClick={() => {
                            setIsCartOpen(false);
                            navigate('/checkout');
                          }}
                          className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6"
                        >
                          Proceed to Checkout
                        </Button>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="w-full text-center text-sm text-gray-500 hover:text-black transition-colors"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-full transition-all duration-300 hover:bg-black/5 ${
                isScrolled ? 'text-black' : 'text-white'
              }`}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            isMobileMenuOpen ? 'max-h-96 mt-4' : 'max-h-0'
          }`}
        >
          <div className={`py-4 space-y-3 ${isScrolled ? 'bg-white' : 'bg-black/20 backdrop-blur-md'} rounded-lg px-4`}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  isScrolled ? 'text-black' : 'text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>

    {showSearch && (
      <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or brands..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gold"
                autoFocus
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {searchQuery.length >= 3 && (() => {
              const query = searchQuery.toLowerCase();
              const matchedProducts = allProducts.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
              );
              const matchedBrands = brands.filter(b => 
                b.toLowerCase().includes(query)
              );
              
              return (
                <div className="space-y-8">
                  {matchedProducts.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Products ({matchedProducts.length})</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {matchedProducts.map(product => (
                          <div
                            key={product.id}
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              setShowSearch(false);
                              setSearchQuery('');
                            }}
                            className="flex gap-4 p-4 bg-beige-50 rounded-lg cursor-pointer hover:shadow-lg transition"
                          >
                            <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded" />
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.category}</p>
                              <p className="text-gold font-semibold mt-1">${product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {matchedBrands.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Brands ({matchedBrands.length})</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {matchedBrands.map(brand => (
                          <div
                            key={brand}
                            onClick={() => {
                              navigate(`/brand/${encodeURIComponent(brand)}`);
                              setShowSearch(false);
                              setSearchQuery('');
                            }}
                            className="p-4 bg-beige-50 rounded-lg cursor-pointer hover:shadow-lg transition"
                          >
                            <p className="font-medium">{brand}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {matchedProducts.length === 0 && matchedBrands.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No results found for "{searchQuery}"</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

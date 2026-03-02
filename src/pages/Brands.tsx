import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const brands = [
  'AIK Atelier', 'AJR Couture - Abbas Jamil Rajpoot', 'AR Apparel', 'AWA Scrunchies', 'AY Textile',
  'Aabyaan', 'Aahang', 'Aalaya', 'Aayra', 'Abaan Zohan', 'Abaya pk', 'Adaa By Mahnoor',
  "Adam's Couture", 'Addee', 'Afrozeh', 'Aisha Fatema', 'Aizaz Zafar', 'Akbar Aslam',
  'Al Dawood Textile', 'Al Harir Apparel', 'Al Karam', 'Al Siyaab', 'Al Zohaib', 'Aleen',
  'Alif Yay', 'Alizeh Fashion by Bilal Embroidery', 'Amal', 'Ameerah Usman', 'Anayra Amal',
  'Annafeu Apparels', 'Annara Begum', 'Annus Abrar', 'Ansab Jahangir', 'Apricocia', 'Aqs n Man',
  'Arif Ashraf', 'Artistic Wear', 'Asifa & Nabeel', 'Asim Jofa', 'Atiya Irfan Studio',
  'Avyana', 'Awwal', 'Ayesha Closet', 'Ayla Studio', 'Aylin', 'Ayzel By Afrozeh', 'Azure',
  'Azzal By Ayesha & Usman',
  'BURAQ', 'Baby Nest', 'Bagsify', 'Banafsheh', 'Bareeq', 'Baroque', 'Beechtree', 'Bibayas',
  'Bin Ilyas', 'Bin Musab', 'Bin Saeed', 'Blanche Fashion', 'Brands & Blends', 'Brumano', 'Buraq Online',
  'Bonanza Satrangi',
  'Canvas Gallery', 'Casual Lite', 'Chandan Nagri', 'Charizma', 'Cheeco Chic', 'Clarity Glam',
  'Coco By Zara Shahjahan', 'Crimson', 'Cross Stitch', 'Cyanic',
  'Damask Clothing Studio', 'Deck Up', 'Dhaga', 'Dhanak', 'Dhara Couture', 'Diara Couture',
  'Divinely Crafted', 'Dot & Dot', 'Diners', 'Deepak Perwani', 'Dhaani',
  'Edge Republic', 'Edowlark', 'Eileen', 'Elaf', 'Elan', 'Elegance', 'Eleshia', 'Emaan Adeel',
  'Eman Butt', 'Erum Khan', 'Esmel', 'Esra Fashion', 'Ezra', 'Ethnic', 'Embroidered',
  'Fabiha Fatima', 'Fabrich', 'Fahza', 'Fais Couture', 'Faiza Faisal', 'Faiza Saqlain',
  'Farah Agha', 'Farah Talib', 'Farasha', 'Fascino', 'Fashion With Style Hub', 'Fauve',
  'Feathers', 'Feroza', 'Filly', 'Fine Tex', 'Fiona', 'Firdous Fashion', 'Florent',
  'Flossie', 'Fozia Khalid', 'Freesia Premium', 'Farah Talib Aziz', 'Firdous', 'Feeha Jamshed',
  'Garnet Clothing Pret', 'Gem Garments', 'Gisele', 'Gul Ahmed', 'Gulaal', 'Gulmina',
  'Gulposh', 'Generation',
  'HEM', 'HK Fashion', 'HZ Textiles', 'Hana', 'Hanim', 'Haniya Mahnoor', 'Happy Princess',
  'Hareem Fatima', 'Hassan Jee', 'Hijab ul Ameer', 'House of Maryum N Maria', 'House of Nawab',
  'House of Nyyra', 'Hues Atelier', 'Humdum', 'Hussain Rehar', 'Hypnotic', 'HSY', 'House of Ittehad',
  'IQ Exclusive', 'Ibraysha', 'Imran Aftab', 'Imran Ramzan', 'Imrozia Premium', 'Inayat',
  'Innovative Official', 'Insiya Clothing', 'Ixample', 'Izel', 'Iznik', 'Ideas', 'Imrozia',
  'Javeria khalid', 'Jazmin', 'Jild', 'Junaid Jamshed', 'Jeem',
  'Kahf Premium', 'Kanwal Malik', 'Kanwal Zainab', 'Karashe', 'Kesori', 'Ketifa',
  'Khaatoon Clothing', 'Khair-ul-wara', "Khan's Wear", 'Khurshid', 'Khussa Darbar',
  'Khuwab by Kazma', 'Khaadi', 'Kayseria', 'Kross Kulture',
  'La Khilaba', 'La Rosaa', 'Label M', 'Lafanzo', 'Lajwanti', 'Lakhany', 'Lamorado',
  'Lapel By Gem Garments', 'Lavish Premium', 'Lawrencepur', 'Layout', 'Leena Fatima',
  'LimeLight', 'LuxebyFatima', 'Lawn Studio', 'Lala Textiles',
  'MHK Pret', 'MIRAS', 'MOB', 'Madame', 'Madiha Gohar', 'Maham Sultan', 'Mahiymaan By Al Zohaib',
  'Mahnoor Ejaaz', 'Mahnur', 'Mahroo', 'Malika Shahnaz', 'Malook By Shazia Ovais', 'Manahils',
  'Manara', 'Manara by Maria', 'Mannat Clothing', 'Marasim', 'Mardaz Fashion', 'Maria B',
  'Maria Osama Khan', 'Mariam Malik London', 'Maroon by Iqra Chaudhry', 'Marwat Textiles',
  'Maryam Hussain', 'Maryum Hussain', 'Maryum N Maria', 'Mashq', 'Mashriki', 'Mavie', 'Mazham',
  'MeBae Apparel', 'Meerak', 'Meeral', 'Meerina By Hinshah', 'Mehak Yaqoob', 'Mina Hasan',
  'Minahil Collections', 'Minutiae', 'Misaal by Ayesha Somaya', 'Modest', 'Mohagni',
  'Mohsin Naveed Ranjha - MNR', 'Mom4Little', 'Mona Embroidery', 'Morbagh by Beechtree', 'Motifz',
  'Movement', 'Muneefa Naz', 'Muraad', 'Muraqsh', 'Musferah Saad', 'Mushq', 'Muzains', 'Myeesha',
  'Maheen Karim', 'Mausummery',
  'Naayas', 'Naaz Couture', 'Nadia Khan', "Narmin by Narkin's", 'Nayab', 'Nazmina', 'Neeshay',
  'Nisa Hussain', 'Nosheen Khalid', 'Nishat Linen', 'Nomi Ansari', 'Nimsay',
  'Ochre', 'Omal by Komal', 'Ombrella Official', 'On Your Feets', 'Orient Textile',
  'Outfitters', 'Orient Textiles', 'Oyemah',
  'PSK Couture', 'Pakdaman', 'Panache Apparel', 'Paras by Pasha', 'Parishay', 'Pashma Khan',
  'Pashmire', 'Plush Mink', 'Pret Bee', 'Pret by Kayseria', 'Phatyma Khan', 'Panache',
  'Qalamkar', 'Qurratulain Saqib', 'Qline',
  'REET CLOTHING', 'RTW Creation', "Rabia's Textiles", 'RajBari', 'Rajwani By HM', 'Ramsha',
  'Rang Rasiya', 'Rangeen', 'Real Image', "Reeza's", 'Regalia Textiles', 'Rehan N Muzammil',
  'Reign', 'Republic WomensWear', 'Resham Ghar', 'Retro', 'Riaz Arts', 'Ricamo', 'Riley',
  'Ripret', 'Roheenaz', 'Ruby Suleiman', 'Rozina Munib', 'Republic',
  'SEJ', 'Saadia Asad', 'Sable Vogue', 'Sadaf Fawad Khan', 'Saffron', 'Safwa', 'Sahane',
  'Saheliyan', 'Saira Rizwan', 'Saira Shakira', 'Saira Sultana', 'Salitex', 'Sana Safinaz',
  "Sana Sarah's Salon", 'Sanaulla Exclusive Range', 'Sania Khan', 'Saphron', 'Sara Jahan',
  'Sardinia', 'Sarkhail', 'Scherezade', 'Seran', 'Seraph', 'Serene Premium', 'Shahjahan',
  'Shahzeb Textiles', 'Shamaeel Ansari', 'Shamooz', 'Shariq Textiles', 'Shazme',
  'Sheen By Shaista Lodhi', 'Shiza Hassan', 'Shurooq', 'Sidra Aleem', 'Silcot', 'Sitara',
  'Sk by Sahar Kashif', 'Sobia Nazir', 'Sprinkles', 'Stitch Vibes', 'Strawberry', 'Studio By ARJ',
  'Stylish Garments', 'Suffuse by Sana Yasir', 'Sundas Ahad', 'Syah', 'sahar', 'Sapphire', 'Suffuse', 'Shehla Chatoor',
  'TNG', 'Tabeer', 'Tahra By Zainab Chottani', 'Tana Bana', 'Tassawur', 'Tassels', 'Tawakkal Fabrics',
  'Tee Zania', 'TeeKayDot', 'Tessa', 'Textilelime', 'The Girl Store', 'The Great Master (TGM)',
  'The Slay Wear', 'Threads & Motifs', 'Threads & Weaves', 'Topnotch', 'Tosheeza Saith',
  'Taana Baana', 'Tena Durrani',
  'URBAN CUT', 'Unstitched', 'Umsha by Uzma Babar',
  'VS Textiles', 'Valerie', 'Vibgyor Fashion', 'Vitalia', 'Vivawalk', 'Vaneeza Ahmed', 'Veena Durrani',
  'Wardha Saleem', 'Wearik', 'Warda', 'Warda Saleem', 'Wardha',
  'Xenia Formals', 'Xevor', 'Xenia',
  'Yusra Ansari', 'Yasmeen Jiwa', 'Yolo',
  'ZEB', 'ZLooms', 'ZS Textiles', 'Zaaviay', 'Zaha By Khadijah Shah', 'Zaib un Nisa',
  'Zainab Chottani', 'Zainab Hasan', 'Zam Zam', 'Zar', 'Zara Shahjahan', 'Zara Yamin',
  'Zarah & Sarah', 'Zaren', 'Zarif', 'Zariya', 'Zarizaa', 'Zarposh', 'Zarqash', 'Zauk',
  'Zeek Store', 'Zellbury', 'Zenyre', 'Ziara pk', 'Ziphyer', 'Zohan Ateeq', 'Zouhaira',
  'Zouj', 'Zoya & Fatima', 'Zunuj', 'Zuri', 'Zuruj', 'Zyna', 'Zyra', 'Zeen', 'Zonia Anwaar'
];

export default function Brands() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const groupedBrands = brands.reduce((acc, brand) => {
    const firstLetter = brand[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(brand);
    return acc;
  }, {} as Record<string, string[]>);

  const sortedLetters = Object.keys(groupedBrands).sort();

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Carousel Section */}
      <div className="bg-white py-8 overflow-hidden">
        <div className="animate-scroll flex gap-8 whitespace-nowrap">
          {[...brands, ...brands].map((brand, index) => (
            <div
              key={index}
              className="inline-flex items-center justify-center px-6 py-3 bg-beige-50 rounded-lg min-w-[200px]"
            >
              <span className="font-medium text-gray-700">{brand}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Brands List */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Our Brands</h1>
        
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
                    key={brand}
                    onClick={() => navigate(`/brand/${encodeURIComponent(brand)}`)}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer hover:scale-105"
                  >
                    <p className="font-medium text-gray-800">{brand}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

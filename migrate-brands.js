/**
 * Brand Migration Script
 * Upload all hardcoded brands to DynamoDB
 * 
 * Run this in browser console on Admin Dashboard page
 */

// Hardcoded brands from the app
const HARDCODED_BRANDS = [
  { name: 'Al Karam', description: 'Premium Pakistani fashion' },
  { name: 'Gul Ahmed', description: 'Traditional & modern wear' },
  { name: 'Maria B', description: 'Luxury bridal collection' },
  { name: 'Khaadi', description: 'Contemporary fashion' },
  { name: 'Sana Safinaz', description: 'Designer wear' },
  { name: 'Nishat Linen', description: 'Quality fabrics' },
  { name: 'Bonanza', description: 'Mens fashion' },
  { name: 'Outfitters', description: 'Youth fashion' },
  { name: 'Levi\'s', description: 'Denim & casual wear' },
  { name: 'Nike', description: 'Sportswear' },
  { name: 'Adidas', description: 'Sportswear & athletic wear' },
  { name: 'H&M', description: 'Fast fashion' },
  { name: 'Zara', description: 'Contemporary fashion' },
  { name: 'Uniqlo', description: 'Casual wear' },
  { name: 'Gap', description: 'American casual wear' },
  { name: 'Ralph Lauren', description: 'Luxury fashion' },
  { name: 'Hugo Boss', description: 'Premium menswear' },
  { name: 'Calvin Klein', description: 'Designer fashion' },
  { name: 'Tommy Hilfiger', description: 'American designer wear' },
  { name: 'Lacoste', description: 'Sporty elegance' },
  { name: 'Puma', description: 'Athletic wear' },
  { name: 'Reebok', description: 'Fitness & athletic wear' },
  { name: 'Under Armour', description: 'Performance wear' },
  { name: 'The North Face', description: 'Outdoor apparel' },
  { name: 'Columbia', description: 'Outdoor clothing' },
  { name: 'Patagonia', description: 'Sustainable outdoor wear' },
  { name: 'Timberland', description: 'Outdoor footwear & clothing' },
  { name: 'Carhartt', description: 'Workwear' },
  { name: 'Diesel', description: 'Denim & lifestyle' },
  { name: 'Armani', description: 'Luxury Italian fashion' },
  { name: 'Versace', description: 'Italian luxury fashion' },
  { name: 'Gucci', description: 'Italian luxury goods' },
  { name: 'Prada', description: 'Luxury fashion house' },
  { name: 'Louis Vuitton', description: 'French luxury fashion' },
  { name: 'Chanel', description: 'French luxury fashion' },
  { name: 'Dior', description: 'French luxury goods' },
  { name: 'Burberry', description: 'British luxury fashion' },
  { name: 'Fendi', description: 'Italian luxury fashion' },
  { name: 'Balenciaga', description: 'Luxury fashion house' },
  { name: 'Givenchy', description: 'French luxury fashion' },
  { name: 'Saint Laurent', description: 'French luxury fashion' },
  { name: 'Valentino', description: 'Italian luxury fashion' },
  { name: 'Dolce & Gabbana', description: 'Italian luxury fashion' },
  { name: 'Alexander McQueen', description: 'British luxury fashion' },
  { name: 'Off-White', description: 'Luxury streetwear' },
  { name: 'Supreme', description: 'Streetwear' },
  { name: 'Stone Island', description: 'Italian sportswear' },
  { name: 'Moncler', description: 'Luxury outerwear' },
  { name: 'Canada Goose', description: 'Luxury outerwear' },
  { name: 'Elan', description: 'Pakistani designer wear' },
  { name: 'Asim Jofa', description: 'Pakistani bridal wear' },
  { name: 'Faraz Manan', description: 'Pakistani formal wear' },
  { name: 'Sapphire', description: 'Pakistani high street fashion' },
  { name: 'BeechTree', description: 'Pakistani fashion' },
  { name: 'Ideas', description: 'Pakistani fabrics' },
  { name: 'Charizma', description: 'Pakistani designer wear' },
  { name: 'Imrozia', description: 'Pakistani designer wear' },
  { name: 'Zeen', description: 'Pakistani fashion' },
  { name: 'Generation', description: 'Pakistani contemporary fashion' },
  { name: 'Khaadi Kids', description: 'Children fashion' },
  { name: 'Minnie Minors', description: 'Kids fashion' },
  { name: 'Hopscotch', description: 'Kids clothing' }
];

async function migrateBrandsToDynamoDB() {
  const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    console.error('❌ Not authenticated! Please login as admin first.');
    return;
  }

  console.log('🚀 Starting brand migration...');
  console.log('📦 Total brands to migrate:', HARDCODED_BRANDS.length);
  
  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const brand of HARDCODED_BRANDS) {
    try {
      console.log(`🏷️ Creating brand: ${brand.name}...`);
      
      const response = await fetch(`${API_URL}/admin/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: brand.name,
          description: brand.description,
          products: 0,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Created: ${brand.name} (ID: ${data.id})`);
        successCount++;
        results.push({ name: brand.name, status: 'success', id: data.id });
      } else {
        const error = await response.json();
        console.error(`❌ Failed: ${brand.name} - ${error.message}`);
        failCount++;
        results.push({ name: brand.name, status: 'failed', error: error.message });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error creating ${brand.name}:`, error);
      failCount++;
      results.push({ name: brand.name, status: 'error', error: error.message });
    }
  }

  console.log('\n🎉 Migration Complete!');
  console.log('✅ Success:', successCount);
  console.log('❌ Failed:', failCount);
  console.log('📊 Results:', results);

  // Download results as JSON
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brand-migration-results-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('📄 Results downloaded as JSON file');
}

// Run migration
console.log('🔧 Brand Migration Tool Ready');
console.log('Run: migrateBrandsToDynamoDB()');

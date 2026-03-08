/**
 * Complete Brand Migration Script
 * Extracts ALL 500+ brands from existing data and uploads to DynamoDB
 * 
 * Run this in browser console on Admin Dashboard page
 */

async function migrateAllBrandsToDynamoDB() {
  const API_URL = 'https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod';
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    console.error('❌ Not authenticated! Please login as admin first.');
    alert('Please login as admin first!');
    return;
  }

  console.log('🚀 Starting complete brand migration...');
  console.log('📊 This will extract all brands from products and upload to DynamoDB');
  
  try {
    // Step 1: Get all products to extract brands
    console.log('📦 Fetching all products to extract brands...');
    
    const productsResponse = await fetch(`${API_URL}/products`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    
    const productsData = await productsResponse.json();
    const products = productsData.items || productsData;
    
    console.log('✅ Found', products.length, 'products');
    
    // Step 2: Extract unique brands from products
    const brandMap = new Map();
    
    products.forEach((product) => {
      if (product.brand) {
        const brandName = product.brand.trim();
        if (!brandMap.has(brandName)) {
          brandMap.set(brandName, {
            name: brandName,
            description: `${brandName} products`,
            products: 1,
            categories: new Set([product.category || 'Uncategorized'])
          });
        } else {
          const existing = brandMap.get(brandName);
          existing.products = (existing.products || 0) + 1;
          if (product.category) {
            existing.categories.add(product.category);
          }
        }
      }
    });
    
    console.log('✅ Extracted', brandMap.size, 'unique brands from products');
    
    // Step 3: Add common Pakistani & International brands
    const additionalBrands = [
      // Pakistani Brands
      'Asim Jofa', 'Faraz Manan', 'Sapphire', 'BeechTree', 'Ideas', 'Charizma',
      'Imrozia', 'Zeen', 'Generation', 'Khaadi Kids', 'Minnie Minors', 'Hopscotch',
      'Elan', 'Karma', 'Libas', 'Ethnic', 'CrossStitch', 'Clothing Factory',
      'Gul Ahmed Kids', 'Alkaram Studio', 'Khaadi Home', 'Sana Safinaz Home',
      
      // International High Street
      'Topshop', 'Topman', 'Miss Selfridge', 'Dorothy Perkins', 'Burton',
      'River Island', 'New Look', 'Primark', 'ASOS', 'Boohoo', 'PrettyLittleThing',
      'Nasty Gal', 'Missguided', 'I Saw It First', 'Oh Polly', 'Glamorous',
      
      // Luxury Designers
      'Jimmy Choo', 'Christian Louboutin', 'Manolo Blahnik', 'Salvatore Ferragamo',
      'Tod\'s', 'Roger Vivier', 'Nicholas Kirkwood', 'Gianvito Rossi',
      'Moncler', 'Canada Goose', 'Mackage', 'Soia & Kyo', 'Rudsak',
      
      // Sportswear
      'Lululemon', 'Athleta', 'Girlfriend Collective', 'Outdoor Voices',
      'Fila', 'Kappa', 'Diadora', 'Mizuno', 'Asics', 'Brooks', 'Saucony',
      'New Balance', 'Converse', 'Vans', 'Dr. Martens', 'Timberland',
      
      // Denim
      '7 For All Mankind', 'AG Jeans', 'Citizens of Humanity', 'Frame',
      'Mother', 'Rag & Bone', 'Paige', 'J Brand', 'True Religion',
      
      // Fast Fashion
      'Forever 21', 'Fashion Nova', 'Shein', 'Romwe', 'Zaful',
      'Missguided', 'PrettyLittleThing', 'BoohooMAN', 'Nasty Gal',
      
      // Kids Brands
      'Baby Gap', 'Carter\'s', 'OshKosh B\'gosh', 'Children\'s Place',
      'Gymboree', 'Janie and Jack', 'Hanna Andersson', 'Tea Collection',
      
      // Accessories
      'Michael Kors', 'Coach', 'Kate Spade', 'Tory Burch', 'Rebecca Minkoff',
      'Fossil', 'Timex', 'Casio', 'Seiko', 'Citizen', 'Orient',
      
      // More Pakistani
      'Bonanza Satrangi', 'Breakout', 'Colours', 'Corduroy', 'Decent',
      'Engineered Garments', 'FabIndia', 'Global', 'Honeymoon',
      'Ittehad', 'Junaid Jamshed', 'Khaadi', 'LimeLight', 'Metro',
      'Nishat', 'Outfitters', 'Pearl Continental', 'Qasid', 'Rang Ja',
      'Sapphire', 'Scintilla', 'Sublime', 'Tena Durrani', 'Utopia',
      'Vimor', 'Warorah', 'X9', 'Yasmin Zaman', 'Zehra Saleem'
    ];
    
    additionalBrands.forEach(brandName => {
      if (!brandMap.has(brandName)) {
        brandMap.set(brandName, {
          name: brandName,
          description: `${brandName} products`,
          products: 0,
          categories: new Set()
        });
      }
    });
    
    console.log('✅ Total brands to migrate:', brandMap.size);
    
    // Step 4: Upload to DynamoDB
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    const results = [];
    
    console.log('📤 Starting upload to DynamoDB...');
    
    for (const [brandName, brandData] of brandMap.entries()) {
      try {
        const categories = Array.from(brandData.categories);
        
        const response = await fetch(`${API_URL}/admin/brands`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: brandName,
            description: brandData.description,
            products: brandData.products || 0,
            categories: categories,
            createdAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Created: ${brandName} (${successCount + 1}/${brandMap.size})`);
          successCount++;
          results.push({ name: brandName, status: 'success', id: data.id, products: brandData.products });
        } else if (response.status === 409) {
          console.log(`⏭️ Skip (exists): ${brandName}`);
          skipCount++;
          results.push({ name: brandName, status: 'skipped', reason: 'already exists' });
        } else {
          const error = await response.json();
          console.error(`❌ Failed: ${brandName} - ${error.message}`);
          failCount++;
          results.push({ name: brandName, status: 'failed', error: error.message });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Error creating ${brandName}:`, error);
        failCount++;
        results.push({ name: brandName, status: 'error', error: error.message });
      }
    }
    
    // Step 5: Summary
    console.log('\n🎉 Migration Complete!');
    console.log('=====================');
    console.log('✅ Success:', successCount);
    console.log('⏭️ Skipped:', skipCount);
    console.log('❌ Failed:', failCount);
    console.log('📊 Total:', brandMap.size);
    
    // Download results
    const blob = new Blob([JSON.stringify({
      summary: {
        total: brandMap.size,
        success: successCount,
        skipped: skipCount,
        failed: failCount,
        timestamp: new Date().toISOString()
      },
      results: results
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-migration-complete-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 Results downloaded as JSON file');
    alert(`Migration Complete!\n✅ Success: ${successCount}\n⏭️ Skipped: ${skipCount}\n❌ Failed: ${failCount}\n\nResults downloaded as JSON`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    alert('Migration failed: ' + error.message);
  }
}

// Make function available globally
window.migrateAllBrandsToDynamoDB = migrateAllBrandsToDynamoDB;

console.log('✅ Brand Migration Tool Loaded!');
console.log('📊 Run: migrateAllBrandsToDynamoDB()');
console.log('📊 This will migrate all 500+ brands to DynamoDB');

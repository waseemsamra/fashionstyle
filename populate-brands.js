// Run this in browser console on the Brands page to populate sample brands

const sampleBrands = [
  { id: '1', name: 'Khaadi', description: 'Pakistani fashion brand', logo: '', active: true, products: 15 },
  { id: '2', name: 'Maria B', description: 'Luxury fashion designer', logo: '', active: true, products: 12 },
  { id: '3', name: 'Sapphire', description: 'Contemporary fashion', logo: '', active: true, products: 18 },
  { id: '4', name: 'J.', description: 'Junaid Jamshed - Premium clothing', logo: '', active: true, products: 10 },
  { id: '5', name: 'Elan', description: 'High-end fashion label', logo: '', active: true, products: 8 },
  { id: '6', name: 'Zara', description: 'International fast fashion', logo: '', active: true, products: 25 },
  { id: '7', name: 'H&M', description: 'Swedish fashion retailer', logo: '', active: true, products: 30 },
  { id: '8', name: 'Gul Ahmed', description: 'Textile and apparel', logo: '', active: true, products: 20 },
  { id: '9', name: 'Alkaram', description: 'Pakistani textile brand', logo: '', active: true, products: 14 },
  { id: '10', name: 'BeechTree', description: 'Contemporary women wear', logo: '', active: true, products: 11 }
];

// Save to localStorage
localStorage.setItem('admin_brands', JSON.stringify(sampleBrands));

console.log('🚀 Populated', sampleBrands.length, 'sample brands');
console.log('✨ Refresh the page to see all brands!');

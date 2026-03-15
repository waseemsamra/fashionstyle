// Run this in your browser console on the Settings page
// This will populate localStorage with all seed data

const seedData = {
  colors: [
    { id: 'black', name: 'Black', hex: '#000000', active: true },
    { id: 'white', name: 'White', hex: '#FFFFFF', active: true },
    { id: 'red', name: 'Red', hex: '#FF0000', active: true },
    { id: 'blue', name: 'Blue', hex: '#0000FF', active: true },
    { id: 'green', name: 'Green', hex: '#00FF00', active: true },
    { id: 'yellow', name: 'Yellow', hex: '#FFFF00', active: true },
    { id: 'purple', name: 'Purple', hex: '#800080', active: true },
    { id: 'orange', name: 'Orange', hex: '#FFA500', active: true },
    { id: 'pink', name: 'Pink', hex: '#FFC0CB', active: true },
    { id: 'brown', name: 'Brown', hex: '#8B4513', active: true },
    { id: 'gray', name: 'Gray', hex: '#808080', active: true },
    { id: 'navy', name: 'Navy', hex: '#000080', active: true }
  ],
  materials: [
    { id: 'cotton', name: 'Cotton', active: true },
    { id: 'polyester', name: 'Polyester', active: true },
    { id: 'wool', name: 'Wool', active: true },
    { id: 'silk', name: 'Silk', active: true },
    { id: 'linen', name: 'Linen', active: true },
    { id: 'denim', name: 'Denim', active: true },
    { id: 'leather', name: 'Leather', active: true },
    { id: 'nylon', name: 'Nylon', active: true },
    { id: 'spandex', name: 'Spandex', active: true },
    { id: 'rayon', name: 'Rayon', active: true }
  ],
  sizes: [
    { id: 'xs', name: 'XS', category: 'clothing', order: 1 },
    { id: 's', name: 'S', category: 'clothing', order: 2 },
    { id: 'm', name: 'M', category: 'clothing', order: 3 },
    { id: 'l', name: 'L', category: 'clothing', order: 4 },
    { id: 'xl', name: 'XL', category: 'clothing', order: 5 },
    { id: 'xxl', name: 'XXL', category: 'clothing', order: 6 },
    { id: '28', name: '28', category: 'waist', order: 1 },
    { id: '30', name: '30', category: 'waist', order: 2 },
    { id: '32', name: '32', category: 'waist', order: 3 },
    { id: '34', name: '34', category: 'waist', order: 4 },
    { id: '36', name: '36', category: 'waist', order: 5 },
    { id: '5', name: '5', category: 'shoes', order: 1 },
    { id: '6', name: '6', category: 'shoes', order: 2 },
    { id: '7', name: '7', category: 'shoes', order: 3 },
    { id: '8', name: '8', category: 'shoes', order: 4 },
    { id: '9', name: '9', category: 'shoes', order: 5 },
    { id: '10', name: '10', category: 'shoes', order: 6 },
    { id: '11', name: '11', category: 'shoes', order: 7 },
    { id: '12', name: '12', category: 'shoes', order: 8 }
  ],
  patterns: [
    { id: 'solid', name: 'Solid', active: true },
    { id: 'striped', name: 'Striped', active: true },
    { id: 'floral', name: 'Floral', active: true },
    { id: 'geometric', name: 'Geometric', active: true },
    { id: 'abstract', name: 'Abstract', active: true },
    { id: 'animal-print', name: 'Animal Print', active: true },
    { id: 'polka-dot', name: 'Polka Dot', active: true },
    { id: 'checkered', name: 'Checkered', active: true },
    { id: 'plaid', name: 'Plaid', active: true },
    { id: 'herringbone', name: 'Herringbone', active: true }
  ],
  occasions: [
    { id: 'casual', name: 'Casual', active: true },
    { id: 'formal', name: 'Formal', active: true },
    { id: 'party', name: 'Party', active: true },
    { id: 'wedding', name: 'Wedding', active: true },
    { id: 'work', name: 'Work', active: true },
    { id: 'sports', name: 'Sports', active: true },
    { id: 'beach', name: 'Beach', active: true },
    { id: 'date-night', name: 'Date Night', active: true },
    { id: 'vacation', name: 'Vacation', active: true },
    { id: 'interview', name: 'Interview', active: true }
  ],
  gender: [
    { id: 'men', name: 'Men', active: true },
    { id: 'women', name: 'Women', active: true },
    { id: 'unisex', name: 'Unisex', active: true },
    { id: 'boys', name: 'Boys', active: true },
    { id: 'girls', name: 'Girls', active: true },
    { id: 'baby', name: 'Baby', active: true }
  ],
  categories: [
    { id: 'men', name: 'Men', slug: 'men', active: true, order: 1 },
    { id: 'women', name: 'Women', slug: 'women', active: true, order: 2 },
    { id: 'kids', name: 'Kids', slug: 'kids', active: true, order: 3 },
    { id: 'accessories', name: 'Accessories', slug: 'accessories', active: true, order: 4 },
    { id: 'footwear', name: 'Footwear', slug: 'footwear', active: true, order: 5 }
  ]
};

// Populate localStorage
console.log('🚀 Populating localStorage with seed data...\n');

Object.entries(seedData).forEach(([key, items]) => {
  localStorage.setItem(`admin_${key}`, JSON.stringify(items));
  console.log(`✅ ${key}: ${items.length} items saved`);
});

console.log('\n🎉 Seed data populated!');
console.log('📊 Total sections:', Object.keys(seedData).length);
console.log('📊 Total items:', Object.values(seedData).reduce((sum, arr) => sum + arr.length, 0));
console.log('\n✨ Refresh the page to see all the data!');

// Run this in browser console on the Products page to populate sample products

const sampleProducts = [
  {
    id: '1',
    name: 'Classic Cotton Kurta',
    price: 89.99,
    category: 'Casual',
    brand: 'Khaadi',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-1.jpg',
    stock: 50,
    active: true
  },
  {
    id: '2',
    name: 'Silk Lehenga Set',
    price: 299.99,
    category: 'Bridal',
    brand: 'Maria B',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg',
    stock: 25,
    active: true
  },
  {
    id: '3',
    name: 'Cotton Kurta',
    price: 49.00,
    category: 'Casual',
    brand: 'Khaadi',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-2.jpg',
    stock: 100,
    active: true
  },
  {
    id: '4',
    name: 'Embroidered Dupatta',
    price: 79.99,
    category: 'Formal',
    brand: 'Sapphire',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg',
    stock: 30,
    active: true
  },
  {
    id: '5',
    name: 'Designer Wedding Gown',
    price: 599.99,
    category: 'Bridal',
    brand: 'Elan',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-5.jpg',
    stock: 10,
    active: true
  },
  {
    id: '6',
    name: 'Casual Linen Shirt',
    price: 59.99,
    category: 'Casual',
    brand: 'J.',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-6.jpg',
    stock: 75,
    active: true
  },
  {
    id: '7',
    name: 'Formal Blazer',
    price: 199.99,
    category: 'Formal',
    brand: 'Charcoal',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-7.jpg',
    stock: 20,
    active: true
  },
  {
    id: '8',
    name: 'Summer Lawn Dress',
    price: 69.99,
    category: 'Casual',
    brand: 'Gul Ahmed',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-8.jpg',
    stock: 60,
    active: true
  }
];

// Save to localStorage
localStorage.setItem('admin_products', JSON.stringify(sampleProducts));

console.log('🚀 Populated', sampleProducts.length, 'sample products');
console.log('✨ Refresh the page to see all products!');

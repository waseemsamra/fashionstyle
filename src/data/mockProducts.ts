// data/mockProducts.ts

// Mock products for Pakistani fashion store
export const mockProducts = [
  {
    id: 'prod-001',
    name: 'Premium Cotton Kurta',
    description: 'Comfortable cotton kurta perfect for casual wear',
    price: 49,
    category: 'Casual Wear',
    brand: 'Khaadi',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-1.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-1.jpg',
    ],
    stock: 50,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Beige', 'Black'],
    materials: ['Cotton'],
    patterns: ['Solid'],
    occasions: ['Casual'],
    genders: ['Men'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Elegant Silk Lehenga',
    description: 'Beautiful silk lehenga for weddings and special occasions',
    price: 299,
    category: 'Bridal Wear',
    brand: 'Maria B',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-2.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-2.jpg',
    ],
    stock: 20,
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Gold', 'Maroon'],
    materials: ['Silk'],
    patterns: ['Embroidered'],
    occasions: ['Wedding', 'Formal'],
    genders: ['Women'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'Embroidered Dupatta',
    description: 'Hand-embroidered dupatta with intricate designs',
    price: 79.99,
    category: 'Accessories',
    brand: 'Sapphire',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg',
    ],
    stock: 100,
    sizes: ['Free Size'],
    colors: ['Blue', 'Green', 'Purple'],
    materials: ['Chiffon'],
    patterns: ['Embroidered'],
    occasions: ['Party', 'Festive'],
    genders: ['Women'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Formal Waistcoat',
    description: 'Premium formal waistcoat for special occasions',
    price: 89,
    category: 'Formal Wear',
    brand: 'J.',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg',
    ],
    stock: 30,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Gray'],
    materials: ['Velvet'],
    patterns: ['Solid'],
    occasions: ['Formal', 'Office'],
    genders: ['Men'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    name: 'Festive Collection Suit',
    description: 'Beautiful 3-piece suit for festive occasions',
    price: 159,
    category: 'Festive Collection',
    brand: 'Gul Ahmed',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-5.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-5.jpg',
    ],
    stock: 40,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink', 'Peach', 'Cream'],
    materials: ['Cotton', 'Satin'],
    patterns: ['Printed'],
    occasions: ['Festive', 'Party'],
    genders: ['Women'],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Get all products
export const getMockProducts = () => {
  console.log('📦 Returning mock products:', mockProducts.length);
  return mockProducts;
};

// Get product by ID
export const getMockProductById = (id: string) => {
  return mockProducts.find(p => p.id === id) || null;
};

// Save products to localStorage
export const saveMockProductsToStorage = () => {
  localStorage.setItem('admin_products', JSON.stringify(mockProducts));
  console.log('✅ Mock products saved to localStorage');
};

// Load products from localStorage
export const loadProductsFromStorage = () => {
  const saved = localStorage.getItem('admin_products');
  if (saved) {
    try {
      const products = JSON.parse(saved);
      console.log('✅ Loaded', products.length, 'products from localStorage');
      return products;
    } catch (error) {
      console.error('❌ Error parsing saved products:', error);
    }
  }
  return null;
};

// populate-products.js
// Run this in browser console to add mock products via API

const API_URL = 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

const mockProducts = [
  {
    name: 'Premium Cotton Kurta',
    description: 'Comfortable cotton kurta perfect for casual wear',
    price: 49.00,
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
    isFeatured: false,
    isNew: true,
    isSale: false,
  },
  {
    name: 'Elegant Silk Lehenga',
    description: 'Beautiful silk lehenga for weddings and special occasions',
    price: 299.00,
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
    isFeatured: true,
    isNew: false,
    isSale: false,
  },
  {
    name: 'Embroidered Dupatta',
    description: 'Hand-embroidered dupatta with intricate designs',
    price: 79.99,
    category: 'Formal Wear',
    brand: 'Sapphire',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-3.jpg',
    ],
    stock: 30,
    sizes: ['One Size'],
    colors: ['Blue', 'Green', 'Purple'],
    materials: ['Chiffon'],
    patterns: ['Embroidered'],
    occasions: ['Formal', 'Party'],
    genders: ['Women'],
    isActive: true,
    isFeatured: false,
    isNew: true,
    isSale: false,
  },
  {
    name: 'Classic Linen Shirt',
    description: 'Breathable linen shirt for summer days',
    price: 59.99,
    category: 'Casual Wear',
    brand: 'J.',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-4.jpg',
    ],
    stock: 75,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Navy', 'Khaki'],
    materials: ['Linen'],
    patterns: ['Solid'],
    occasions: ['Casual'],
    genders: ['Men'],
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: true,
  },
  {
    name: 'Designer Wedding Gown',
    description: 'Stunning designer wedding gown with detailed embroidery',
    price: 599.99,
    category: 'Bridal Wear',
    brand: 'Elan',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-5.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-5.jpg',
    ],
    stock: 10,
    sizes: ['S', 'M', 'L'],
    colors: ['White', 'Ivory', 'Gold'],
    materials: ['Silk', 'Organza'],
    patterns: ['Embroidered'],
    occasions: ['Wedding'],
    genders: ['Women'],
    isActive: true,
    isFeatured: true,
    isNew: true,
    isSale: false,
  },
  {
    name: 'Casual Denim Jeans',
    description: 'Comfortable slim-fit denim jeans',
    price: 89.99,
    category: 'Casual Wear',
    brand: 'Outfitters',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-6.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-6.jpg',
    ],
    stock: 100,
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Blue', 'Black', 'Grey'],
    materials: ['Denim'],
    patterns: ['Solid'],
    occasions: ['Casual'],
    genders: ['Men', 'Women'],
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: false,
  },
  {
    name: 'Formal Blazer',
    description: 'Professional blazer for office wear',
    price: 199.99,
    category: 'Formal Wear',
    brand: 'Charcoal',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-7.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-7.jpg',
    ],
    stock: 25,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Grey'],
    materials: ['Wool'],
    patterns: ['Solid'],
    occasions: ['Formal', 'Office'],
    genders: ['Men'],
    isActive: true,
    isFeatured: true,
    isNew: false,
    isSale: false,
  },
  {
    name: 'Summer Lawn Dress',
    description: 'Light and breezy lawn dress for hot summer days',
    price: 69.99,
    category: 'Casual Wear',
    brand: 'Gul Ahmed',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-8.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-8.jpg',
    ],
    stock: 60,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Pink', 'Yellow', 'Blue'],
    materials: ['Lawn'],
    patterns: ['Printed'],
    occasions: ['Casual'],
    genders: ['Women'],
    isActive: true,
    isFeatured: false,
    isNew: true,
    isSale: true,
  },
  {
    name: 'Velvet Sherwani',
    description: 'Luxurious velvet sherwani for groom',
    price: 449.99,
    category: 'Bridal Wear',
    brand: 'Amir Adnan',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-9.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-9.jpg',
    ],
    stock: 15,
    sizes: ['M', 'L', 'XL'],
    colors: ['Maroon', 'Navy', 'Black'],
    materials: ['Velvet'],
    patterns: ['Embroidered'],
    occasions: ['Wedding'],
    genders: ['Men'],
    isActive: true,
    isFeatured: true,
    isNew: false,
    isSale: false,
  },
  {
    name: 'Printed Kurti',
    description: 'Trendy printed kurti for everyday wear',
    price: 39.99,
    category: 'Casual Wear',
    brand: 'Ideas',
    image: 'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-10.jpg',
    images: [
      'https://fashionstore-prod-assets-536217686312.s3.amazonaws.com/images/product-10.jpg',
    ],
    stock: 80,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi'],
    materials: ['Cotton'],
    patterns: ['Printed'],
    occasions: ['Casual'],
    genders: ['Women'],
    isActive: true,
    isFeatured: false,
    isNew: true,
    isSale: false,
  },
];

async function populateProducts() {
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('idToken');
  
  if (!token) {
    console.error('❌ No authentication token found!');
    console.error('👉 Please log in to the admin panel first');
    return;
  }

  console.log('🚀 Starting to populate products...');
  console.log(`📦 Total products to add: ${mockProducts.length}`);
  console.log(`🔑 Token present: ${!!token}`);
  console.log('---');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < mockProducts.length; i++) {
    const product = mockProducts[i];
    
    try {
      console.log(`📝 Adding product ${i + 1}/${mockProducts.length}: ${product.name}...`);
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${product.name} (ID: ${data.id})`);
        successCount++;
      } else {
        const error = await response.json();
        console.error(`❌ Failed to add ${product.name}:`, error);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error.message);
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('---');
  console.log('🎉 Population complete!');
  console.log(`✅ Success: ${successCount} products`);
  console.log(`❌ Failed: ${failCount} products`);
  console.log('🔄 Refresh the page to see all products!');
}

// Run the function
populateProducts();

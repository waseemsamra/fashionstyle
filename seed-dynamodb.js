// seed-dynamodb.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'fashionstore-settings-prod';

// ============================================
// YOUR SEED DATA - MODIFY THIS SECTION
// ============================================
const seedData = {
    // Store Information
    storeInfo: {
        id: 'main',
        name: 'Fashion Store',
        email: 'store@fashionstore.com',
        phone: '+1 (555) 123-4567',
        address: '123 Fashion Ave, New York, NY 10001',
        currency: 'USD',
        taxRate: 0.08,
        shippingFee: 5.99,
        freeShippingThreshold: 50,
        logo: '/logo.png',
        socialMedia: {
            facebook: 'https://facebook.com/fashionstore',
            instagram: 'https://instagram.com/fashionstore'
        }
    },

    // Categories
    categories: [
        { id: 'men', name: 'Men', slug: 'men', active: true, order: 1 },
        { id: 'women', name: 'Women', slug: 'women', active: true, order: 2 },
        { id: 'kids', name: 'Kids', slug: 'kids', active: true, order: 3 },
        { id: 'accessories', name: 'Accessories', slug: 'accessories', active: true, order: 4 },
        { id: 'footwear', name: 'Footwear', slug: 'footwear', active: true, order: 5 }
    ],

    // Colors
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

    // Materials
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

    // Sizes
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

    // Patterns
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

    // Occasions
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

    // Gender
    gender: [
        { id: 'men', name: 'Men', active: true },
        { id: 'women', name: 'Women', active: true },
        { id: 'unisex', name: 'Unisex', active: true },
        { id: 'boys', name: 'Boys', active: true },
        { id: 'girls', name: 'Girls', active: true },
        { id: 'baby', name: 'Baby', active: true }
    ],

    // General Settings
    generalSettings: {
        id: 'main',
        siteName: 'Fashion Store',
        siteDescription: 'Your premier fashion destination',
        maintenanceMode: false,
        enableReviews: true,
        enableWishlist: true,
        enableCompare: false,
        itemsPerPage: 24,
        defaultSort: 'newest',
        currency: 'USD',
        taxRate: 0.08,
        shippingFee: 5.99,
        freeShippingThreshold: 50
    }
};

// ============================================
// UPLOAD FUNCTION - DO NOT MODIFY
// ============================================
async function uploadSeedData() {
    console.log('\n🚀 STARTING DYNAMODB SEED UPLOAD');
    console.log('================================\n');
    
    const timestamp = new Date().toISOString();
    let totalItems = 0;

    // Upload storeInfo
    console.log('📦 Uploading Store Information...');
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            section: 'storeInfo',
            id: seedData.storeInfo.id,
            data: seedData.storeInfo,
            createdAt: timestamp,
            updatedAt: timestamp
        }
    }));
    console.log('✅ Store Information uploaded\n');
    totalItems++;

    // Upload categories
    console.log('📦 Uploading Categories...');
    for (const category of seedData.categories) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'categories',
                id: category.id,
                data: category,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        console.log(`  ✅ ${category.name}`);
        totalItems++;
    }
    console.log('');

    // Upload colors
    console.log('📦 Uploading Colors...');
    for (const color of seedData.colors) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'colors',
                id: color.id,
                data: color,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.colors.length} colors uploaded\n`);

    // Upload materials
    console.log('📦 Uploading Materials...');
    for (const material of seedData.materials) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'materials',
                id: material.id,
                data: material,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.materials.length} materials uploaded\n`);

    // Upload sizes
    console.log('📦 Uploading Sizes...');
    for (const size of seedData.sizes) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'sizes',
                id: size.id,
                data: size,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.sizes.length} sizes uploaded\n`);

    // Upload patterns
    console.log('📦 Uploading Patterns...');
    for (const pattern of seedData.patterns) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'patterns',
                id: pattern.id,
                data: pattern,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.patterns.length} patterns uploaded\n`);

    // Upload occasions
    console.log('📦 Uploading Occasions...');
    for (const occasion of seedData.occasions) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'occasions',
                id: occasion.id,
                data: occasion,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.occasions.length} occasions uploaded\n`);

    // Upload gender
    console.log('📦 Uploading Gender Options...');
    for (const gender of seedData.gender) {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                section: 'gender',
                id: gender.id,
                data: gender,
                createdAt: timestamp,
                updatedAt: timestamp
            }
        }));
        totalItems++;
    }
    console.log(`✅ ${seedData.gender.length} gender options uploaded\n`);

    // Upload generalSettings
    console.log('📦 Uploading General Settings...');
    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            section: 'generalSettings',
            id: seedData.generalSettings.id,
            data: seedData.generalSettings,
            createdAt: timestamp,
            updatedAt: timestamp
        }
    }));
    console.log('✅ General Settings uploaded\n');
    totalItems++;

    // Summary
    console.log('🎉 SEED DATA UPLOAD COMPLETE!');
    console.log('================================');
    console.log(`📊 Total items uploaded: ${totalItems}`);
    console.log('================================');
    console.log('\nBreakdown by section:');
    console.log(`  • Store Info: 1 item`);
    console.log(`  • Categories: ${seedData.categories.length} items`);
    console.log(`  • Colors: ${seedData.colors.length} items`);
    console.log(`  • Materials: ${seedData.materials.length} items`);
    console.log(`  • Sizes: ${seedData.sizes.length} items`);
    console.log(`  • Patterns: ${seedData.patterns.length} items`);
    console.log(`  • Occasions: ${seedData.occasions.length} items`);
    console.log(`  • Gender: ${seedData.gender.length} items`);
    console.log(`  • General Settings: 1 item`);
    console.log('================================');
}

// Run the upload
uploadSeedData().catch(error => {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
});

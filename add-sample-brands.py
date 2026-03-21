#!/usr/bin/env python3
"""
Add sample brands to DynamoDB fashionstore-brands table
"""

import boto3
from datetime import datetime
import uuid

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('fashionstore-brands')

# Sample fashion brands
sample_brands = [
    {
        'name': 'Nike',
        'description': 'Just Do It - Premium sportswear and athletic footwear',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Adidas',
        'description': 'Impossible Is Nothing - German sportswear giant',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Zara',
        'description': 'Fast fashion leader with trendy collections',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'H&M',
        'description': 'Fashion and quality at the best price',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Gucci',
        'description': 'Italian luxury fashion house',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Levi\'s',
        'description': 'Original blue jeans and American denim',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Ralph Lauren',
        'description': 'Classic American luxury fashion',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Calvin Klein',
        'description': 'Modern, minimalist fashion and lifestyle',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Tommy Hilfiger',
        'description': 'Classic American cool style',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    },
    {
        'name': 'Puma',
        'description': 'Forever Faster - Athletic and casual footwear',
        'logo': '',
        'active': True,
        'products': 0,
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat()
    }
]

print(f"🚀 Adding {len(sample_brands)} sample brands to DynamoDB...\n")

added_count = 0
for brand in sample_brands:
    try:
        # Generate unique ID
        brand_id = f"brand-{uuid.uuid4().hex[:12]}"
        brand_item = {
            'id': brand_id,
            **brand
        }
        
        # Add to DynamoDB
        table.put_item(Item=brand_item)
        print(f"  ✅ Added: {brand['name']}")
        added_count += 1
    except Exception as e:
        print(f"  ❌ Failed to add {brand['name']}: {e}")

print(f"\n{'='*60}")
print(f"✅ Successfully added {added_count} brands!")
print(f"{'='*60}\n")

# Verify by scanning the table
print("📊 Verifying brands in database...")
response = table.scan()
print(f"   Total brands in table: {response['Count']}\n")

print("📋 Brands added:")
for item in response['Items']:
    status = "🟢 Active" if item.get('active', False) else "🔴 Inactive"
    print(f"   • {item['name']} - {status}")

print(f"\n🎉 Done! Refresh your admin brands page to see them!")

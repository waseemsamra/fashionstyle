#!/bin/bash
# create-collection-admin.sh
# Usage: ./create-collection-admin.sh collectionId "Display Name" maxProducts

COLLECTION_ID=$1
COLLECTION_NAME=$2
MAX_PRODUCTS=${3:-10}

if [ -z "$COLLECTION_ID" ] || [ -z "$COLLECTION_NAME" ]; then
    echo "Usage: ./create-collection-admin.sh <collection-id> \"Display Name\" [max-products]"
    echo ""
    echo "Example: ./create-collection-admin.sh summerSale \"Summer Sale\" 15"
    exit 1
fi

# Convert to PascalCase for filename
FILENAME=$(echo "$COLLECTION_ID" | sed -r 's/(^|-)([a-z])/\U\2/g')

cat > "src/pages/admin/${FILENAME}.tsx" << EOF
// ${FILENAME}.tsx - Uses unified collections system
import CollectionManager from '@/components/admin/CollectionManager';

export default function ${FILENAME}() {
  return (
    <CollectionManager 
      collectionId="${COLLECTION_ID}"
      collectionName="${COLLECTION_NAME}"
      maxProducts={${MAX_PRODUCTS}}
      description="Select up to ${MAX_PRODUCTS} products to feature in the ${COLLECTION_NAME} section"
    />
  );
}
EOF

echo "✅ Created: src/pages/admin/${FILENAME}.tsx"
echo ""
echo "Next steps:"
echo "1. Add route in App.tsx:"
echo "   const ${FILENAME} = lazy(() => import('@/pages/admin/${FILENAME}'));"
echo "   <Route path=\"/admin/${COLLECTION_ID}\" element={<${FILENAME} />} />"
echo ""
echo "2. Add to admin dashboard menu"
echo ""
echo "3. Add home page component using: useCollection('${COLLECTION_ID}')"

# Settings API - Complete Implementation Guide

## 🎯 Overview

Complete CRUD API for all settings sections with DynamoDB persistence.

## 📋 Supported Sections

1. **Categories** - Product categories
2. **Store Information** - Store details, logo, business hours
3. **Colors** - Color options with swatches
4. **Materials** - Fabric/material options
5. **Sizes** - Size charts and guides
6. **Patterns** - Pattern options
7. **Occasions** - Occasion options
8. **Gender** - Gender options
9. **General Settings** - Currency, tax, shipping

## 🚀 API Endpoints

### Base URL
```
https://xpyh8srop0.execute-api.us-east-1.amazonaws.com/prod/admin/settings-v2
```

### All Sections Support:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/:section` | Get all items in section |
| `GET` | `/:section/:id` | Get specific item |
| `POST` | `/:section` | Save/create section |
| `PUT` | `/:section/:id` | Update specific item |
| `DELETE` | `/:section/:id` | Delete specific item |
| `PATCH` | `/:section/reorder` | Reorder items |

### Examples:

#### Categories
```bash
GET    /admin/settings-v2/categories
POST   /admin/settings-v2/categories
PUT    /admin/settings-v2/categories/:id
DELETE /admin/settings-v2/categories/:id
```

#### Store Information
```bash
GET    /admin/settings-v2/store
POST   /admin/settings-v2/store
PUT    /admin/settings-v2/store/:id
```

#### Colors
```bash
GET    /admin/settings-v2/colors
POST   /admin/settings-v2/colors
PUT    /admin/settings-v2/colors/:id
DELETE /admin/settings-v2/colors/:id
```

## 📦 Lambda Deployment

### 1. Upload Lambda
- **File**: `lambda-settings-complete-v2.js`
- **Name**: `fashionstore-prod-settings-complete`
- **Runtime**: Node.js 18.x or 20.x
- **Handler**: `handler`

### 2. Environment Variables
```
SETTINGS_TABLE=fashionstore-settings-prod
JWT_SECRET=fashionstore-secret-key
```

### 3. IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/fashionstore-settings-prod"
    }
  ]
}
```

### 4. API Gateway Configuration

Create resource: `/admin/settings-v2/{section+}`

Methods:
- `GET` - Integrated with Lambda
- `POST` - Integrated with Lambda
- `PUT` - Integrated with Lambda
- `DELETE` - Integrated with Lambda
- `PATCH` - Integrated with Lambda
- `OPTIONS` - CORS preflight (return 200)

Enable CORS:
- Access-Control-Allow-Origin: `*`
- Access-Control-Allow-Headers: `Content-Type,Authorization`
- Access-Control-Allow-Methods: `GET,POST,PUT,DELETE,PATCH,OPTIONS`

Deploy API to `prod` stage.

## 💻 Frontend Usage

### Get All Settings
```javascript
const settings = await api.getAllSettings();
console.log(settings);
// { settings: { categories: [...], colors: [...], ... } }
```

### Get Specific Section
```javascript
const response = await fetch(`${API_URL}/admin/settings-v2/categories`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { categories } = await response.json();
```

### Save Section
```javascript
const response = await fetch(`${API_URL}/admin/settings-v2/categories`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { id: '1', name: 'Casual', description: 'Casual wear' },
      { id: '2', name: 'Formal', description: 'Formal wear' }
    ]
  })
});
```

### Update Item
```javascript
const response = await fetch(`${API_URL}/admin/settings-v2/colors/red`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Red',
    hex: '#FF0000',
    description: 'Bright red'
  })
});
```

### Delete Item
```javascript
const response = await fetch(`${API_URL}/admin/settings-v2/materials/silk`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🗄️ DynamoDB Table Structure

### Table Name
`fashionstore-settings-prod`

### Primary Key
- `settingKey` (String) - Section name (e.g., "categories", "colors")

### Attributes
- `items` (List) - Array of items in the section
- `data` (Map) - Additional section data
- `updatedAt` (String) - ISO timestamp

### Example Item
```json
{
  "settingKey": "categories",
  "items": [
    {
      "id": "casual",
      "name": "Casual",
      "description": "Casual collection",
      "products": 7,
      "active": true,
      "updatedAt": "2026-03-14T12:00:00.000Z"
    }
  ],
  "updatedAt": "2026-03-14T12:00:00.000Z"
}
```

## ✅ Implementation Status

| Section | Lambda | API Gateway | Frontend | Status |
|---------|--------|-------------|----------|--------|
| Categories | ✅ | ✅ | ✅ | Working |
| Store Info | ✅ | ⏳ | ⏳ | Ready to deploy |
| Colors | ✅ | ⏳ | ⏳ | Ready to deploy |
| Materials | ✅ | ⏳ | ⏳ | Ready to deploy |
| Sizes | ✅ | ⏳ | ⏳ | Ready to deploy |
| Patterns | ✅ | ⏳ | ⏳ | Ready to deploy |
| Occasions | ✅ | ⏳ | ⏳ | Ready to deploy |
| Gender | ✅ | ⏳ | ⏳ | Ready to deploy |
| General | ✅ | ⏳ | ⏳ | Ready to deploy |

## 🎯 Next Steps

1. **Deploy Lambda** to AWS
2. **Configure API Gateway** with all methods
3. **Deploy API** to prod stage
4. **Test all endpoints** with Postman/curl
5. **Update frontend** to use new endpoints
6. **Test persistence** on live site

## 📝 Testing Checklist

- [ ] GET all sections
- [ ] GET specific item
- [ ] POST new section
- [ ] PUT update item
- [ ] DELETE item
- [ ] PATCH reorder
- [ ] Authentication works
- [ ] CORS configured correctly
- [ ] Data persists in DynamoDB
- [ ] Frontend can save/load

## 🚨 Important Notes

1. **Authentication**: All endpoints require valid JWT token (except GET)
2. **CORS**: Configured for all origins (update for production)
3. **Validation**: Minimal validation (add as needed)
4. **Error Handling**: Returns appropriate HTTP status codes
5. **Logging**: Console logs for debugging (CloudWatch)

## 📞 Support

For issues or questions:
1. Check CloudWatch Logs
2. Verify IAM permissions
3. Check DynamoDB table exists
4. Verify JWT token is valid
5. Check API Gateway configuration

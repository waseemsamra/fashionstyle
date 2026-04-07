# Fashion Style MCP Server

MCP (Model Context Protocol) server that provides AI assistants with tools to interact with your Fashion Style e-commerce backend.

## 🚀 Available Tools

| Tool | Description | Requires Auth |
|------|-------------|---------------|
| `get_products` | Fetch/search products by brand, category, or keyword | No |
| `get_product_by_id` | Get single product details | No |
| `get_brands` | Fetch/search brands | No |
| `get_brand_by_slug` | Get brand by slug | No |
| `get_orders` | Fetch orders with filters | Yes |
| `get_users` | Fetch registered users | Yes |
| `update_product` | Update product details | Yes |

## 📦 Setup

### 1. Install Dependencies
```bash
npm install @modelcontextprotocol/sdk zod
```

### 2. (Optional) Set Admin Token
For admin tools (orders, users, updates):
```bash
export ADMIN_TOKEN="your_jwt_token_here"
```

### 3. Configure in `.qwen/settings.json`
Already configured! The server runs automatically.

## 🔧 Usage Examples

### Get all products
```
get_products(limit=50)
```

### Search products by brand
```
get_products(brand="Gul Ahmed", limit=20)
```

### Get brand by slug
```
get_brand_by_slug(slug="gul-ahmed")
```

### Get orders (admin only)
```
get_orders(status="pending", limit=20)
```

### Update a product (admin only)
```
update_product(productId="123", price=99, stock=50)
```

## 🛠️ Architecture

```
┌─────────────────┐
│  AI Assistant   │
│   (Qwen Code)   │
└────────┬────────┘
         │ MCP Protocol (stdio)
         ▼
┌─────────────────┐
│  MCP Server     │
│  (mcp-server.js)│
└────────┬────────┘
         │ HTTP REST
         ▼
┌─────────────────┐
│  API Gateway    │
│  (rvtv0snm8k)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DynamoDB/S3    │
└─────────────────┘
```

## 📝 Notes

- Public tools (products, brands) work without authentication
- Admin tools (orders, users, updates) require `ADMIN_TOKEN`
- All responses are formatted as JSON
- Errors are returned with `isError: true`

## 🔐 Security

Never commit `ADMIN_TOKEN` to `.env` or version control. Set it as an environment variable only when needed.

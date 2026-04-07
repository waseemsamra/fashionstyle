#!/usr/bin/env node
// mcp-server.js - MCP Server for Fashion Style E-commerce
// Provides tools to query products, brands, orders, and users

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.VITE_API_URL || 'https://rvtv0snm8k.execute-api.us-east-1.amazonaws.com/prod';

const server = new McpServer({
  name: "fashion-style-mcp",
  version: "1.0.0",
});

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (process.env.ADMIN_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.ADMIN_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${error.message}`);
    throw error;
  }
}

// Tool: Get all products
server.tool(
  "get_products",
  "Fetch all products or search by brand, category, or keyword",
  {
    brand: z.string().optional().describe("Filter by brand name"),
    category: z.string().optional().describe("Filter by category"),
    search: z.string().optional().describe("Search keyword for product name"),
    limit: z.number().optional().describe("Limit results (default 100)"),
  },
  async ({ brand, category, search, limit = 100 }) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      
      if (brand) params.append('brand', brand);
      if (category) params.append('category', category);

      const response = await apiRequest(`/products?${params.toString()}`);
      let products = response.products || response.items || [];

      // Client-side filtering for search
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: products.length,
              products: products.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                category: p.category,
                price: p.price,
                stock: p.stock,
                isActive: p.isActive,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get product by ID
server.tool(
  "get_product_by_id",
  "Get a single product by its ID",
  {
    productId: z.string().describe("Product ID"),
  },
  async ({ productId }) => {
    try {
      const product = await apiRequest(`/products/${productId}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: product.id,
              name: product.name,
              brand: product.brand,
              category: product.category,
              price: product.price,
              originalPrice: product.originalPrice,
              description: product.description,
              images: product.images || [],
              stock: product.stock,
              sizes: product.sizes,
              colors: product.colors,
              materials: product.materials,
              isActive: product.isActive,
              isFeatured: product.isFeatured,
              isNew: product.isNew,
              isSale: product.isSale,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get all brands
server.tool(
  "get_brands",
  "Fetch all brands or search by name",
  {
    search: z.string().optional().describe("Search brand name"),
    featured: z.boolean().optional().describe("Only featured brands"),
    limit: z.number().optional().describe("Limit results (default 100)"),
  },
  async ({ search, featured, limit = 100 }) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (featured) params.append('featured', 'true');

      const response = await apiRequest(`/admin/brands?${params.toString()}`);
      let brands = response.brands || response.items || [];

      if (search) {
        const searchLower = search.toLowerCase();
        brands = brands.filter(b => 
          b.name?.toLowerCase().includes(searchLower)
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: brands.length,
              brands: brands.map(b => ({
                id: b.id,
                name: b.name,
                slug: b.slug,
                description: b.description,
                productCount: b.productCount,
                isFeatured: b.isFeatured,
                coverImage: b.coverImage,
                logo: b.logo,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get brand by slug
server.tool(
  "get_brand_by_slug",
  "Get a brand by its slug",
  {
    slug: z.string().describe("Brand slug (e.g., 'gul-ahmed')"),
  },
  async ({ slug }) => {
    try {
      const response = await apiRequest(`/admin/brands?limit=500`);
      const brands = response.brands || response.items || [];
      const brand = brands.find(b => b.slug === slug);

      if (!brand) {
        return {
          content: [{ type: "text", text: `Brand not found: ${slug}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: brand.id,
              name: brand.name,
              slug: brand.slug,
              description: brand.description,
              productCount: brand.productCount,
              isFeatured: brand.isFeatured,
              coverImage: brand.coverImage,
              logo: brand.logo,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get orders
server.tool(
  "get_orders",
  "Fetch orders with optional date range and status filters",
  {
    status: z.string().optional().describe("Filter by order status"),
    limit: z.number().optional().describe("Limit results (default 50)"),
  },
  async ({ status, limit = 50 }) => {
    try {
      if (!process.env.ADMIN_TOKEN) {
        return {
          content: [{ type: "text", text: "Error: ADMIN_TOKEN environment variable required" }],
          isError: true,
        };
      }

      const params = new URLSearchParams({ limit: limit.toString() });
      if (status) params.append('status', status);

      const response = await apiRequest(`/admin/orders?${params.toString()}`);
      const orders = response.orders || response.items || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: orders.length,
              orders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerEmail: o.customerEmail,
                total: o.total,
                status: o.status,
                items: o.items?.length || 0,
                createdAt: o.createdAt,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get users
server.tool(
  "get_users",
  "Fetch all registered users",
  {
    limit: z.number().optional().describe("Limit results (default 50)"),
  },
  async ({ limit = 50 }) => {
    try {
      if (!process.env.ADMIN_TOKEN) {
        return {
          content: [{ type: "text", text: "Error: ADMIN_TOKEN environment variable required" }],
          isError: true,
        };
      }

      const response = await apiRequest(`/admin/users?limit=${limit}`);
      const users = response.users || response.items || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: users.length,
              users: users.map(u => ({
                userId: u.userId,
                email: u.email,
                name: u.name,
                role: u.role,
                status: u.status,
                createdAt: u.createdAt,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool: Update product
server.tool(
  "update_product",
  "Update a product's details (requires admin token)",
  {
    productId: z.string().describe("Product ID"),
    name: z.string().optional().describe("Product name"),
    price: z.number().optional().describe("Price"),
    stock: z.number().optional().describe("Stock quantity"),
    isActive: z.boolean().optional().describe("Active status"),
    isFeatured: z.boolean().optional().describe("Featured status"),
    isNew: z.boolean().optional().describe("New arrival status"),
    isSale: z.boolean().optional().describe("On sale status"),
    description: z.string().optional().describe("Description"),
    brand: z.string().optional().describe("Brand name"),
    category: z.string().optional().describe("Category"),
  },
  async ({ productId, ...updates }) => {
    try {
      if (!process.env.ADMIN_TOKEN) {
        return {
          content: [{ type: "text", text: "Error: ADMIN_TOKEN environment variable required" }],
          isError: true,
        };
      }

      await apiRequest(`/products`, {
        method: 'POST',
        body: { id: productId, ...updates },
      });

      return {
        content: [
          {
            type: "text",
            text: `Product ${productId} updated successfully`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Fashion Style MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

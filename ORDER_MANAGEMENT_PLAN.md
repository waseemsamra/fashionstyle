# Order Management System - Architecture

## New Order Status Flow

```
Customer Places Order
        ↓
   [pending] → Payment confirmed?
        ↓
  [confirmed] → Auto-send to vendor
        ↓
 [vendor-notified] → Vendor accepts?
        ↓
  [vendor-accepted] → Vendor prepares
        ↓
   [processing] → Quality check
        ↓
    [ready-to-ship] → Dispatched
        ↓
     [shipped] → In transit
        ↓
    [delivered] → Complete
```

## Inventory Management

- **Before**: Product.stock was never updated
- **After**: 
  - Order confirmed → Reserve stock (-1)
  - Order cancelled → Release stock (+1)
  - Order delivered → Deduct stock permanently
  - Low stock alerts when stock < 10

## Vendor Notification

- Email notification sent to vendor when order status changes to `vendor-notified`
- Vendor can accept/reject via email link
- Rejected orders return to `pending` with admin alert

## New Fields Added to Orders

```typescript
{
  // Existing fields...
  
  // NEW: Inventory tracking
  inventoryReserved: boolean;      // Stock reserved when confirmed
  inventoryDeducted: boolean;      // Stock deducted when delivered
  
  // NEW: Vendor tracking
  vendorEmail?: string;            // Vendor notification email
  vendorStatus: 'pending' | 'accepted' | 'rejected' | null;
  vendorNotifiedAt?: string;       // Timestamp
  vendorAcceptedAt?: string;
  vendorRejectedReason?: string;
  
  // NEW: Enhanced status
  orderStatus: 'pending' | 'confirmed' | 'vendor-notified' | 'vendor-accepted' | 'vendor-rejected' | 'processing' | 'ready-to-ship' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  
  // NEW: Payment tracking
  paymentConfirmedAt?: string;
  paymentGateway?: string;
  
  // NEW: Tracking
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  
  // NEW: Timeline
  timeline: OrderTimelineEvent[];
}

interface OrderTimelineEvent {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}
```

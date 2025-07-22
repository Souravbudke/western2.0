/**
 * Server-side Invoice Generator Utility
 * Creates HTML invoices for orders
 */

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Generate invoice HTML
export const generateInvoiceHTML = (order: any): string => {
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = formatDate(orderDate.toISOString());
  const orderItems = order.items || [];
  
  // Make sure we have valid items with products
  const validOrderItems = orderItems.filter((item: any) => item.product && item.quantity);
  
  // Calculate totals
  const subtotal = validOrderItems.reduce((sum: number, item: any) => {
    const price = item.product?.price || item.price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  const shippingCost = 0; // You can add shipping cost calculation here
  const taxRate = 0; // No GST
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + shippingCost;

  // Generate the invoice HTML
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${order.id?.substring(0, 8)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .invoice-logo {
          font-size: 24px;
          font-weight: bold;
          color: #e91e63;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h1 {
          color: #e91e63;
          margin: 0 0 10px;
        }
        .customer-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .billing-details, .shipping-details {
          flex: 1;
        }
        .billing-details h3, .shipping-details h3 {
          margin-top: 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
          color: #e91e63;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background-color: #f8f8f8;
          font-weight: bold;
        }
        .totals {
          width: 300px;
          margin-left: auto;
          margin-bottom: 30px;
        }
        .totals div {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #eee;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          color: #777;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="invoice-logo">
            WesternStreet sneakers
          </div>
          <div class="invoice-details">
            <h1>INVOICE</h1>
            <div>Invoice #: INV-${order.id?.substring(0, 8)}</div>
            <div>Date: ${formattedDate}</div>
            <div>Order ID: ${order.id}</div>
          </div>
        </div>
        
        <div class="customer-details">
          <div class="billing-details">
            <h3>Billed From:</h3>
            <div>WesternStreet sneakers</div>
            <div>Vidyanagar Hubballi</div>
            <div>Hubballi, Karnataka 560001</div>
            <div>India</div>
            <div>Email: support@westernstreet.com</div>
          </div>
          
          <div class="shipping-details">
            <h3>Shipped To:</h3>
            <div>${order.shippingAddress?.fullName || 'Customer'}</div>
            <div>${order.shippingAddress?.streetAddress || ''}</div>
            <div>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postalCode || ''}</div>
            <div>${order.shippingAddress?.country || ''}</div>
            <div>Phone: ${order.shippingAddress?.phone || ''}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${validOrderItems.length > 0 ? validOrderItems.map((item: any) => {
              const product = item.product || {};
              const price = product.price || item.price || 0;
              const quantity = item.quantity || 1;
              const amount = price * quantity;
              
              return `
                <tr>
                  <td>${product.name || 'Product'}</td>
                  <td>${product.description || ''}</td>
                  <td>${quantity}</td>
                  <td>${formatCurrency(price)}</td>
                  <td>${formatCurrency(amount)}</td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">No items found in this order</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>

          <div>
            <span>Shipping:</span>
            <span>${formatCurrency(shippingCost)}</span>
          </div>
          <div class="total-row">
            <span>Total:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with westernstreet!</p>
          <p>Payment Method: ${order.paymentMethod === 'paypal' ? 'PayPal' : 'Cash on Delivery'}</p>
          <p>Payment Status: ${order.paymentStatus || 'Pending'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

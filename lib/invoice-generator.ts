"use client"

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Invoice Generator Utility
 * Creates downloadable PDF invoices for orders
 */

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Helper function to format date
export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Generate HTML content for the invoice
export const generateInvoiceHTML = (order: any) => {
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = formatDate(orderDate);
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
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${order.id}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
          color: #333;
          line-height: 1.4;
          margin: 0;
          padding: 0;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .invoice-logo {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h1 {
          color: #333;
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        .customer-details {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
        }
        .billing-details, .shipping-details {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table th, table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        table th {
          background-color: #f8f8f8;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
        .totals div {
          margin-bottom: 5px;
        }
        .grand-total {
          font-weight: bold;
          font-size: 18px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
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
          <div>Subtotal: ${formatCurrency(subtotal)}</div>
          <div>Shipping: ${formatCurrency(shippingCost)}</div>
          <div class="grand-total">Total: ${formatCurrency(total)}</div>
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

// Function to generate and download the invoice as PDF
export const downloadInvoice = (order: any) => {
  // Generate the HTML content
  const invoiceHTML = generateInvoiceHTML(order);
  
  // Create a temporary container to render the invoice
  const container = document.createElement('div');
  container.innerHTML = invoiceHTML;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  // Use html2canvas to convert the HTML to an image
  html2canvas(container, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    allowTaint: true
  }).then(canvas => {
    // Remove the temporary container
    document.body.removeChild(container);
    
    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate the number of pages needed
    const ratio = canvasWidth / pdfWidth;
    const totalPages = Math.ceil(canvasHeight / (pdfHeight * ratio));
    
    // Add image to PDF, potentially across multiple pages
    let remainingHeight = canvasHeight;
    let currentPage = 0;
    
    while (remainingHeight > 0 && currentPage < totalPages) {
      // For the first page, no need to add a new page
      if (currentPage > 0) {
        pdf.addPage();
      }
      
      // Calculate the portion of the canvas to add to this page
      const pageHeight = Math.min(remainingHeight, pdfHeight * ratio);
      const sourceY = canvasHeight - remainingHeight;
      
      // Add the image portion to the PDF
      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        pdfWidth,
        pageHeight / ratio
      );
      
      // Update remaining height
      remainingHeight -= pageHeight;
      currentPage++;
    }
    
    // Save the PDF
    pdf.save(`invoice-${order.id?.substring(0, 8)}.pdf`);
  }).catch(error => {
    console.error('Error generating PDF:', error);
    alert('There was an error generating your PDF. Please try again.');
    document.body.removeChild(container);
  });
};

// Function to print the invoice
export const printInvoice = (order: any) => {
  // Generate the HTML content
  const invoiceHTML = generateInvoiceHTML(order);
  
  // Create a new window
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    // Write the HTML content to the new window
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Wait for the content to load
    printWindow.onload = function() {
      // Print the window
      printWindow.print();
    };
  }
};

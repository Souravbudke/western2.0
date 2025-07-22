import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateInvoiceHTML } from '@/lib/server/invoice-generator';

// Create a simple, reliable transporter for Gmail using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Using the service name instead of host/port
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,  // App password from environment variables
  },
});

export async function POST(request: NextRequest) {
  try {
    const { order, customerEmail } = await request.json();

    if (!order || !customerEmail) {
      return NextResponse.json({ error: 'Order and customer email are required' }, { status: 400 });
    }
    
    console.log('Processing invoice email for order:', order.id);
    console.log('Customer email provided:', customerEmail);

    // Log that we're using Gmail
    console.log('Using Gmail to send invoice email');

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order);

    // Format order date
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Log the customer email for debugging
    console.log('Preparing invoice email for:', customerEmail);
    
    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customerEmail,
      subject: `Your WesternStreet Invoice #${order.id?.substring(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 3px solid #e91e63;">
            <h1 style="color: #e91e63; margin: 0;">Thank You For Your Order!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hello,</p>
            <p>Your order has been successfully placed and is being processed.</p>
            <p>Please find your invoice attached to this email.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
            </div>
            
            <p>If you have any questions about your order, please contact our customer support team.</p>
            
            <p>Best regards,<br>WesternStreet sneakers Team</p>
          </div>
          
          <div style="background-color: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} WesternStreet sneakers. All rights reserved.</p>
            <p>Vidyanagar Hubballi, Karnataka, India</p>
          </div>
        </div>
      `,
      // Embed the invoice in the email
      attachments: [
        {
          filename: `WesternStreet-Invoice-${order.id?.substring(0, 8)}.html`,
          content: invoiceHTML,
          contentType: 'text/html',
        },
      ],
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Create the response
    const response = {
      success: true,
      message: 'Invoice email sent successfully to your Gmail inbox',
      messageId: info.messageId,
      to: customerEmail
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

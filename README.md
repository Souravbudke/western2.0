# WesternStreet - sneakers Products E-commerce Platform

WesternStreet is a comprehensive e-commerce platform dedicated to sneakers products, featuring both customer-facing storefronts and an admin dashboard for complete management of the online store.

![WesternStreet](/public/homepage.png)

**Live Demo:** [WesternStreet](https://westernstreet.vercel.app)

## 🌟 Features

### Customer Features
- **Product Browsing**: Browse sneakers products with filtering and sorting options
- **User Accounts**: Create accounts, manage profiles, and track order history
- **Image Search**: Innovative visual search functionality to find products
- **Shopping Cart**: Add/remove items and proceed to checkout
- **Checkout Process**: Secure payment processing (PayPal integration)
- **Order Tracking**: Monitor order status from processing to delivery
- **Wishlist**: Save favorite products for future consideration

### Admin Features
- **Dashboard**: Overview of sales, revenue, and other store metrics
- **Product Management**: Add, edit, delete products and manage inventory
- **Order Management**: Process orders, update status, and generate invoices
- **Customer Management**: View and manage customer accounts and data
- **Analytics**: Track store performance and sales metrics
- **Settings**: Configure store settings and preferences

## 🚀 Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: Clerk Authentication
- **State Management**: Zustand
- **UI Components**: Radix UI, Lucide React icons
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: TailwindCSS with custom animations
- **Payments**: PayPal integration
- **Email**: Nodemailer for transactional emails
- **PDF Generation**: PDFKit for invoices and receipts

## 📋 Prerequisites

- Node.js 18+
- MongoDB database
- Clerk account for authentication
- PayPal developer account (for payment processing)

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/westernstreet.git
   cd westernstreet
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   
   # PayPal
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   
   # Email
   EMAIL_SERVER=your_smtp_server
   EMAIL_USER=your_email_username
   EMAIL_PASSWORD=your_email_password
   
   # App URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see the store in action.

## 🏗️ Project Structure

```
westernstreet/
├── app/                  # Next.js app router
│   ├── admin/            # Admin dashboard routes
│   ├── api/              # API routes
│   ├── auth/             # Authentication routes
│   ├── store/            # Customer-facing store routes
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── admin/            # Admin-specific components
│   ├── store/            # Store-specific components
│   └── ui/               # UI components (shadcn)
├── lib/                  # Utility functions and libraries
│   ├── models/           # Mongoose models
│   └── server/           # Server-side utilities
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── styles/               # Global styles
└── middleware.ts         # Next.js middleware
```

## 💻 Usage

### Customer Usage
- Browse products on the homepage
- Search for products using text or image search
- Add products to cart or wishlist
- Checkout with PayPal or cash on delivery
- Track order status in your account

### Admin Usage
- Access the admin dashboard at `/admin`
- Manage products, orders, and customers
- View analytics and reports
- Configure store settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Sourav Budke**

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Clerk](https://clerk.dev/)
- [MongoDB](https://www.mongodb.com/)
- [PayPal](https://developer.paypal.com/)
- All other open-source packages used in this project 
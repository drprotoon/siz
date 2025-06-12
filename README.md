# SIZ Cosméticos - E-commerce Platform

A modern e-commerce platform built with React, Express, and PostgreSQL, designed for cosmetics and beauty products.

> Última atualização: Otimização de bundle para melhor performance no Vercel

## Features

- 🛍️ **Product Catalog**: Browse and search beauty products
- 🛒 **Shopping Cart**: Add products and manage cart
- 👤 **User Authentication**: Register, login, and profile management
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS
- 💳 **Payment Integration**: AbacatePay integration for PIX payments
- 📦 **Order Management**: Track orders and order history
- 🚚 **Shipping Calculator**: Correios integration for freight calculation
- 👨‍💼 **Admin Dashboard**: Product and order management
- 🎨 **Modern UI**: Beautiful interface with shadcn/ui components

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching
- **React Hook Form** with Zod validation
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Supabase** for database and storage
- **Passport.js** for authentication
- **JWT** for serverless authentication
- **Multer** for file uploads
- **Rate limiting** and security middleware

### Deployment
- **Vercel** for hosting
- **Supabase** for database and storage
- **AbacatePay** for payment processing

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)
- AbacatePay account for payments

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd siz
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

# Payment
ABACATEPAY_API_KEY=your_abacatepay_api_key
ABACATEPAY_WEBHOOK_SECRET=your_webhook_secret

# App
STORE_NAME="SIZ COSMETICOS"
NODE_ENV=development
```

4. Set up the database:
```bash
npm run db:setup
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database
- `npm run db:setup` - Set up database schema
- `npm run db:seed` - Seed database with sample data
- `npm run db:migrate` - Run database migrations

### Deployment
- `npm run deploy` - Deploy to Vercel

## Project Structure

```
siz/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configurations
│   │   └── styles/        # CSS files
│   └── index.html
├── server/                # Backend Express application
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── vercel.ts          # Vercel deployment handler
├── shared/                # Shared types and schemas
├── scripts/               # Utility scripts
├── migrations/            # Database migrations
└── api/                   # Vercel API endpoints
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/login-jwt` - JWT-based login (serverless)
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List products
- `GET /api/products/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/users` - List users (admin)

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SESSION_SECRET` - Session encryption secret
- `JWT_SECRET` - JWT signing secret

### Optional
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `ABACATEPAY_API_KEY` - Payment processing
- `ABACATEPAY_WEBHOOK_SECRET` - Payment webhook validation
- `STORE_NAME` - Store display name
- `DISABLE_SECURE_COOKIE` - For development (set to "true")

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy:
```bash
vercel --prod
```

### Environment Setup
Make sure to set these variables in Vercel:
- All required environment variables listed above
- `NODE_ENV=production`
- `DISABLE_SECURE_COOKIE=true` (for serverless environments)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

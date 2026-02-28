# LuxeStore - Modern E-Commerce Platform

A full-stack e-commerce platform built with **React + Vite** (frontend) and **Express.js** (backend), featuring WhatsApp integration, Briq payment processing, an admin dashboard, dark mode, smooth animations, and a mobile-first design.

![LuxeStore](https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop)

## Features

### Shopping Experience
- **Product Catalog** with filtering, sorting, search, and pagination
- **Product Detail Pages** with image gallery, specs, and recommendations
- **Smart Cart** with real-time totals, tax, shipping calculation, and free shipping threshold
- **Multi-step Checkout** with form validation
- **Order Confirmation** with status tracking
- **"You Might Also Like"** recommendations based on category, price, and tags

### WhatsApp Integration
- **QR Code** in navbar and floating button to start a WhatsApp chat
- **Product-specific links** to ask about items directly on WhatsApp
- **Order status updates** via WhatsApp

### Payment
- **Briq payment gateway** integration (falls back to demo mode when keys are not configured)
- **Webhook support** for payment status updates

### Admin Dashboard
- **Overview** with revenue, orders, products, and low-stock alerts
- **Order Management** with status updates (pending → confirmed → processing → shipped → delivered)
- **Product Management** with inline editing of price, stock, and featured status
- **Top Products** and recent orders at a glance

### UI/UX
- **Dark Mode** toggle with system preference detection and localStorage persistence
- **Framer Motion** page transitions, hover effects, cart animations, and loading states
- **Mobile-First** responsive design that works beautifully on all screen sizes
- **Custom scrollbar**, glass morphism navbar, gradient accents
- **Tailwind CSS** utility-first styling with custom design tokens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 3, Framer Motion |
| Routing | React Router DOM 7 |
| State | React Context (Cart, Theme) |
| HTTP | Axios |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend | Express.js 5, CORS, dotenv |
| Rate Limiting | express-rate-limit |
| Payment | Briq API |
| WhatsApp | QR code generation via api.qrserver.com |

## Project Structure

```
├── backend/
│   ├── data/
│   │   └── store.js          # In-memory data store (products, orders, carts)
│   ├── routes/
│   │   ├── products.js       # Product CRUD, search, recommendations
│   │   ├── cart.js            # Cart operations (add, update, remove, clear)
│   │   ├── orders.js          # Order creation and tracking
│   │   ├── payments.js        # Briq payment initiation and webhooks
│   │   ├── whatsapp.js        # WhatsApp QR data and product/order links
│   │   └── admin.js           # Admin dashboard, order/product management
│   ├── server.js              # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Sticky navbar with search, dark mode, cart
│   │   │   ├── Footer.jsx         # Site footer
│   │   │   ├── CartDrawer.jsx     # Slide-out cart panel
│   │   │   ├── ProductCard.jsx    # Product card with hover effects
│   │   │   ├── WhatsAppButton.jsx # WhatsApp QR modal and FAB
│   │   │   └── LoadingSpinner.jsx # Animated loading indicator
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page with hero, categories, featured
│   │   │   ├── Products.jsx       # Product listing with filters and sort
│   │   │   ├── ProductDetail.jsx  # Single product page with recommendations
│   │   │   ├── Categories.jsx     # Category cards with images
│   │   │   ├── Checkout.jsx       # Multi-step checkout form
│   │   │   ├── OrderConfirmation.jsx # Order status and tracking
│   │   │   └── Admin.jsx          # Admin dashboard with tabs
│   │   ├── context/
│   │   │   ├── CartContext.jsx     # Cart state management
│   │   │   └── ThemeContext.jsx    # Dark mode state management
│   │   ├── lib/
│   │   │   └── api.js             # Axios API client
│   │   ├── index.css              # Tailwind + custom styles
│   │   ├── main.jsx               # React entry point
│   │   └── App.jsx                # Router and providers
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (optional — works in demo mode)
npm install
npm run dev
```

The API server starts on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on port **5173** with API proxy to port 5000.

### Run Both Together

Open two terminals:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (filter by category, search, sort, price range) |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/categories` | Get all categories |
| GET | `/api/products/:idOrSlug` | Get single product |
| GET | `/api/products/recommendations/:id` | Get product recommendations |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update item quantity |
| DELETE | `/api/cart/remove/:productId` | Remove item |
| DELETE | `/api/cart/clear` | Clear cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:orderId` | Get order details |
| GET | `/api/orders/:orderId/track` | Track order status |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/initiate` | Start payment |
| POST | `/api/payments/webhook` | Payment webhook |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/qr-data` | Get WhatsApp QR code data |
| GET | `/api/whatsapp/product-link/:productId` | Get WhatsApp link for product |
| GET | `/api/whatsapp/order-update/:orderId` | Get WhatsApp order update link |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/orders` | List all orders |
| PUT | `/api/admin/orders/:orderId/status` | Update order status |
| GET | `/api/admin/products` | List products with sales data |
| PUT | `/api/admin/products/:id` | Update product |

## Configuration

### Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `WHATSAPP_PHONE` | WhatsApp business number | +1234567890 |
| `BRIQ_API_KEY` | Briq API key | (demo mode) |
| `BRIQ_SECRET` | Briq secret | (demo mode) |
| `FRONTEND_URL` | Frontend URL for CORS | (your frontend URL) |

## License

MIT

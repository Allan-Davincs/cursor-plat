# LuxeStore - Modern E-Commerce Platform

A full-stack e-commerce platform built with **React + Vite** (frontend) and **Express.js** (backend), featuring **Briq** and **Snippe** payment processing, **WhatsApp** integration, an admin dashboard, dark mode, smooth animations, and a mobile-first design.

![LuxeStore](https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop)

## Features

### Shopping Experience
- **Product Catalog** with filtering, sorting, search, and pagination
- **Product Detail Pages** with image gallery, specs, and recommendations
- **Smart Cart** with real-time totals, tax, shipping calculation, and free shipping threshold
- **Multi-step Checkout** with payment method selection
- **Order Confirmation** with status tracking
- **"You Might Also Like"** recommendations based on category, price, and tags

### Payment Integrations
- **Briq** payment gateway (card and mobile wallet)
- **Snippe** payment gateway with:
  - **Mobile Money** (M-Pesa, Airtel Money, Halotel, Mixx by Yas)
  - **Card payments** (Visa, Mastercard)
- **Webhook support** for real-time payment status updates
- **Graceful fallback** to demo mode when API keys are not configured

### WhatsApp Integration (+255 675 029 833)
- **QR Code** in navbar and floating button to start a WhatsApp chat
- **Product-specific links** to ask about items directly on WhatsApp
- **Order status notifications** sent via Snippe messaging or manual WhatsApp links
- **Admin panel** button to send WhatsApp updates to customers

### Admin Dashboard
- **Overview** with revenue, orders, products, and low-stock alerts
- **Order Management** with status updates (pending -> confirmed -> processing -> shipped -> delivered)
- **WhatsApp notification** button on each order
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
| Payment | Briq API + Snippe API (Mobile Money, Card) |
| WhatsApp | wa.me links + QR codes + Snippe messaging |

## Project Structure

```
├── backend/
│   ├── data/
│   │   └── store.js          # In-memory data store (products, orders, carts)
│   ├── routes/
│   │   ├── products.js       # Product CRUD, search, recommendations
│   │   ├── cart.js            # Cart operations (add, update, remove, clear)
│   │   ├── orders.js          # Order creation, tracking, WhatsApp notification
│   │   ├── payments.js        # Briq + Snippe payment initiation and webhooks
│   │   ├── whatsapp.js        # WhatsApp QR, product links, messaging
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
│   │   │   ├── Checkout.jsx       # Multi-step checkout with payment methods
│   │   │   ├── OrderConfirmation.jsx # Order status and tracking
│   │   │   └── Admin.jsx          # Admin dashboard with tabs
│   │   ├── context/
│   │   │   ├── CartContext.jsx     # Cart state management
│   │   │   └── ThemeContext.jsx    # Dark mode state management
│   │   ├── lib/
│   │   │   └── api.js             # Axios API client (/api/v1 prefix)
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
# Edit .env with your Briq, Snippe API keys and URLs
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

All endpoints are prefixed with `/api/v1`.

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products (filter by category, search, sort, price range) |
| GET | `/api/v1/products/featured` | Get featured products |
| GET | `/api/v1/products/categories` | Get all categories |
| GET | `/api/v1/products/:idOrSlug` | Get single product |
| GET | `/api/v1/products/recommendations/:id` | Get product recommendations |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cart` | Get current cart |
| POST | `/api/v1/cart/add` | Add item to cart |
| PUT | `/api/v1/cart/update` | Update item quantity |
| DELETE | `/api/v1/cart/remove/:productId` | Remove item |
| DELETE | `/api/v1/cart/clear` | Clear cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create order (auto-sends WhatsApp notification) |
| GET | `/api/v1/orders/:orderId` | Get order details |
| GET | `/api/v1/orders/:orderId/track` | Track order status |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payments/methods` | Get available payment methods |
| POST | `/api/v1/payments/initiate` | Start payment (Briq, Snippe Mobile, Snippe Card, or Demo) |
| GET | `/api/v1/payments/status/:paymentId` | Check payment status |
| POST | `/api/v1/payments/webhook` | Payment webhook (Snippe/Briq callbacks) |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/whatsapp/qr-data` | Get WhatsApp QR code data |
| GET | `/api/v1/whatsapp/product-link/:productId` | Get WhatsApp link for product inquiry |
| GET | `/api/v1/whatsapp/order-update/:orderId` | Get WhatsApp link for order status |
| POST | `/api/v1/whatsapp/send-order-notification` | Send order update via Snippe or fallback link |
| POST | `/api/v1/whatsapp/send-message` | Send arbitrary WhatsApp message |
| POST | `/api/v1/whatsapp/webhook` | Receive incoming WhatsApp messages |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Dashboard stats |
| GET | `/api/v1/admin/orders` | List all orders |
| PUT | `/api/v1/admin/orders/:orderId/status` | Update order status |
| GET | `/api/v1/admin/products` | List products with sales data |
| PUT | `/api/v1/admin/products/:id` | Update product |

## Configuration

### Environment Variables (Backend)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment | No |
| `BRIQ_API_KEY` | Briq payment API key | For Briq payments |
| `BRIQ_BASE_URL` | Briq API base URL | For Briq payments |
| `SNIPPE_API_KEY` | Snippe API key | For mobile money/card/messaging |
| `SNIPPE_BASE_URL` | Snippe API base URL | For mobile money/card/messaging |
| `WHATSAPP_PHONE` | WhatsApp business number | No (default: +255675029833) |
| `FRONTEND_URL` | Frontend URL for CORS and callbacks | Yes |
| `PAYMENT_WEBHOOK_URL` | URL for payment webhooks | For live payments |
| `WHATSAPP_WEBHOOK_URL` | URL for WhatsApp webhooks | For live messaging |

### Payment Flow

1. Customer selects payment method at checkout
2. **Mobile Money**: USSD push sent to phone for confirmation
3. **Card**: Redirect to Snippe/Briq hosted checkout page
4. **Demo**: Auto-confirmed for testing
5. Webhook updates order status in real-time

### Testing with ngrok

For webhook testing, expose your local server:
```bash
ngrok http 5000
```
Then update `PAYMENT_WEBHOOK_URL` and `WHATSAPP_WEBHOOK_URL` in `.env` with the ngrok URL.

## License

MIT

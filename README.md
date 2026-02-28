# InfoX Modern E-Commerce Platform

Production-ready full-stack starter for a modern e-commerce experience with:

- WhatsApp QR support on navbar and product pages
- Real-time order tracking via Server-Sent Events (SSE)
- Product recommendations based on category + price affinity
- Smooth animations (page transitions, cart motion, loading states)
- Dark mode with persisted preference
- Mobile-first responsive UI + basic PWA capabilities
- Simulated Briq payment integration flow
- Admin dashboard for live status management

## Tech Stack

### Backend
- Node.js + Express
- CORS, dotenv, axios, body-parser, express-rate-limit
- In-memory product/order store (easy to swap with DB)
- WhatsApp bot simulation + outbound webhook notifications

### Frontend
- React + Vite
- React Router DOM
- Tailwind CSS (v4 via Vite plugin)
- Framer Motion
- Lucide icons
- React Hot Toast

---

## Project Structure

```text
.
├── backend
│   ├── .env.example
│   ├── src
│   │   ├── data/products.js
│   │   ├── services/store.js
│   │   ├── services/whatsapp.js
│   │   └── server.js
│   └── package.json
├── frontend
│   ├── .env.example
│   ├── public
│   │   ├── manifest.webmanifest
│   │   └── sw.js
│   ├── src
│   │   ├── api/client.js
│   │   ├── components/*
│   │   ├── context/*
│   │   ├── hooks/useOrderStream.js
│   │   ├── pages/*
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Local Setup

## 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default backend URL: `http://localhost:4000`

## 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend URL: `http://localhost:<frontend-port>`

---

## Environment Variables

### Backend (`backend/.env`)

| Key | Description | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:<frontend-port>` |
| `AUTO_PROGRESS_ORDERS` | Auto-move orders through statuses for demo | `true` |
| `WHATSAPP_SUPPORT_NUMBER` | Default support WhatsApp number | `15550001111` |
| `WHATSAPP_NOTIFY_URL` | Optional webhook endpoint for outbound message delivery | empty |
| `WHATSAPP_NOTIFY_TOKEN` | Optional bearer token for webhook auth | empty |
| `BRIQ_CHECKOUT_URL` | Briq checkout base URL (stubbed) | `https://sandbox.briq.example/checkout` |

### Frontend (`frontend/.env`)

| Key | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base path | `http://localhost:4000/api` |

---

## API Highlights

### Health
- `GET /api/health`

### Products
- `GET /api/products?category=&search=&minPrice=&maxPrice=`
- `GET /api/products/:id`
- `GET /api/products/:id/recommendations`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/:id/stream` (SSE live updates)
- `PATCH /api/orders/:id/status`
- `POST /api/orders/:id/notify`

### WhatsApp
- `GET /api/whatsapp/qr?phone=&text=`
- `POST /api/whatsapp/bot/message`

### Payments (Briq stub)
- `POST /api/payments/briq/checkout`
- `POST /api/payments/briq/webhook`

### Admin
- `GET /api/admin/summary`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`

---

## Quick API Smoke Flow (curl)

```bash
# 1) Health
curl http://localhost:4000/api/health

# 2) List products
curl http://localhost:4000/api/products

# 3) Create order
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "15550001111",
      "address": "Cloud Lane"
    },
    "items": [{"productId":"p-101","quantity":1}],
    "note": "Please deliver fast"
  }'
```

---

## Feature Mapping to Requirements

1. **WhatsApp QR Code on Website**
   - Navbar: quick support QR
   - Product detail page: contextual product help QR

2. **Real-time Order Updates**
   - Backend SSE stream endpoint
   - Frontend live tracker auto-updates timeline and status
   - Optional WhatsApp outbound status notifications

3. **Product Recommendations**
   - Backend recommendation scoring by category + price + rating
   - Product page "You might also like" section

4. **Smooth Animations**
   - Route/page transitions
   - Animated cart list
   - Animated loading states

5. **Dark Mode**
   - Navbar toggle
   - Preference persisted in localStorage

6. **Mobile-First + PWA**
   - Responsive layouts from first breakpoint up
   - Web app manifest + service worker registration

---

## Build & Quality Checks

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

---

## Notes

- Payment integration is implemented as a Briq-compatible stub flow and is ready to be wired to actual credentials/webhooks.
- Data persistence is currently in-memory; connect `store.js` to your preferred database for production persistence.

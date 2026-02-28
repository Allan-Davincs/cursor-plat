const products = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    slug: "premium-wireless-headphones",
    price: 299.99,
    originalPrice: 399.99,
    description: "Immerse yourself in crystal-clear sound with active noise cancellation, 40-hour battery life, and premium comfort padding. Perfect for audiophiles and professionals alike.",
    shortDescription: "ANC headphones with 40hr battery",
    category: "electronics",
    subcategory: "audio",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600"
    ],
    rating: 4.8,
    reviewCount: 342,
    stock: 45,
    featured: true,
    tags: ["wireless", "noise-cancelling", "premium", "bluetooth"],
    specs: { battery: "40 hours", driver: "40mm", connectivity: "Bluetooth 5.3", weight: "250g" }
  },
  {
    id: 2,
    name: "Minimalist Leather Watch",
    slug: "minimalist-leather-watch",
    price: 189.99,
    originalPrice: 249.99,
    description: "Elegant Swiss-made timepiece with genuine Italian leather strap, sapphire crystal face, and water resistance up to 50m. A statement of refined taste.",
    shortDescription: "Swiss-made with Italian leather",
    category: "accessories",
    subcategory: "watches",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600"
    ],
    rating: 4.9,
    reviewCount: 128,
    stock: 23,
    featured: true,
    tags: ["luxury", "leather", "swiss", "minimalist"],
    specs: { movement: "Swiss Quartz", case: "42mm", water: "50m", strap: "Italian Leather" }
  },
  {
    id: 3,
    name: "Ultra-Slim Laptop Stand",
    slug: "ultra-slim-laptop-stand",
    price: 79.99,
    originalPrice: 99.99,
    description: "Ergonomic aluminum laptop stand that elevates your screen to eye level. Foldable design fits in your bag. Compatible with all laptops 11-17 inches.",
    shortDescription: "Ergonomic aluminum foldable stand",
    category: "electronics",
    subcategory: "accessories",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600"
    ],
    rating: 4.6,
    reviewCount: 567,
    stock: 120,
    featured: false,
    tags: ["ergonomic", "portable", "aluminum", "laptop"],
    specs: { material: "Aluminum Alloy", weight: "240g", compatibility: "11-17 inch", angles: "6 adjustable" }
  },
  {
    id: 4,
    name: "Organic Cotton Hoodie",
    slug: "organic-cotton-hoodie",
    price: 89.99,
    originalPrice: 119.99,
    description: "Super-soft organic cotton hoodie with a relaxed fit. Sustainably sourced, GOTS certified, and made in ethical factories. Available in 8 colors.",
    shortDescription: "Sustainable GOTS-certified hoodie",
    category: "clothing",
    subcategory: "hoodies",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
      "https://images.unsplash.com/photo-1578768079470-c6e1b2a9459a?w=600"
    ],
    rating: 4.7,
    reviewCount: 891,
    stock: 200,
    featured: true,
    tags: ["organic", "sustainable", "cotton", "comfort"],
    specs: { material: "100% Organic Cotton", fit: "Relaxed", certification: "GOTS", care: "Machine washable" }
  },
  {
    id: 5,
    name: "Smart Fitness Tracker",
    slug: "smart-fitness-tracker",
    price: 149.99,
    originalPrice: 199.99,
    description: "Track your health 24/7 with heart rate monitoring, SpO2, sleep tracking, and GPS. 10-day battery life with always-on AMOLED display.",
    shortDescription: "24/7 health tracking with GPS",
    category: "electronics",
    subcategory: "wearables",
    images: [
      "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600",
      "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=600"
    ],
    rating: 4.5,
    reviewCount: 1203,
    stock: 78,
    featured: true,
    tags: ["fitness", "smart", "health", "GPS"],
    specs: { display: "1.4\" AMOLED", battery: "10 days", sensors: "HR, SpO2, GPS", water: "5ATM" }
  },
  {
    id: 6,
    name: "Artisan Coffee Maker",
    slug: "artisan-coffee-maker",
    price: 249.99,
    originalPrice: 329.99,
    description: "Brew barista-quality coffee at home. PID temperature control, pre-infusion, and 15-bar pressure. Includes built-in grinder with 30 settings.",
    shortDescription: "Barista-quality with built-in grinder",
    category: "home",
    subcategory: "kitchen",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"
    ],
    rating: 4.8,
    reviewCount: 456,
    stock: 34,
    featured: false,
    tags: ["coffee", "barista", "grinder", "premium"],
    specs: { pressure: "15 bar", grinder: "30 settings", tank: "2L", power: "1450W" }
  },
  {
    id: 7,
    name: "Handcrafted Ceramic Vase",
    slug: "handcrafted-ceramic-vase",
    price: 64.99,
    originalPrice: 84.99,
    description: "Each piece is uniquely handcrafted by artisans using traditional techniques. Matte finish with organic curves, perfect as a standalone art piece.",
    shortDescription: "Unique artisan-made ceramic piece",
    category: "home",
    subcategory: "decor",
    images: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600",
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600"
    ],
    rating: 4.9,
    reviewCount: 89,
    stock: 15,
    featured: false,
    tags: ["handcrafted", "ceramic", "artisan", "decor"],
    specs: { height: "30cm", material: "Stoneware Ceramic", finish: "Matte", origin: "Handmade" }
  },
  {
    id: 8,
    name: "Professional Camera Backpack",
    slug: "professional-camera-backpack",
    price: 159.99,
    originalPrice: 209.99,
    description: "Weather-sealed camera backpack with customizable dividers, laptop compartment, and quick-access side opening. Fits 2 bodies + 6 lenses.",
    shortDescription: "Weather-sealed with quick access",
    category: "accessories",
    subcategory: "bags",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600"
    ],
    rating: 4.7,
    reviewCount: 234,
    stock: 42,
    featured: false,
    tags: ["camera", "backpack", "weatherproof", "professional"],
    specs: { capacity: "30L", laptop: "Up to 16\"", material: "Ripstop Nylon", weight: "1.8kg" }
  },
  {
    id: 9,
    name: "Bamboo Wireless Charger",
    slug: "bamboo-wireless-charger",
    price: 39.99,
    originalPrice: 54.99,
    description: "Eco-friendly wireless charger made from sustainable bamboo. Supports 15W fast charging for all Qi-enabled devices. Includes LED indicator.",
    shortDescription: "Eco-friendly 15W fast charging",
    category: "electronics",
    subcategory: "chargers",
    images: [
      "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=600",
      "https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=600"
    ],
    rating: 4.4,
    reviewCount: 678,
    stock: 150,
    featured: false,
    tags: ["eco", "wireless", "bamboo", "charging"],
    specs: { power: "15W max", material: "Bamboo + ABS", standard: "Qi", cable: "USB-C included" }
  },
  {
    id: 10,
    name: "Merino Wool Scarf",
    slug: "merino-wool-scarf",
    price: 59.99,
    originalPrice: 79.99,
    description: "Luxuriously soft 100% merino wool scarf. Temperature-regulating, moisture-wicking, and naturally odor-resistant. Perfect for all seasons.",
    shortDescription: "100% merino, all-season luxury",
    category: "clothing",
    subcategory: "scarves",
    images: [
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600",
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600"
    ],
    rating: 4.8,
    reviewCount: 312,
    stock: 88,
    featured: false,
    tags: ["merino", "wool", "luxury", "all-season"],
    specs: { material: "100% Merino Wool", dimensions: "200cm x 35cm", weight: "150g", care: "Hand wash" }
  },
  {
    id: 11,
    name: "Smart LED Desk Lamp",
    slug: "smart-led-desk-lamp",
    price: 119.99,
    originalPrice: 159.99,
    description: "App-controlled desk lamp with 16M colors, adjustable color temperature (2700K-6500K), and wireless phone charging base. Voice assistant compatible.",
    shortDescription: "Smart lamp with wireless charging",
    category: "home",
    subcategory: "lighting",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600"
    ],
    rating: 4.6,
    reviewCount: 445,
    stock: 60,
    featured: true,
    tags: ["smart", "LED", "wireless-charging", "desk"],
    specs: { colors: "16M", temperature: "2700K-6500K", charging: "10W Qi", control: "App + Voice" }
  },
  {
    id: 12,
    name: "Titanium Travel Mug",
    slug: "titanium-travel-mug",
    price: 44.99,
    originalPrice: 59.99,
    description: "Double-walled titanium travel mug keeps drinks hot for 12 hours or cold for 24. Ultra-lightweight at just 180g with leak-proof lid.",
    shortDescription: "12hr hot, 24hr cold, ultra-light",
    category: "home",
    subcategory: "kitchen",
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600"
    ],
    rating: 4.7,
    reviewCount: 723,
    stock: 95,
    featured: false,
    tags: ["titanium", "travel", "insulated", "lightweight"],
    specs: { capacity: "450ml", weight: "180g", hot: "12 hours", cold: "24 hours" }
  }
];

const categories = [
  { id: "electronics", name: "Electronics", icon: "Cpu", count: 4 },
  { id: "clothing", name: "Clothing", icon: "Shirt", count: 2 },
  { id: "accessories", name: "Accessories", icon: "Watch", count: 2 },
  { id: "home", name: "Home & Living", icon: "Home", count: 4 }
];

let orders = [];
let carts = {};
let orderIdCounter = 1000;

function generateOrderId() {
  orderIdCounter++;
  return `ORD-${orderIdCounter}`;
}

module.exports = {
  products,
  categories,
  orders,
  carts,
  generateOrderId
};

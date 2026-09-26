var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_stripe = __toESM(require("stripe"), 1);
var dotenv = __toESM(require("dotenv"), 1);

// server/db.ts
var import_sqlite3 = __toESM(require("sqlite3"), 1);
var import_sqlite = require("sqlite");
var import_path = __toESM(require("path"), 1);
var dbInstance = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  const dbPath = import_path.default.join(process.cwd(), "database.sqlite");
  dbInstance = await (0, import_sqlite.open)({
    filename: dbPath,
    driver: import_sqlite3.default.Database
  });
  await initDb(dbInstance);
  return dbInstance;
}
async function initDb(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      mobile TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Admin',
      storeName TEXT,
      createdAt TEXT NOT NULL
    )
  `);
  const defaultAdmin = await db.get("SELECT * FROM users WHERE email = ?", ["admin@store.com"]);
  if (!defaultAdmin) {
    await db.run(
      "INSERT INTO users (id, email, mobile, password, role, storeName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["user_admin_default", "admin@store.com", "1234567890", "admin123", "Admin", "My Store", (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      originalPrice REAL,
      sale INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      images TEXT,
      colors TEXT,
      sizes TEXT,
      description TEXT,
      keySpecs TEXT,
      features TEXT,
      inventoryQuantity INTEGER DEFAULT 10,
      active INTEGER DEFAULT 1,
      cost REAL,
      spotlight INTEGER DEFAULT 0,
      ratingValue REAL DEFAULT 5.0,
      ratingCount INTEGER DEFAULT 1,
      seoTitle TEXT,
      seoDescription TEXT,
      seoKeywords TEXT,
      ogTitle TEXT,
      ogDescription TEXT,
      ogImage TEXT,
      variantPrices TEXT,
      ownerId TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      image TEXT,
      active INTEGER DEFAULT 1,
      productCount INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      customerMobile TEXT NOT NULL,
      address TEXT,
      city TEXT,
      pincode TEXT,
      notes TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      date TEXT NOT NULL,
      paymentMethod TEXT NOT NULL DEFAULT 'COD',
      orderType TEXT DEFAULT 'WhatsApp'
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image TEXT NOT NULL,
      link TEXT,
      active INTEGER DEFAULT 1,
      startDate TEXT,
      endDate TEXT,
      position INTEGER DEFAULT 0
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discountType TEXT NOT NULL DEFAULT 'percentage',
      discountValue REAL NOT NULL,
      minOrderValue REAL DEFAULT 0,
      expiryDate TEXT,
      usageLimit INTEGER,
      usedCount INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      active INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      items TEXT NOT NULL,
      location TEXT DEFAULT 'Header',
      active INTEGER DEFAULT 1
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  const genSettings = await db.get("SELECT * FROM settings WHERE key = ?", ["general"]);
  if (!genSettings) {
    const defaultGen = {
      storeName: "My Store",
      whatsappNumber: "+1234567890",
      currency: "USD"
    };
    await db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ["general", JSON.stringify(defaultGen)]);
  }
  const authSettings = await db.get("SELECT * FROM settings WHERE key = ?", ["auth"]);
  if (!authSettings) {
    const defaultAuth = {
      email: "admin@store.com",
      mobile: "1234567890",
      password: "admin123"
    };
    await db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ["auth", JSON.stringify(defaultAuth)]);
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'Staff',
      accountAccess TEXT DEFAULT 'Active',
      joinedDate TEXT NOT NULL
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerPhone TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      title TEXT,
      price REAL,
      image TEXT
    )
  `);
  const bannerCount = await db.get("SELECT COUNT(*) as count FROM banners");
  if (bannerCount && bannerCount.count === 0) {
    const sampleBanners = [
      {
        id: "ban_1",
        title: "Exclusive Collection - Modern Lifestyle Essentials",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
        link: "/categories",
        active: 1,
        position: 1
      },
      {
        id: "ban_2",
        title: "Special Mega Discounts - Limited Time WhatsApp Deals",
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
        link: "/categories",
        active: 1,
        position: 2
      },
      {
        id: "ban_3",
        title: "Premium Quality - Fast Direct Order via WhatsApp",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
        link: "/categories",
        active: 1,
        position: 3
      }
    ];
    for (const ban of sampleBanners) {
      await db.run(
        "INSERT INTO banners (id, title, image, link, active, position) VALUES (?, ?, ?, ?, ?, ?)",
        [ban.id, ban.title, ban.image, ban.link, ban.active, ban.position]
      );
    }
  }
  const catCount = await db.get("SELECT COUNT(*) as count FROM categories");
  if (catCount && catCount.count < 4) {
    const sampleCategories = [
      { id: "cat_1", name: "Apparel", icon: "checkroom", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80", active: 1, productCount: 5, sortOrder: 1 },
      { id: "cat_2", name: "Accessories", icon: "watch", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80", active: 1, productCount: 3, sortOrder: 2 },
      { id: "cat_3", name: "Outerwear", icon: "dry_cleaning", image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80", active: 1, productCount: 1, sortOrder: 3 },
      { id: "cat_4", name: "Footwear", icon: "steps", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80", active: 1, productCount: 1, sortOrder: 4 }
    ];
    for (const cat of sampleCategories) {
      await db.run(
        "INSERT OR REPLACE INTO categories (id, name, icon, image, active, productCount, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [cat.id, cat.name, cat.icon, cat.image, cat.active, cat.productCount, cat.sortOrder]
      );
    }
  }
  await seedDemoProducts(db);
  await seedDemoFaqs(db);
}
async function seedDemoFaqs(db) {
  const faqCount = await db.get("SELECT COUNT(*) as count FROM faqs");
  if (!faqCount || faqCount.count < 4) {
    const sampleFaqs = [
      {
        id: "faq_1",
        question: "How do I place a direct order via WhatsApp?",
        answer: 'Simply browse our catalog, select your item, colors, and sizes, then click the "WhatsApp Buy" button. This will instantly pre-fill your order details directly into a WhatsApp chat with our store team for fast confirmation.',
        category: "Ordering & Payment",
        active: 1,
        sortOrder: 1
      },
      {
        id: "faq_2",
        question: "What payment methods do you accept?",
        answer: "We support Cash on Delivery (COD), Direct Bank Transfer, UPI, Credit/Debit cards, and online payments via Stripe.",
        category: "Ordering & Payment",
        active: 1,
        sortOrder: 2
      },
      {
        id: "faq_3",
        question: "How long does shipping & delivery take?",
        answer: "Standard domestic delivery takes 2 to 5 business days. Express shipping options are available at checkout.",
        category: "Shipping",
        active: 1,
        sortOrder: 3
      },
      {
        id: "faq_4",
        question: "What is your return & exchange policy?",
        answer: "We offer a hassle-free 30-day return & exchange policy. Items must be unworn, unwashed, and in original packaging with tags intact.",
        category: "Returns",
        active: 1,
        sortOrder: 4
      },
      {
        id: "faq_5",
        question: "Are all products authentic and original?",
        answer: "Yes! All items in our store are 100% authentic, handcrafted from premium materials, and quality-inspected before dispatch.",
        category: "General",
        active: 1,
        sortOrder: 5
      },
      {
        id: "faq_6",
        question: "How can I track my order delivery?",
        answer: 'Once your order is processed, you will receive a direct tracking link via WhatsApp/SMS. You can also visit our "Track Order" page anytime.',
        category: "Shipping",
        active: 1,
        sortOrder: 6
      }
    ];
    for (const faq of sampleFaqs) {
      await db.run(
        "INSERT OR REPLACE INTO faqs (id, question, answer, category, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
        [faq.id, faq.question, faq.answer, faq.category, faq.active, faq.sortOrder]
      );
    }
  }
}
async function seedDemoProducts(db, force = false) {
  const prodCount = await db.get("SELECT COUNT(*) as count FROM products");
  const hasOld = await db.get("SELECT COUNT(*) as count FROM products WHERE title LIKE '%Headphones%' OR title LIKE '%Watch%'");
  if (force || !prodCount || prodCount.count < 10 || hasOld && hasOld.count > 0) {
    await db.run("DELETE FROM products WHERE title LIKE '%Headphones%' OR title LIKE '%Watch%' OR title LIKE '%Denim Jacket%'");
    const sampleProducts = [
      {
        id: "prod_1",
        title: "Minimalist Linen Blazer",
        category: "Apparel",
        price: 149,
        originalPrice: 189,
        sale: 1,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#DD8560", "#2C2C2C", "#E5E0D8"]),
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        description: "Tailored from 100% breathable organic European flax linen. Cut in a relaxed silhouette with notch lapels and subtle shoulder pads.",
        inventoryQuantity: 25,
        active: 1,
        spotlight: 1,
        ratingValue: 4.9,
        ratingCount: 128
      },
      {
        id: "prod_2",
        title: "Silk Cashmere Knit Sweater",
        category: "Apparel",
        price: 120,
        originalPrice: 155,
        sale: 1,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#C2A68C", "#111111", "#4A5568"]),
        sizes: JSON.stringify(["XS", "S", "M", "L"]),
        description: "An ultra-soft blend of Grade-A Mongolian cashmere and fine mulberry silk. Features a fine gauge knit with ribbed trim.",
        inventoryQuantity: 30,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 94
      },
      {
        id: "prod_3",
        title: "Structured Leather Tote Bag",
        category: "Accessories",
        price: 210,
        originalPrice: 260,
        sale: 0,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#8B4513", "#1A1A1A", "#D2B48C"]),
        sizes: JSON.stringify(["One Size"]),
        description: "Handcrafted from full-grain Italian vegetable-tanned leather. Includes magnetic closure and padded laptop sleeve.",
        inventoryQuantity: 18,
        active: 1,
        spotlight: 1,
        ratingValue: 5,
        ratingCount: 215
      },
      {
        id: "prod_4",
        title: "Pleated High-Waist Midi Skirt",
        category: "Apparel",
        price: 89,
        originalPrice: 110,
        sale: 1,
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#E2D4C9", "#3D405B", "#81B29A"]),
        sizes: JSON.stringify(["S", "M", "L"]),
        description: "Flowy accordion knife-pleated skirt with an elasticated waistband for effortless elegance.",
        inventoryQuantity: 40,
        active: 1,
        spotlight: 0,
        ratingValue: 4.7,
        ratingCount: 62
      },
      {
        id: "prod_5",
        title: "Sculptural Gold Hoop Earrings",
        category: "Accessories",
        price: 65,
        originalPrice: 85,
        sale: 0,
        image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#FFD700", "#C0C0C0"]),
        sizes: JSON.stringify(["Standard"]),
        description: "Cast in 18k gold-plated recycled sterling silver with a hollow lightweight design.",
        inventoryQuantity: 50,
        active: 1,
        spotlight: 1,
        ratingValue: 4.9,
        ratingCount: 180
      },
      {
        id: "prod_6",
        title: "Oversized Organic Cotton Trench Coat",
        category: "Outerwear",
        price: 275,
        originalPrice: 340,
        sale: 1,
        image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#C5A880", "#1F2421"]),
        sizes: JSON.stringify(["S", "M", "L"]),
        description: "Double-breasted trench coat with storm flaps, removable waist belt, and water-repellent organic cotton gabardine.",
        inventoryQuantity: 15,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 78
      },
      {
        id: "prod_7",
        title: "Handcrafted Leather Mule Sandals",
        category: "Footwear",
        price: 135,
        originalPrice: 165,
        sale: 0,
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#DD8560", "#222222", "#F5F5DC"]),
        sizes: JSON.stringify(["36", "37", "38", "39", "40"]),
        description: "Square-toe leather mules with a block wooden heel and cushioned footbed.",
        inventoryQuantity: 22,
        active: 1,
        spotlight: 0,
        ratingValue: 4.6,
        ratingCount: 51
      },
      {
        id: "prod_8",
        title: "Tailored Wide-Leg Wool Trousers",
        category: "Apparel",
        price: 115,
        originalPrice: 140,
        sale: 1,
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#4A4E69", "#9A8C98"]),
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        description: "High-waisted pleated trousers crafted from lightweight virgin wool blend with front darts.",
        inventoryQuantity: 28,
        active: 1,
        spotlight: 0,
        ratingValue: 4.9,
        ratingCount: 110
      },
      {
        id: "prod_9",
        title: "Classic Silk Button-Down Shirt",
        category: "Apparel",
        price: 98,
        originalPrice: 125,
        sale: 0,
        image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#FFFFFF", "#DD8560", "#B5C99A"]),
        sizes: JSON.stringify(["XS", "S", "M", "L"]),
        description: "Fluid silk habotai shirt with mother-of-pearl buttons and curved drop hem.",
        inventoryQuantity: 35,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 142
      },
      {
        id: "prod_10",
        title: "Polarized Geometric Sunglasses",
        category: "Accessories",
        price: 75,
        originalPrice: 95,
        sale: 1,
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        images: JSON.stringify(["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"]),
        colors: JSON.stringify(["#2B2B2B", "#8B5A2B"]),
        sizes: JSON.stringify(["Standard"]),
        description: "Acetate frame with UV400 anti-glare polarized lenses and gold metal accents.",
        inventoryQuantity: 45,
        active: 1,
        spotlight: 0,
        ratingValue: 4.7,
        ratingCount: 89
      }
    ];
    for (const prod of sampleProducts) {
      await db.run(
        `INSERT OR REPLACE INTO products (id, title, category, price, originalPrice, sale, image, images, colors, sizes, description, inventoryQuantity, active, spotlight, ratingValue, ratingCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prod.id, prod.title, prod.category, prod.price, prod.originalPrice, prod.sale, prod.image, prod.images, prod.colors, prod.sizes, prod.description, prod.inventoryQuantity, prod.active, prod.spotlight, prod.ratingValue, prod.ratingCount]
      );
    }
  }
}

// server.ts
dotenv.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3001;
  app.use(import_express.default.json());
  const db = await getDb();
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "sqlite" });
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, storeName, mobile, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const existing = await db.get("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
      if (existing) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      const id = "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const userRole = role || "Admin";
      const userStoreName = storeName || "My Store";
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      await db.run(
        "INSERT INTO users (id, email, mobile, password, role, storeName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, email.trim().toLowerCase(), mobile || null, password, userRole, userStoreName, createdAt]
      );
      res.json({ id, email, role: userRole, storeName: userStoreName });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: "Identifier (Email/Mobile) and password are required" });
      }
      const term = identifier.trim().toLowerCase();
      const user = await db.get(
        "SELECT * FROM users WHERE (LOWER(email) = ? OR mobile = ?) AND password = ?",
        [term, identifier.trim(), password]
      );
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            storeName: user.storeName
          }
        });
      }
      const authSetting = await db.get("SELECT value FROM settings WHERE key = ?", ["auth"]);
      if (authSetting) {
        const authData = JSON.parse(authSetting.value);
        const emailMatch = authData.email && term === authData.email.toLowerCase();
        const mobileMatch = authData.mobile && identifier.trim() === authData.mobile;
        const passMatch = authData.password === password;
        if ((emailMatch || mobileMatch) && passMatch) {
          return res.json({
            success: true,
            user: {
              id: "admin_setting_user",
              email: authData.email,
              role: "Admin",
              storeName: "Store Admin"
            }
          });
        }
      }
      res.status(401).json({ error: "Invalid login credentials." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.all("/api/seed-demo", async (req, res) => {
    try {
      await seedDemoProducts(db, true);
      const rows = await db.all("SELECT * FROM products");
      res.json({ success: true, message: "Successfully seeded 10 luxury demo products!", count: rows.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/products", async (req, res) => {
    try {
      let rows = await db.all("SELECT * FROM products");
      const hasOld = rows.some((r) => r.title && (r.title.toLowerCase().includes("headphones") || r.title.toLowerCase().includes("watch")));
      if (rows.length < 10 || hasOld) {
        await seedDemoProducts(db, true);
        rows = await db.all("SELECT * FROM products");
      }
      const products = rows.map((r) => ({
        ...r,
        sale: Boolean(r.sale),
        active: Boolean(r.active),
        spotlight: Boolean(r.spotlight),
        images: r.images ? JSON.parse(r.images) : void 0,
        colors: r.colors ? JSON.parse(r.colors) : void 0,
        sizes: r.sizes ? JSON.parse(r.sizes) : void 0,
        variantPrices: r.variantPrices ? JSON.parse(r.variantPrices) : void 0
      }));
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/products", async (req, res) => {
    try {
      const p = req.body;
      const id = p.id || "prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      await db.run(
        `INSERT INTO products (
          id, title, category, price, originalPrice, sale, image, images, colors, sizes,
          description, keySpecs, features, inventoryQuantity, active, cost, spotlight,
          ratingValue, ratingCount, seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogImage, variantPrices, ownerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          p.title,
          p.category,
          p.price,
          p.originalPrice || null,
          p.sale ? 1 : 0,
          p.image,
          p.images ? JSON.stringify(p.images) : null,
          p.colors ? JSON.stringify(p.colors) : null,
          p.sizes ? JSON.stringify(p.sizes) : null,
          p.description || null,
          p.keySpecs || null,
          p.features || null,
          p.inventoryQuantity ?? 10,
          p.active !== false ? 1 : 0,
          p.cost || null,
          p.spotlight ? 1 : 0,
          p.ratingValue || 5,
          p.ratingCount || 0,
          p.seoTitle || null,
          p.seoDescription || null,
          p.seoKeywords || null,
          p.ogTitle || null,
          p.ogDescription || null,
          p.ogImage || null,
          p.variantPrices ? JSON.stringify(p.variantPrices) : null,
          p.ownerId || null
        ]
      );
      res.json({ id, ...p });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const p = req.body;
      await db.run(
        `UPDATE products SET
          title = ?, category = ?, price = ?, originalPrice = ?, sale = ?, image = ?, images = ?,
          colors = ?, sizes = ?, description = ?, keySpecs = ?, features = ?, inventoryQuantity = ?,
          active = ?, cost = ?, spotlight = ?, ratingValue = ?, ratingCount = ?, seoTitle = ?,
          seoDescription = ?, seoKeywords = ?, ogTitle = ?, ogDescription = ?, ogImage = ?, variantPrices = ?
         WHERE id = ?`,
        [
          p.title,
          p.category,
          p.price,
          p.originalPrice || null,
          p.sale ? 1 : 0,
          p.image,
          p.images ? JSON.stringify(p.images) : null,
          p.colors ? JSON.stringify(p.colors) : null,
          p.sizes ? JSON.stringify(p.sizes) : null,
          p.description || null,
          p.keySpecs || null,
          p.features || null,
          p.inventoryQuantity ?? 10,
          p.active !== false ? 1 : 0,
          p.cost || null,
          p.spotlight ? 1 : 0,
          p.ratingValue || 5,
          p.ratingCount || 0,
          p.seoTitle || null,
          p.seoDescription || null,
          p.seoKeywords || null,
          p.ogTitle || null,
          p.ogDescription || null,
          p.ogImage || null,
          p.variantPrices ? JSON.stringify(p.variantPrices) : null,
          id
        ]
      );
      res.json({ id, ...p });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/products/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/categories", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM categories ORDER BY sortOrder ASC");
      res.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/categories", async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      await db.run(
        "INSERT INTO categories (id, name, icon, image, active, productCount, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, c.name, c.icon || null, c.image || null, c.active !== false ? 1 : 0, c.productCount || 0, c.sortOrder || 0]
      );
      res.json({ id, ...c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const c = req.body;
      await db.run(
        "UPDATE categories SET name = ?, icon = ?, image = ?, active = ?, productCount = ?, sortOrder = ? WHERE id = ?",
        [c.name, c.icon || null, c.image || null, c.active !== false ? 1 : 0, c.productCount || 0, c.sortOrder || 0, id]
      );
      res.json({ id, ...c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM categories WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/orders", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM orders ORDER BY date DESC");
      res.json(rows.map((r) => ({ ...r, items: JSON.parse(r.items) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/orders", async (req, res) => {
    try {
      const o = req.body;
      const id = o.id || "ORD-" + Date.now();
      await db.run(
        `INSERT INTO orders (id, customerName, customerMobile, address, city, pincode, notes, items, total, status, date, paymentMethod, orderType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          o.customerName,
          o.customerMobile,
          o.address || null,
          o.city || null,
          o.pincode || null,
          o.notes || null,
          JSON.stringify(o.items || []),
          o.total,
          o.status || "Pending",
          o.date || (/* @__PURE__ */ new Date()).toISOString(),
          o.paymentMethod || "COD",
          o.orderType || "WhatsApp"
        ]
      );
      res.json({ id, ...o });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM orders WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/banners", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM banners ORDER BY position ASC");
      res.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/banners", async (req, res) => {
    try {
      const b = req.body;
      const id = b.id || "ban_" + Date.now();
      await db.run(
        "INSERT INTO banners (id, title, image, link, active, startDate, endDate, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, b.title, b.image, b.link || null, b.active !== false ? 1 : 0, b.startDate || null, b.endDate || null, b.position || 0]
      );
      res.json({ id, ...b });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/banners/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body;
      await db.run(
        "UPDATE banners SET title = ?, image = ?, link = ?, active = ?, startDate = ?, endDate = ?, position = ? WHERE id = ?",
        [b.title, b.image, b.link || null, b.active !== false ? 1 : 0, b.startDate || null, b.endDate || null, b.position || 0, id]
      );
      res.json({ id, ...b });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/banners/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM banners WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/coupons", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM coupons");
      res.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/coupons", async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || "coup_" + Date.now();
      await db.run(
        "INSERT INTO coupons (id, code, discountType, discountValue, minOrderValue, expiryDate, usageLimit, usedCount, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, c.code, c.discountType, c.discountValue, c.minOrderValue || 0, c.expiryDate || null, c.usageLimit || null, c.usedCount || 0, c.active !== false ? 1 : 0]
      );
      res.json({ id, ...c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/coupons/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM coupons WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/faqs", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM faqs ORDER BY sortOrder ASC");
      res.json(rows.map((r) => ({ ...r, active: Boolean(r.active) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/faqs", async (req, res) => {
    try {
      const f = req.body;
      const id = f.id || "faq_" + Date.now();
      await db.run(
        "INSERT INTO faqs (id, question, answer, category, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)",
        [id, f.question, f.answer, f.category || "General", f.active !== false ? 1 : 0, f.sortOrder || 0]
      );
      res.json({ id, ...f });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/faqs/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM faqs WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/menus", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM menus");
      res.json(rows.map((r) => ({ ...r, items: JSON.parse(r.items), active: Boolean(r.active) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/menus", async (req, res) => {
    try {
      const m = req.body;
      const id = m.id || "menu_" + Date.now();
      await db.run(
        "INSERT INTO menus (id, title, items, location, active) VALUES (?, ?, ?, ?, ?)",
        [id, m.title, JSON.stringify(m.items || []), m.location || "Header", m.active !== false ? 1 : 0]
      );
      res.json({ id, ...m });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const row = await db.get("SELECT value FROM settings WHERE key = ?", [req.params.key]);
      if (row) {
        res.json(JSON.parse(row.value));
      } else {
        res.json(null);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const valueStr = JSON.stringify(req.body);
      await db.run(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, valueStr]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/team", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM team");
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/team", async (req, res) => {
    try {
      const t = req.body;
      const id = t.id || "team_" + Date.now();
      await db.run(
        "INSERT INTO team (id, name, email, role, accountAccess, joinedDate) VALUES (?, ?, ?, ?, ?, ?)",
        [id, t.name, t.email, t.role || "Staff", t.accountAccess || "Active", t.joinedDate || (/* @__PURE__ */ new Date()).toISOString()]
      );
      res.json({ id, ...t });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/team/:id", async (req, res) => {
    try {
      await db.run("DELETE FROM team WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/abandoned-carts", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM abandoned_carts");
      res.json(rows.map((r) => ({ ...r, items: JSON.parse(r.items) })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/abandoned-carts", async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || "cart_" + Date.now();
      await db.run(
        "INSERT INTO abandoned_carts (id, customerName, customerPhone, items, total, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET items = excluded.items, total = excluded.total, updatedAt = excluded.updatedAt",
        [id, c.customerName || null, c.customerPhone || null, JSON.stringify(c.items || []), c.total, (/* @__PURE__ */ new Date()).toISOString()]
      );
      res.json({ id, ...c });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/wishlist/:userId", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM wishlists WHERE userId = ?", [req.params.userId]);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/wishlist", async (req, res) => {
    try {
      const { userId, product } = req.body;
      const id = "wish_" + userId + "_" + product.id;
      await db.run(
        "INSERT INTO wishlists (id, userId, productId, title, price, image) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
        [id, userId, product.id, product.title, product.price, product.image]
      );
      res.json({ id, ...product });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
    try {
      const { userId, productId } = req.params;
      await db.run("DELETE FROM wishlists WHERE userId = ? AND productId = ?", [userId, productId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/robots.txt", (req, res) => {
    const host = req.get("host") || "localhost:3001";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;
    const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /storeadmin/

# AI Crawlers & Answer Engines Optimization (AEO)
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: GoogleOther
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.header("Content-Type", "text/plain");
    res.status(200).send(content);
  });
  app.get("/llms.txt", async (req, res) => {
    try {
      const host = req.get("host") || "localhost:3001";
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const baseUrl = `${protocol}://${host}`;
      const brandingSetting = await db.get("SELECT value FROM settings WHERE key = ?", ["branding"]);
      const branding = brandingSetting ? JSON.parse(brandingSetting.value) : {};
      const storeName = branding.storeName || "Boutique Fashion & Accessories Store";
      const products = await db.all("SELECT title, price, category, description FROM products WHERE active = 1");
      let markdown = `# ${storeName}

`;
      markdown += `> Premium curated fashion, apparel, and lifestyle accessories designed with timeless elegance.

`;
      markdown += `## About Us
`;
      markdown += `We deliver high-quality, handcrafted, and curated boutique products directly to your doorstep. Browse our collection online and checkout instantly via WhatsApp or online payment gateways.

`;
      markdown += `## Key Product Catalog

`;
      products.forEach((p) => {
        markdown += `- **${p.title}** ($${p.price}) [Category: ${p.category || "General"}]
`;
        if (p.description) {
          markdown += `  - ${p.description.substring(0, 120)}...
`;
        }
      });
      markdown += `
## Useful Links
`;
      markdown += `- Storefront Home: ${baseUrl}/
`;
      markdown += `- All Collections: ${baseUrl}/categories
`;
      markdown += `- XML Sitemap: ${baseUrl}/sitemap.xml
`;
      res.header("Content-Type", "text/markdown");
      res.status(200).send(markdown);
    } catch (err) {
      res.status(500).send("Error generating llms.txt");
    }
  });
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = req.get("host") || "localhost:3000";
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const baseUrl = `${protocol}://${host}`;
      const products = await db.all("SELECT title, active FROM products");
      const categories = await db.all("SELECT name FROM categories");
      const slugify = (text) => {
        if (!text) return "";
        return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
      };
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      xml += `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;
      xml += `  <url>
    <loc>${baseUrl}/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      categories.forEach((cat) => {
        if (cat.name) {
          const catSlug = encodeURIComponent(cat.name);
          xml += `  <url>
    <loc>${baseUrl}/category/${catSlug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
      products.forEach((prod) => {
        if (prod.title && prod.active !== 0) {
          const prodSlug = slugify(prod.title);
          xml += `  <url>
    <loc>${baseUrl}/product/${prodSlug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
        }
      });
      xml += `</urlset>`;
      res.header("Content-Type", "application/xml");
      res.status(200).send(xml);
    } catch (err) {
      console.error("Sitemap generation error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = import_fs.default.readFileSync(import_path2.default.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} with SQLite database`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const altPort = PORT + 1;
      console.log(`Port ${PORT} in use, trying port ${altPort}...`);
      app.listen(altPort, () => {
        console.log(`Server running on http://localhost:${altPort} with SQLite database`);
      });
    }
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

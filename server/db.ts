import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDb(dbInstance);
  return dbInstance;
}

async function initDb(db: Database) {
  // Users table
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

  // Default Admin User
  const defaultAdmin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@store.com']);
  if (!defaultAdmin) {
    await db.run(
      'INSERT INTO users (id, email, mobile, password, role, storeName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['user_admin_default', 'admin@store.com', '1234567890', 'admin123', 'Admin', 'My Store', new Date().toISOString()]
    );
  }

  // Products table
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

  // Categories table
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

  // Orders table
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

  // Banners table
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

  // Coupons table
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

  // FAQs table
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

  // Menus table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      items TEXT NOT NULL,
      location TEXT DEFAULT 'Header',
      active INTEGER DEFAULT 1
    )
  `);

  // Settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Default General Settings
  const genSettings = await db.get('SELECT * FROM settings WHERE key = ?', ['general']);
  if (!genSettings) {
    const defaultGen = {
      storeName: 'My Store',
      whatsappNumber: '+1234567890',
      currency: 'USD'
    };
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['general', JSON.stringify(defaultGen)]);
  }

  // Default Auth Settings
  const authSettings = await db.get('SELECT * FROM settings WHERE key = ?', ['auth']);
  if (!authSettings) {
    const defaultAuth = {
      email: 'admin@store.com',
      mobile: '1234567890',
      password: 'admin123'
    };
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['auth', JSON.stringify(defaultAuth)]);
  }

  // Team table
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

  // Abandoned Carts table
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

  // Wishlists table
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

  // Seed sample banners if empty
  const bannerCount = await db.get('SELECT COUNT(*) as count FROM banners');
  if (bannerCount && bannerCount.count === 0) {
    const sampleBanners = [
      {
        id: 'ban_1',
        title: 'Exclusive Collection - Modern Lifestyle Essentials',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        link: '/categories',
        active: 1,
        position: 1
      },
      {
        id: 'ban_2',
        title: 'Special Mega Discounts - Limited Time WhatsApp Deals',
        image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
        link: '/categories',
        active: 1,
        position: 2
      },
      {
        id: 'ban_3',
        title: 'Premium Quality - Fast Direct Order via WhatsApp',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80',
        link: '/categories',
        active: 1,
        position: 3
      }
    ];
    for (const ban of sampleBanners) {
      await db.run(
        'INSERT INTO banners (id, title, image, link, active, position) VALUES (?, ?, ?, ?, ?, ?)',
        [ban.id, ban.title, ban.image, ban.link, ban.active, ban.position]
      );
    }
  }

  // Seed sample categories if empty or low count
  const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
  if (catCount && catCount.count < 4) {
    const sampleCategories = [
      { id: 'cat_1', name: 'Apparel', icon: 'checkroom', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80', active: 1, productCount: 5, sortOrder: 1 },
      { id: 'cat_2', name: 'Accessories', icon: 'watch', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', active: 1, productCount: 3, sortOrder: 2 },
      { id: 'cat_3', name: 'Outerwear', icon: 'dry_cleaning', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80', active: 1, productCount: 1, sortOrder: 3 },
      { id: 'cat_4', name: 'Footwear', icon: 'steps', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80', active: 1, productCount: 1, sortOrder: 4 }
    ];
    for (const cat of sampleCategories) {
      await db.run(
        'INSERT OR REPLACE INTO categories (id, name, icon, image, active, productCount, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.icon, cat.image, cat.active, cat.productCount, cat.sortOrder]
      );
    }
  }

  await seedDemoProducts(db);
  await seedDemoFaqs(db);
}

export async function seedDemoFaqs(db: Database) {
  const faqCount = await db.get('SELECT COUNT(*) as count FROM faqs');
  if (!faqCount || faqCount.count < 4) {
    const sampleFaqs = [
      {
        id: 'faq_1',
        question: 'How do I place a direct order via WhatsApp?',
        answer: 'Simply browse our catalog, select your item, colors, and sizes, then click the "WhatsApp Buy" button. This will instantly pre-fill your order details directly into a WhatsApp chat with our store team for fast confirmation.',
        category: 'Ordering & Payment',
        active: 1,
        sortOrder: 1
      },
      {
        id: 'faq_2',
        question: 'What payment methods do you accept?',
        answer: 'We support Cash on Delivery (COD), Direct Bank Transfer, UPI, Credit/Debit cards, and online payments via Stripe.',
        category: 'Ordering & Payment',
        active: 1,
        sortOrder: 2
      },
      {
        id: 'faq_3',
        question: 'How long does shipping & delivery take?',
        answer: 'Standard domestic delivery takes 2 to 5 business days. Express shipping options are available at checkout.',
        category: 'Shipping',
        active: 1,
        sortOrder: 3
      },
      {
        id: 'faq_4',
        question: 'What is your return & exchange policy?',
        answer: 'We offer a hassle-free 30-day return & exchange policy. Items must be unworn, unwashed, and in original packaging with tags intact.',
        category: 'Returns',
        active: 1,
        sortOrder: 4
      },
      {
        id: 'faq_5',
        question: 'Are all products authentic and original?',
        answer: 'Yes! All items in our store are 100% authentic, handcrafted from premium materials, and quality-inspected before dispatch.',
        category: 'General',
        active: 1,
        sortOrder: 5
      },
      {
        id: 'faq_6',
        question: 'How can I track my order delivery?',
        answer: 'Once your order is processed, you will receive a direct tracking link via WhatsApp/SMS. You can also visit our "Track Order" page anytime.',
        category: 'Shipping',
        active: 1,
        sortOrder: 6
      }
    ];
    for (const faq of sampleFaqs) {
      await db.run(
        'INSERT OR REPLACE INTO faqs (id, question, answer, category, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
        [faq.id, faq.question, faq.answer, faq.category, faq.active, faq.sortOrder]
      );
    }
  }
}

export async function seedDemoProducts(db: Database, force: boolean = false) {
  const prodCount = await db.get('SELECT COUNT(*) as count FROM products');
  const hasOld = await db.get("SELECT COUNT(*) as count FROM products WHERE title LIKE '%Headphones%' OR title LIKE '%Watch%'");
  
  if (force || !prodCount || prodCount.count < 10 || (hasOld && hasOld.count > 0)) {
    // Clean old dummy products if any exist
    await db.run("DELETE FROM products WHERE title LIKE '%Headphones%' OR title LIKE '%Watch%' OR title LIKE '%Denim Jacket%'");

    const sampleProducts = [
      {
        id: 'prod_1',
        title: 'Minimalist Linen Blazer',
        category: 'Apparel',
        price: 149.00,
        originalPrice: 189.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#DD8560', '#2C2C2C', '#E5E0D8']),
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        description: 'Tailored from 100% breathable organic European flax linen. Cut in a relaxed silhouette with notch lapels and subtle shoulder pads.',
        inventoryQuantity: 25,
        active: 1,
        spotlight: 1,
        ratingValue: 4.9,
        ratingCount: 128
      },
      {
        id: 'prod_2',
        title: 'Silk Cashmere Knit Sweater',
        category: 'Apparel',
        price: 120.00,
        originalPrice: 155.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#C2A68C', '#111111', '#4A5568']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
        description: 'An ultra-soft blend of Grade-A Mongolian cashmere and fine mulberry silk. Features a fine gauge knit with ribbed trim.',
        inventoryQuantity: 30,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 94
      },
      {
        id: 'prod_3',
        title: 'Structured Leather Tote Bag',
        category: 'Accessories',
        price: 210.00,
        originalPrice: 260.00,
        sale: 0,
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#8B4513', '#1A1A1A', '#D2B48C']),
        sizes: JSON.stringify(['One Size']),
        description: 'Handcrafted from full-grain Italian vegetable-tanned leather. Includes magnetic closure and padded laptop sleeve.',
        inventoryQuantity: 18,
        active: 1,
        spotlight: 1,
        ratingValue: 5.0,
        ratingCount: 215
      },
      {
        id: 'prod_4',
        title: 'Pleated High-Waist Midi Skirt',
        category: 'Apparel',
        price: 89.00,
        originalPrice: 110.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#E2D4C9', '#3D405B', '#81B29A']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        description: 'Flowy accordion knife-pleated skirt with an elasticated waistband for effortless elegance.',
        inventoryQuantity: 40,
        active: 1,
        spotlight: 0,
        ratingValue: 4.7,
        ratingCount: 62
      },
      {
        id: 'prod_5',
        title: 'Sculptural Gold Hoop Earrings',
        category: 'Accessories',
        price: 65.00,
        originalPrice: 85.00,
        sale: 0,
        image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#FFD700', '#C0C0C0']),
        sizes: JSON.stringify(['Standard']),
        description: 'Cast in 18k gold-plated recycled sterling silver with a hollow lightweight design.',
        inventoryQuantity: 50,
        active: 1,
        spotlight: 1,
        ratingValue: 4.9,
        ratingCount: 180
      },
      {
        id: 'prod_6',
        title: 'Oversized Organic Cotton Trench Coat',
        category: 'Outerwear',
        price: 275.00,
        originalPrice: 340.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#C5A880', '#1F2421']),
        sizes: JSON.stringify(['S', 'M', 'L']),
        description: 'Double-breasted trench coat with storm flaps, removable waist belt, and water-repellent organic cotton gabardine.',
        inventoryQuantity: 15,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 78
      },
      {
        id: 'prod_7',
        title: 'Handcrafted Leather Mule Sandals',
        category: 'Footwear',
        price: 135.00,
        originalPrice: 165.00,
        sale: 0,
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#DD8560', '#222222', '#F5F5DC']),
        sizes: JSON.stringify(['36', '37', '38', '39', '40']),
        description: 'Square-toe leather mules with a block wooden heel and cushioned footbed.',
        inventoryQuantity: 22,
        active: 1,
        spotlight: 0,
        ratingValue: 4.6,
        ratingCount: 51
      },
      {
        id: 'prod_8',
        title: 'Tailored Wide-Leg Wool Trousers',
        category: 'Apparel',
        price: 115.00,
        originalPrice: 140.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#4A4E69', '#9A8C98']),
        sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
        description: 'High-waisted pleated trousers crafted from lightweight virgin wool blend with front darts.',
        inventoryQuantity: 28,
        active: 1,
        spotlight: 0,
        ratingValue: 4.9,
        ratingCount: 110
      },
      {
        id: 'prod_9',
        title: 'Classic Silk Button-Down Shirt',
        category: 'Apparel',
        price: 98.00,
        originalPrice: 125.00,
        sale: 0,
        image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#FFFFFF', '#DD8560', '#B5C99A']),
        sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
        description: 'Fluid silk habotai shirt with mother-of-pearl buttons and curved drop hem.',
        inventoryQuantity: 35,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 142
      },
      {
        id: 'prod_10',
        title: 'Polarized Geometric Sunglasses',
        category: 'Accessories',
        price: 75.00,
        originalPrice: 95.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
        images: JSON.stringify(['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80']),
        colors: JSON.stringify(['#2B2B2B', '#8B5A2B']),
        sizes: JSON.stringify(['Standard']),
        description: 'Acetate frame with UV400 anti-glare polarized lenses and gold metal accents.',
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

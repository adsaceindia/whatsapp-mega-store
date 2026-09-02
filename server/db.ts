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

  // Seed sample categories if empty
  const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
  if (catCount && catCount.count === 0) {
    const sampleCategories = [
      { id: 'cat_1', name: 'Electronics', icon: 'devices', active: 1, productCount: 2, sortOrder: 1 },
      { id: 'cat_2', name: 'Fashion', icon: 'checkroom', active: 1, productCount: 2, sortOrder: 2 },
      { id: 'cat_3', name: 'Home & Living', icon: 'home', active: 1, productCount: 1, sortOrder: 3 }
    ];
    for (const cat of sampleCategories) {
      await db.run(
        'INSERT INTO categories (id, name, icon, active, productCount, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.icon, cat.active, cat.productCount, cat.sortOrder]
      );
    }
  }

  // Seed sample products if empty
  const prodCount = await db.get('SELECT COUNT(*) as count FROM products');
  if (prodCount && prodCount.count === 0) {
    const sampleProducts = [
      {
        id: 'prod_1',
        title: 'Wireless Noise-Canceling Headphones',
        category: 'Electronics',
        price: 199.99,
        originalPrice: 249.99,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
        inventoryQuantity: 25,
        active: 1,
        spotlight: 1,
        ratingValue: 4.8,
        ratingCount: 124
      },
      {
        id: 'prod_2',
        title: 'Smart Fitness Watch Series 5',
        category: 'Electronics',
        price: 149.00,
        originalPrice: 179.00,
        sale: 1,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        description: 'Track your workouts, heart rate, sleep quality, and receive smart notifications.',
        inventoryQuantity: 40,
        active: 1,
        spotlight: 1,
        ratingValue: 4.7,
        ratingCount: 89
      },
      {
        id: 'prod_3',
        title: 'Classic Denim Jacket',
        category: 'Fashion',
        price: 79.99,
        originalPrice: 99.99,
        sale: 0,
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
        description: 'Timeless style crafted from 100% organic cotton denim.',
        inventoryQuantity: 15,
        active: 1,
        spotlight: 0,
        ratingValue: 4.5,
        ratingCount: 42
      }
    ];
    for (const prod of sampleProducts) {
      await db.run(
        `INSERT INTO products (id, title, category, price, originalPrice, sale, image, description, inventoryQuantity, active, spotlight, ratingValue, ratingCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prod.id, prod.title, prod.category, prod.price, prod.originalPrice, prod.sale, prod.image, prod.description, prod.inventoryQuantity, prod.active, prod.spotlight, prod.ratingValue, prod.ratingCount]
      );
    }
  }
}

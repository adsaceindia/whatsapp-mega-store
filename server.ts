import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { getDb } from './server/db';
dotenv.config();

// Lazy load Stripe
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  // Middleware
  app.use(express.json());

  // Initialize SQLite database
  const db = await getDb();

  // --- API Routes ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'sqlite' });
  });

  // Authentication: Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, storeName, mobile, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existing = await db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
      if (existing) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userRole = role || 'Admin';
      const userStoreName = storeName || 'My Store';
      const createdAt = new Date().toISOString();

      await db.run(
        'INSERT INTO users (id, email, mobile, password, role, storeName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, email.trim().toLowerCase(), mobile || null, password, userRole, userStoreName, createdAt]
      );

      res.json({ id, email, role: userRole, storeName: userStoreName });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Authentication: Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier (Email/Mobile) and password are required' });
      }

      const term = identifier.trim().toLowerCase();
      // Check in users table
      const user = await db.get(
        'SELECT * FROM users WHERE (LOWER(email) = ? OR mobile = ?) AND password = ?',
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

      // Fallback check in auth settings
      const authSetting = await db.get('SELECT value FROM settings WHERE key = ?', ['auth']);
      if (authSetting) {
        const authData = JSON.parse(authSetting.value);
        const emailMatch = authData.email && term === authData.email.toLowerCase();
        const mobileMatch = authData.mobile && identifier.trim() === authData.mobile;
        const passMatch = authData.password === password;

        if ((emailMatch || mobileMatch) && passMatch) {
          return res.json({
            success: true,
            user: {
              id: 'admin_setting_user',
              email: authData.email,
              role: 'Admin',
              storeName: 'Store Admin'
            }
          });
        }
      }

      res.status(401).json({ error: 'Invalid login credentials.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Products API
  app.get('/api/products', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM products');
      const products = rows.map(r => ({
        ...r,
        sale: Boolean(r.sale),
        active: Boolean(r.active),
        spotlight: Boolean(r.spotlight),
        images: r.images ? JSON.parse(r.images) : undefined,
        colors: r.colors ? JSON.parse(r.colors) : undefined,
        sizes: r.sizes ? JSON.parse(r.sizes) : undefined,
        variantPrices: r.variantPrices ? JSON.parse(r.variantPrices) : undefined
      }));
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const p = req.body;
      const id = p.id || 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.run(
        `INSERT INTO products (
          id, title, category, price, originalPrice, sale, image, images, colors, sizes,
          description, keySpecs, features, inventoryQuantity, active, cost, spotlight,
          ratingValue, ratingCount, seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogImage, variantPrices, ownerId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, p.title, p.category, p.price, p.originalPrice || null, p.sale ? 1 : 0, p.image,
          p.images ? JSON.stringify(p.images) : null,
          p.colors ? JSON.stringify(p.colors) : null,
          p.sizes ? JSON.stringify(p.sizes) : null,
          p.description || null, p.keySpecs || null, p.features || null,
          p.inventoryQuantity ?? 10, p.active !== false ? 1 : 0, p.cost || null, p.spotlight ? 1 : 0,
          p.ratingValue || 5.0, p.ratingCount || 0,
          p.seoTitle || null, p.seoDescription || null, p.seoKeywords || null,
          p.ogTitle || null, p.ogDescription || null, p.ogImage || null,
          p.variantPrices ? JSON.stringify(p.variantPrices) : null,
          p.ownerId || null
        ]
      );
      res.json({ id, ...p });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
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
          p.title, p.category, p.price, p.originalPrice || null, p.sale ? 1 : 0, p.image,
          p.images ? JSON.stringify(p.images) : null,
          p.colors ? JSON.stringify(p.colors) : null,
          p.sizes ? JSON.stringify(p.sizes) : null,
          p.description || null, p.keySpecs || null, p.features || null,
          p.inventoryQuantity ?? 10, p.active !== false ? 1 : 0, p.cost || null, p.spotlight ? 1 : 0,
          p.ratingValue || 5.0, p.ratingCount || 0,
          p.seoTitle || null, p.seoDescription || null, p.seoKeywords || null,
          p.ogTitle || null, p.ogDescription || null, p.ogImage || null,
          p.variantPrices ? JSON.stringify(p.variantPrices) : null,
          id
        ]
      );
      res.json({ id, ...p });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Categories API
  app.get('/api/categories', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM categories ORDER BY sortOrder ASC');
      res.json(rows.map(r => ({ ...r, active: Boolean(r.active) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await db.run(
        'INSERT INTO categories (id, name, icon, image, active, productCount, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, c.name, c.icon || null, c.image || null, c.active !== false ? 1 : 0, c.productCount || 0, c.sortOrder || 0]
      );
      res.json({ id, ...c });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const c = req.body;
      await db.run(
        'UPDATE categories SET name = ?, icon = ?, image = ?, active = ?, productCount = ?, sortOrder = ? WHERE id = ?',
        [c.name, c.icon || null, c.image || null, c.active !== false ? 1 : 0, c.productCount || 0, c.sortOrder || 0, id]
      );
      res.json({ id, ...c });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders API
  app.get('/api/orders', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM orders ORDER BY date DESC');
      res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const o = req.body;
      const id = o.id || 'ORD-' + Date.now();
      await db.run(
        `INSERT INTO orders (id, customerName, customerMobile, address, city, pincode, notes, items, total, status, date, paymentMethod, orderType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, o.customerName, o.customerMobile, o.address || null, o.city || null, o.pincode || null, o.notes || null,
          JSON.stringify(o.items || []), o.total, o.status || 'Pending', o.date || new Date().toISOString(),
          o.paymentMethod || 'COD', o.orderType || 'WhatsApp'
        ]
      );
      res.json({ id, ...o });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Banners API
  app.get('/api/banners', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM banners ORDER BY position ASC');
      res.json(rows.map(r => ({ ...r, active: Boolean(r.active) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/banners', async (req, res) => {
    try {
      const b = req.body;
      const id = b.id || 'ban_' + Date.now();
      await db.run(
        'INSERT INTO banners (id, title, image, link, active, startDate, endDate, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, b.title, b.image, b.link || null, b.active !== false ? 1 : 0, b.startDate || null, b.endDate || null, b.position || 0]
      );
      res.json({ id, ...b });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/banners/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const b = req.body;
      await db.run(
        'UPDATE banners SET title = ?, image = ?, link = ?, active = ?, startDate = ?, endDate = ?, position = ? WHERE id = ?',
        [b.title, b.image, b.link || null, b.active !== false ? 1 : 0, b.startDate || null, b.endDate || null, b.position || 0, id]
      );
      res.json({ id, ...b });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/banners/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM banners WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Coupons API
  app.get('/api/coupons', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM coupons');
      res.json(rows.map(r => ({ ...r, active: Boolean(r.active) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/coupons', async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || 'coup_' + Date.now();
      await db.run(
        'INSERT INTO coupons (id, code, discountType, discountValue, minOrderValue, expiryDate, usageLimit, usedCount, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, c.code, c.discountType, c.discountValue, c.minOrderValue || 0, c.expiryDate || null, c.usageLimit || null, c.usedCount || 0, c.active !== false ? 1 : 0]
      );
      res.json({ id, ...c });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/coupons/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // FAQs API
  app.get('/api/faqs', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM faqs ORDER BY sortOrder ASC');
      res.json(rows.map(r => ({ ...r, active: Boolean(r.active) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/faqs', async (req, res) => {
    try {
      const f = req.body;
      const id = f.id || 'faq_' + Date.now();
      await db.run(
        'INSERT INTO faqs (id, question, answer, category, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
        [id, f.question, f.answer, f.category || 'General', f.active !== false ? 1 : 0, f.sortOrder || 0]
      );
      res.json({ id, ...f });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/faqs/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM faqs WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Menus API
  app.get('/api/menus', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM menus');
      res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items), active: Boolean(r.active) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/menus', async (req, res) => {
    try {
      const m = req.body;
      const id = m.id || 'menu_' + Date.now();
      await db.run(
        'INSERT INTO menus (id, title, items, location, active) VALUES (?, ?, ?, ?, ?)',
        [id, m.title, JSON.stringify(m.items || []), m.location || 'Header', m.active !== false ? 1 : 0]
      );
      res.json({ id, ...m });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings API (Key-Value pair: general, branding, auth, etc.)
  app.get('/api/settings/:key', async (req, res) => {
    try {
      const row = await db.get('SELECT value FROM settings WHERE key = ?', [req.params.key]);
      if (row) {
        res.json(JSON.parse(row.value));
      } else {
        res.json(null);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:key', async (req, res) => {
    try {
      const { key } = req.params;
      const valueStr = JSON.stringify(req.body);
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, valueStr]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Team API
  app.get('/api/team', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM team');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/team', async (req, res) => {
    try {
      const t = req.body;
      const id = t.id || 'team_' + Date.now();
      await db.run(
        'INSERT INTO team (id, name, email, role, accountAccess, joinedDate) VALUES (?, ?, ?, ?, ?, ?)',
        [id, t.name, t.email, t.role || 'Staff', t.accountAccess || 'Active', t.joinedDate || new Date().toISOString()]
      );
      res.json({ id, ...t });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/team/:id', async (req, res) => {
    try {
      await db.run('DELETE FROM team WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Abandoned Carts API
  app.get('/api/abandoned-carts', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM abandoned_carts');
      res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/abandoned-carts', async (req, res) => {
    try {
      const c = req.body;
      const id = c.id || 'cart_' + Date.now();
      await db.run(
        'INSERT INTO abandoned_carts (id, customerName, customerPhone, items, total, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET items = excluded.items, total = excluded.total, updatedAt = excluded.updatedAt',
        [id, c.customerName || null, c.customerPhone || null, JSON.stringify(c.items || []), c.total, new Date().toISOString()]
      );
      res.json({ id, ...c });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Wishlist API
  app.get('/api/wishlist/:userId', async (req, res) => {
    try {
      const rows = await db.all('SELECT * FROM wishlists WHERE userId = ?', [req.params.userId]);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/wishlist', async (req, res) => {
    try {
      const { userId, product } = req.body;
      const id = 'wish_' + userId + '_' + product.id;
      await db.run(
        'INSERT INTO wishlists (id, userId, productId, title, price, image) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING',
        [id, userId, product.id, product.title, product.price, product.image]
      );
      res.json({ id, ...product });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/wishlist/:userId/:productId', async (req, res) => {
    try {
      const { userId, productId } = req.params;
      await db.run('DELETE FROM wishlists WHERE userId = ? AND productId = ?', [userId, productId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic XML Sitemap Generator
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const products = await db.all('SELECT title, active FROM products');
      const categories = await db.all('SELECT name FROM categories');

      const slugify = (text: string): string => {
        if (!text) return "";
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');
      };

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${baseUrl}/categories</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

      categories.forEach((cat: any) => {
        if (cat.name) {
          const catSlug = encodeURIComponent(cat.name);
          xml += `  <url>\n    <loc>${baseUrl}/category/${catSlug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }
      });

      products.forEach((prod: any) => {
        if (prod.title && prod.active !== 0) {
          const prodSlug = slugify(prod.title);
          xml += `  <url>\n    <loc>${baseUrl}/product/${prodSlug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        }
      });

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } catch (err: any) {
      console.error("Sitemap generation error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // --- Vite Middleware for Dev OR Static Assets for Prod ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} with SQLite database`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const altPort = PORT + 1;
      console.log(`Port ${PORT} in use, trying port ${altPort}...`);
      app.listen(altPort, () => {
        console.log(`Server running on http://localhost:${altPort} with SQLite database`);
      });
    }
  });
}

startServer();

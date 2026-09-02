# Hostinger Deployment Guide - WhatsApp Mega Ecommerce Store

This guide details how to host your project on **Hostinger**.

---

## Method 1: Hostinger VPS (Recommended & Best Performance)

Hostinger VPS gives full SSH access to run your Node.js server with PM2 process manager and Nginx reverse proxy.

### Step 1: Connect to your Hostinger VPS via SSH
Open your terminal or PuTTY and SSH into your Hostinger VPS:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

### Step 2: Install Node.js (v20) and PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

### Step 3: Upload your Code or Clone Repository
Upload your project files via SFTP (FileZilla) or clone your Git repository:
```bash
cd /var/www
git clone <YOUR_GIT_REPOSITORY_URL> whatsapp-store
cd whatsapp-store
```

### Step 4: Install Dependencies & Build
```bash
npm install
npm run build
```

### Step 5: Start the Server with PM2
```bash
pm2 start dist/server.cjs --name "whatsapp-store"
pm2 save
pm2 startup
```

### Step 6: Configure Nginx (Reverse Proxy to Port 3001)
1. Install Nginx:
   ```bash
   apt install -y nginx
   ```
2. Edit default site configuration:
   ```bash
   nano /etc/nginx/sites-available/default
   ```
3. Replace contents with:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Test and restart Nginx:
   ```bash
   nginx -t
   systemctl restart nginx
   ```

---

## Method 2: Hostinger hPanel Node.js Application (Web Hosting)

If you have Hostinger Business or Cloud Web Hosting with Node.js support in hPanel:

1. **Log in to Hostinger hPanel**.
2. Navigate to **Websites** -> **Manage** -> **Setup Node.js App** (or **Node.js Manager**).
3. Click **Create Application**:
   - **Node.js Version**: Select `20.x` or `18.x`
   - **Application Root**: `whatsapp-store`
   - **Application Startup File**: `dist/server.cjs`
4. Upload your project folder (including `dist/` built folder and `package.json`).
5. Open the built-in hPanel Terminal or SSH:
   ```bash
   npm install --production
   ```
6. Click **Restart Application** in hPanel.

---

## Initial Admin Credentials

When booted on Hostinger, SQLite automatically initializes your database:
* **Admin Email / Mobile**: `admin@store.com` *(or `1234567890`)*
* **Admin Password**: `admin123`

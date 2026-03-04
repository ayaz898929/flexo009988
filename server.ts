import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import Database from "better-sqlite3";

dotenv.config();

const db = new Database("flexo.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    originalPrice REAL,
    category TEXT,
    image TEXT,
    description TEXT,
    rating REAL DEFAULT 5.0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customerName TEXT,
    phone TEXT,
    address TEXT,
    product TEXT,
    total REAL,
    paymentMethod TEXT,
    trxID TEXT,
    date TEXT,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user'
  );
`);

// Seed initial categories if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insert = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ["All", "Electronics", "Accessories", "Furniture"].forEach(cat => insert.run(cat));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // --- Auth Routes ---
  app.post("/api/signup", (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO users (name, email, phone, password)
        VALUES (?, ?, ?, ?)
      `).run(name, email, phone, password);
      
      const user = db.prepare("SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json({ success: true, user });
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email or Phone already exists" });
      } else {
        res.status(500).json({ error: "Signup failed" });
      }
    }
  });

  app.post("/api/login", (req, res) => {
    const { type, identifier, password } = req.body; // type: 'email' or 'phone'
    let user;
    if (type === 'email') {
      user = db.prepare("SELECT id, name, email, phone, role, avatar FROM users WHERE email = ? AND password = ?").get(identifier, password);
    } else {
      user = db.prepare("SELECT id, name, email, phone, role, avatar FROM users WHERE phone = ? AND password = ?").get(identifier, password);
    }

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { name, password } = req.body;
    const userId = parseInt(req.params.id);
    console.log(`Updating user ${userId}`);
    try {
      let result;
      if (password) {
        result = db.prepare("UPDATE users SET name = ?, password = ? WHERE id = ?").run(name, password, userId);
      } else {
        result = db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
      }
      console.log(`Update result for user ${userId}: ${result.changes} rows affected`);
      
      const user = db.prepare("SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?").get(userId);
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(404).json({ error: "User not found after update" });
      }
    } catch (e) {
      console.error("User update error:", e);
      res.status(500).json({ error: "Update failed" });
    }
  });

  // --- API Routes ---

  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT name FROM categories").all() as { name: string }[];
    res.json(categories.map(c => c.name));
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.delete("/api/categories/:name", (req, res) => {
    db.prepare("DELETE FROM categories WHERE name = ?").run(req.params.name);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, originalPrice, category, image, description, rating } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, price, originalPrice, category, image, description, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, price, originalPrice, category, image, description, rating || 5.0);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, price, originalPrice, category, image, description } = req.body;
    db.prepare(`
      UPDATE products SET name = ?, price = ?, originalPrice = ?, category = ?, image = ?, description = ?
      WHERE id = ?
    `).run(name, price, originalPrice, category, image, description, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.get("/api/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY date DESC").all();
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { id, customerName, phone, address, product, total, paymentMethod, trxID, date } = req.body;
    db.prepare(`
      INSERT INTO orders (id, customerName, phone, address, product, total, paymentMethod, trxID, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, customerName, phone, address, product, total, paymentMethod, trxID, date);
    res.json({ success: true });
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings (Font, Content)
  app.get("/api/settings/:key", (req, res) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(req.params.key) as { value: string } | undefined;
    res.json(row ? JSON.parse(row.value) : null);
  });

  app.post("/api/settings/:key", (req, res) => {
    const value = JSON.stringify(req.body);
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(req.params.key, value);
    res.json({ success: true });
  });

  // Steadfast API Integration
  app.post("/api/delivery-charge", async (req, res) => {
    const { district } = req.body;
    
    // Using the keys provided by the user
    const apiKey = process.env.STEADFAST_API_KEY || "0ef6luawkncuoxukoy8u4xhihhpuu1zo";
    const secretKey = process.env.STEADFAST_SECRET_KEY || "xbxl2rla2jypis3dy27ibcf4";

    try {
      // Real Steadfast API call
      // Documentation: https://portal.steadfast.com.bd/api-documentation
      const response = await axios.post("https://portal.steadfast.com.bd/api/v1/get_delivery_charge", {
        district: district
      }, {
        headers: {
          "Api-Key": apiKey,
          "Secret-Key": secretKey,
          "Content-Type": "application/json"
        }
      });

      if (response.data && response.data.status === 200) {
        res.json({ 
          status: 200, 
          delivery_charge: response.data.delivery_charge 
        });
      } else {
        // Fallback to manual logic if API fails or returns error
        let charge = 60;
        const d = district.toLowerCase();
        if (d === "chittagong" || d === "chattogram") {
          charge = 120;
        } else if (d !== "dhaka") {
          charge = 150;
        }
        res.json({ status: 200, delivery_charge: charge, note: "Fallback used" });
      }

    } catch (error) {
      console.error("Steadfast API Error:", error);
      // Fallback logic on network error
      let charge = 60;
      const d = district.toLowerCase();
      if (d === "chittagong" || d === "chattogram") {
        charge = 120;
      } else if (d !== "dhaka") {
        charge = 150;
      }
      res.json({ status: 200, delivery_charge: charge, note: "Error fallback used" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("rainwatch.db");

const JWT_SECRET = process.env.JWT_SECRET || "rainwatch-secret-key-123";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string };
    }
  }
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    language TEXT DEFAULT 'English',
    phone TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    address TEXT,
    lat REAL,
    lng REAL,
    type TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS weather_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    severity TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL,
    lng REAL,
    zone_name TEXT,
    type TEXT,
    priority TEXT,
    reason TEXT
  );
`);

// Migrations for existing database
const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('email')) {
  try { db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run(); } catch (e) {}
}
if (!columnNames.includes('is_verified')) {
  try { db.prepare("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0").run(); } catch (e) {}
}
if (!columnNames.includes('verification_code')) {
  try { db.prepare("ALTER TABLE users ADD COLUMN verification_code TEXT").run(); } catch (e) {}
}

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(cookieParser());

    // Auth Middleware
    const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
      const token = req.cookies.token;
      if (!token) return next();

      try {
        const user = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
        req.user = user;
        next();
      } catch (err) {
        res.clearCookie("token");
        next();
      }
    };

    const requireAuth = (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      next();
    };

    app.use(authenticateToken);

    // Auth Routes
    app.post("/api/auth/signup", async (req, res) => {
      try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: "Username, email and password required" });

        const password_hash = await bcrypt.hash(password, 10);
        const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const info = db.prepare("INSERT INTO users (username, email, password_hash, verification_code) VALUES (?, ?, ?, ?)").run(username, email, password_hash, verification_code);
        
        console.log(`[VERIFICATION] Code for ${email}: ${verification_code}`);

        const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
        
        res.json({ 
          id: info.lastInsertRowid, 
          username, 
          email, 
          needsVerification: true,
          demoCode: verification_code // Included for demo purposes since no email service is configured
        });
      } catch (err: any) {
        if (err.code === "SQLITE_CONSTRAINT") return res.status(400).json({ error: "Username or email already exists" });
        console.error("Signup error:", err);
        res.status(500).json({ error: "Signup failed" });
      }
    });

    app.post("/api/auth/resend-code", requireAuth, async (req, res) => {
      try {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;
        if (!user) return res.status(404).json({ error: "User not found" });
        
        const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
        db.prepare("UPDATE users SET verification_code = ? WHERE id = ?").run(verification_code, user.id);
        
        console.log(`[VERIFICATION] New code for ${user.email}: ${verification_code}`);
        
        res.json({ 
          message: "Code resent", 
          demoCode: verification_code // For demo purposes
        });
      } catch (err) {
        console.error("Resend code error:", err);
        res.status(500).json({ error: "Failed to resend code" });
      }
    });

    app.post("/api/auth/verify", requireAuth, (req, res) => {
      try {
        const { code } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as any;
        
        if (user.verification_code === code) {
          db.prepare("UPDATE users SET is_verified = 1 WHERE id = ?").run(req.user!.id);
          res.json({ success: true });
        } else {
          res.status(400).json({ error: "Invalid verification code" });
        }
      } catch (err) {
        res.status(500).json({ error: "Verification failed" });
      }
    });

    app.post("/api/auth/login", async (req, res) => {
      try {
        const { username, password } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username) as any;
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Record login history
        db.prepare("INSERT INTO login_history (user_id) VALUES (?)").run(user.id);
        broadcast({ type: "NEW_LOGIN", data: { user_id: user.id, timestamp: new Date().toISOString() } });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
        
        res.json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          language: user.language, 
          phone: user.phone,
          isVerified: !!user.is_verified 
        });
      } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
      }
    });

    app.post("/api/auth/logout", (req, res) => {
      res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ success: true });
    });

    app.get("/api/auth/me", (req, res) => {
      if (!req.user) return res.json(null);
      const user = db.prepare("SELECT id, username, email, language, phone, is_verified FROM users WHERE id = ?").get(req.user.id) as any;
      if (!user) return res.json(null);
      res.json({
        ...user,
        isVerified: !!user.is_verified
      });
    });

    app.post("/api/auth/reset-password", requireAuth, async (req, res) => {
      try {
        const { newPassword } = req.body;
        const password_hash = await bcrypt.hash(newPassword, 10);
        db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(password_hash, req.user!.id);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Reset failed" });
      }
    });

    app.post("/api/user/settings", requireAuth, (req, res) => {
      try {
        const { language, phone } = req.body;
        db.prepare("UPDATE users SET language = ?, phone = ? WHERE id = ?").run(language, phone, req.user!.id);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Update failed" });
      }
    });

    app.get("/api/user/history", requireAuth, (req, res) => {
      try {
        const reports = db.prepare("SELECT * FROM complaints WHERE user_id = ? ORDER BY timestamp DESC").all(req.user!.id);
        const logins = db.prepare("SELECT timestamp FROM login_history WHERE user_id = ? ORDER BY timestamp DESC").all(req.user!.id);
        res.json({ reports, logins });
      } catch (err) {
        res.status(500).json({ error: "Fetch history failed" });
      }
    });

    // API Routes
    app.get("/api/complaints", (req, res) => {
      try {
        const complaints = db.prepare("SELECT * FROM complaints ORDER BY timestamp DESC").all();
        res.json(complaints);
      } catch (err) {
        console.error("Database error (complaints):", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    app.post("/api/complaints", (req, res) => {
      try {
        const { address, lat, lng, type, description } = req.body;
        const userId = req.user?.id || null;
        const info = db.prepare(
          "INSERT INTO complaints (user_id, address, lat, lng, type, description) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(userId, address, lat, lng, type, description);
        
        const newComplaint = { id: info.lastInsertRowid, user_id: userId, address, lat, lng, type, description, timestamp: new Date().toISOString() };
        broadcast({ type: "NEW_COMPLAINT", data: newComplaint });
        
        // Trigger "Micro-Terrain" analysis simulation
        runAnalysis();
        
        res.json(newComplaint);
      } catch (err) {
        console.error("Database error (post complaint):", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    app.get("/api/recommendations", (req, res) => {
      try {
        const recs = db.prepare("SELECT * FROM recommendations").all();
        res.json(recs);
      } catch (err) {
        console.error("Database error (recommendations):", err);
        res.status(500).json({ error: "Database error" });
      }
    });

    app.get("/api/weather", async (req, res) => {
      try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=39.0458&longitude=-77.1975&current_weather=true&hourly=precipitation");
        if (!response.ok) throw new Error(`Weather API responded with ${response.status}`);
        const data = await response.json();
        res.json(data);
      } catch (error) {
        console.error("Weather fetch error:", error);
        res.status(500).json({ error: "Failed to fetch weather" });
      }
    });

    // Simulation of Micro-Terrain Analysis
    function runAnalysis() {
      try {
        const complaints = db.prepare("SELECT * FROM complaints").all();
        if (complaints.length === 0) return;

        const latest = complaints[complaints.length - 1];
        const existing = db.prepare("SELECT * FROM recommendations WHERE ABS(lat - ?) < 0.001 AND ABS(lng - ?) < 0.001").get(latest.lat, latest.lng);
        
        if (!existing) {
          const rec = {
            lat: latest.lat + (Math.random() - 0.5) * 0.0005,
            lng: latest.lng + (Math.random() - 0.5) * 0.0005,
            zone_name: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            type: Math.random() > 0.5 ? "3 x 200 gal Barrels" : "Rain Garden",
            priority: "High",
            reason: "Micro-terrain analysis indicates high runoff accumulation based on slope and recent citizen reports."
          };
          
          const info = db.prepare(
            "INSERT INTO recommendations (lat, lng, zone_name, type, priority, reason) VALUES (?, ?, ?, ?, ?, ?)"
          ).run(rec.lat, rec.lng, rec.zone_name, rec.type, rec.priority, rec.reason);
          
          broadcast({ type: "NEW_RECOMMENDATION", data: { ...rec, id: info.lastInsertRowid } });
        }
      } catch (err) {
        console.error("Analysis error:", err);
      }
    }

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Starting Vite in middleware mode...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("Serving static files from dist...");
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    }

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

    // WebSocket Setup
    const wss = new WebSocketServer({ server });
    const clients = new Set<WebSocket>();

    wss.on("connection", (ws) => {
      clients.add(ws);
      ws.on("close", () => clients.delete(ws));
    });

    function broadcast(message: any) {
      const payload = JSON.stringify(message);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

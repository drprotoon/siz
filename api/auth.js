// API handler for authentication routes on Vercel
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import cors from 'cors';
import MemoryStore from 'memorystore';
import { storage } from '../server/storage.js';

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Session setup
const MemoryStoreSession = MemoryStore(session);

// Configuração de sessão
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "beauty-essence-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Only use secure cookies in production with HTTPS, unless explicitly disabled
    secure: process.env.NODE_ENV === "production" && process.env.DISABLE_SECURE_COOKIE !== "true",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
  },
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
};

// Log da configuração de sessão
console.log(`Session configuration: secure=${sessionConfig.cookie.secure}, sameSite=${sessionConfig.cookie.sameSite}`);

app.use(session(sessionConfig));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    console.log(`Attempting to authenticate user: ${username}`);
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log(`User not found: ${username}`);
      return done(null, false, { message: "Incorrect username or password" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${username}`);
      return done(null, false, { message: "Incorrect username or password" });
    }

    console.log(`User authenticated successfully: ${username}`);
    return done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error(`Authentication error for ${username}:`, error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  console.log(`Serializing user: ${user.username}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log(`Deserializing user ID: ${id}`);
    const user = await storage.getUser(id);
    
    if (!user) {
      console.log(`User not found for ID: ${id}`);
      return done(null, false);
    }
    
    console.log(`User deserialized successfully: ${user.username}`);
    done(null, { id: user.id, username: user.username, role: user.role });
  } catch (error) {
    console.error(`Deserialization error for ID ${id}:`, error);
    done(error);
  }
});

// Login route
app.post("/login", (req, res, next) => {
  console.log("Login attempt:", req.body.username);
  
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }
    if (!user) {
      console.log("Login failed for user:", req.body.username);
      return res.status(401).json({ message: info.message });
    }

    // Salvar o sessionId atual antes do login
    const sessionId = req.session.id;
    console.log("Session ID before login:", sessionId);

    req.logIn(user, async (err) => {
      if (err) {
        console.error("Login session error:", err);
        return next(err);
      }

      try {
        console.log("User authenticated successfully:", user.username);
        
        // Incluir informações adicionais do usuário na resposta
        const userResponse = { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          // Adicionar timestamp para evitar problemas de cache
          timestamp: new Date().getTime()
        };
        
        console.log("Sending login response:", { message: "Login successful", user: userResponse });
        return res.json({ message: "Login successful", user: userResponse });
      } catch (error) {
        console.error("Error during login:", error);
        return res.json({ 
          message: "Login successful", 
          user: { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            timestamp: new Date().getTime()
          } 
        });
      }
    });
  })(req, res, next);
});

// Logout route
app.post("/logout", (req, res) => {
  console.log("Logout request received");
  req.logout(() => {
    console.log("User logged out successfully");
    res.json({ message: "Logout successful" });
  });
});

// Get current user route
app.get("/me", (req, res) => {
  console.log("Auth check request received");
  console.log("Is authenticated:", req.isAuthenticated());
  
  if (req.isAuthenticated() && req.user) {
    // Adicionar timestamp para evitar problemas de cache
    const userResponse = {
      ...req.user,
      timestamp: new Date().getTime()
    };
    
    console.log("Sending authenticated user:", userResponse);
    res.json({ user: userResponse });
  } else {
    console.log("User not authenticated");
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Register route
app.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    console.log("Register attempt:", userData.username);

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      console.log("Username already exists:", userData.username);
      return res.status(400).json({ message: "Username already exists" });
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      console.log("Email already exists:", userData.email);
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with hashed password
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: "customer" // Always register as customer
    });

    console.log("User registered successfully:", newUser.username);

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Export the Express API
export default app;

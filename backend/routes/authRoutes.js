// authRoutes.js
import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt";
import env from "dotenv";

env.config();
const router = express.Router();

// Enable express.json() middleware for parsing JSON request bodies
// This is crucial for req.body to work. It's also in server.js, but good to ensure here.
router.use(express.json());

// POST /auth/signup - Register a new user
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  console.log(req.body);

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password and name are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM parents WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists. Please choose a different one." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user into the database
    const newUserResult = await pool.query(
      "INSERT INTO parents (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hashedPassword, name]
    );

    const newUser = newUserResult.rows[0];

    // IMPORTANT FIX: Regenerate session FIRST, then set user data on the NEW session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error after signup:", err);
        return res.status(500).json({ error: "Session creation failed after signup." });
      }
      
      // Now set the user data on the newly regenerated session
      req.session.userId = newUser.id;
      req.session.email = newUser.email;
      req.session.name = newUser.name;


      // Save the session to ensure data is persisted before sending response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Error saving session after signup regeneration:", saveErr);
          return res.status(500).json({ error: "Failed to save session after signup." });
        }
        res.status(201).json({ message: "Signup successful", user: { id: newUser.id, username: newUser.username } });
      });
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup." });
  }
});


// POST /auth/login - User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for parent:", email);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM parents WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password); // Assuming your password column is `password`
    
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // IMPORTANT FIX: Regenerate session FIRST, then set user data on the NEW session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Session creation failed." });
      }
      
      // Now set the user data on the newly regenerated session
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.name = user.name;

      console.log("User logged in successfully (after regeneration):", req.session);

      // Save the session to ensure data is persisted before sending response
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Error saving session after login regeneration:", saveErr);
          return res.status(500).json({ error: "Failed to save session after login." });
        }
        res.json({ message: "Login successful", user: { id: user.id, email: user.email } });
      });
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// POST /auth/logout - User logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout failed:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    // Clear the session cookie from the client
    res.clearCookie('sessionId'); // 'sessionId' is the name you set in server.js
    res.json({ message: "Logout successful" });
  });
});

// GET /auth/check-auth - Check authentication status
router.get("/check-auth", (req, res) => {
  // `req.session.userId` is set during login
  if (req.session.userId) {
    res.json({ isAuthenticated: true, user: { id: req.session.userId, email: req.session.email, name: req.session.name } });
  } else {
    res.json({ isAuthenticated: false });
  }
});

export default router;

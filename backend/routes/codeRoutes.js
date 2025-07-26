import express from "express";
import env from "dotenv";
import pool from "../db.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

env.config();
const router = express.Router();

const codeGenerationAttempts = new Map(); // Stores { userId: { count: number, lastReset: Date } }
const MAX_ATTEMPTS_PER_MINUTE = 5;
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute

const rateLimitCodeGeneration = (req, res, next) => {
    const userId = req.session.userId; // Assuming userId is available on session
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User ID not found in session." });
    }
  
    const now = Date.now();
    let userAttempts = codeGenerationAttempts.get(userId);
  
    if (!userAttempts || (now - userAttempts.lastReset > WINDOW_SIZE_MS)) {
      // Reset count if window has passed or no attempts yet
      userAttempts = { count: 0, lastReset: now };
      codeGenerationAttempts.set(userId, userAttempts);
    }
  
    if (userAttempts.count >= MAX_ATTEMPTS_PER_MINUTE) {
      return res.status(429).json({ error: "Too many code generation requests. Please try again in a minute." });
    }
  
    userAttempts.count++;
    next();
  };

const generateUniqueElevenDigitCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 11; i++) {
        code += Math.floor(Math.random() * 10);
      }
      // Check if the code already exists in the database
      const result = await pool.query('SELECT 1 FROM child_access_codes WHERE code = $1', [code]);
      if (result.rows.length === 0) {
        isUnique = true;
      }
    }
    return code;
  };

// NEW ENDPOINT: Generate and store child access code
router.post('/generate-child-code', isAuthenticated, rateLimitCodeGeneration, async (req, res) => {
    const { childName } = req.body;
    const parentId = req.session.userId; // Get parentId from session
  
    if (!childName || !parentId) {
      return res.status(400).json({ error: "Child name and parent ID are required." });
    }
  
    try {
      // 1. Check for an existing, unexpired code for this parent
      const existingCodeResult = await pool.query(
        'SELECT code, expires_at FROM child_access_codes WHERE parent_id = $1 AND expires_at > NOW() AND verified = FALSE',
        [parentId]
      );
  
      if (existingCodeResult.rows.length > 0) {
        // If an active code exists, update its child_name and return it
        const existingCode = existingCodeResult.rows[0];
        await pool.query(
          'UPDATE child_access_codes SET child_name = $1 WHERE parent_id = $2 AND code = $3',
          [childName, parentId, existingCode.code]
        );
        return res.status(200).json({ // Return 200 OK for update/reuse
          message: "Existing code retrieved and child name updated.",
          code: existingCode.code,
          expiresAt: existingCode.expires_at.toISOString()
        });
      }
  
      // 2. If no active code exists, generate a new one
      const code = await generateUniqueElevenDigitCode();
      const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes from now
  
      await pool.query(
        'INSERT INTO child_access_codes (code, parent_id, child_name, expires_at, verified) VALUES ($1, $2, $3, $4, FALSE)',
        [code, parentId, childName, expiresAt]
      );
  
      res.status(201).json({ // Return 201 Created for new code
        message: "New code generated successfully",
        code: code,
        expiresAt: expiresAt.toISOString() // Send expiry as ISO string
      });
  
    } catch (error) {
      console.error("Error generating or storing child code:", error);
      res.status(500).json({ error: "Failed to generate child code." });
    }
  });

router.post('/verify-child-code', async (req, res) => {
    const { code } = req.body;
  
    if (!code) {
      return res.status(400).json({ error: "Code is required." });
    }
  
    try {
      // Find the code in the database that is not expired and not yet verified
      const accessCodeResult = await pool.query(
        'SELECT parent_id, child_name FROM child_access_codes WHERE code = $1 AND expires_at > NOW() AND verified = FALSE',
        [code]
      );
  
      if (accessCodeResult.rows.length === 0) {
        return res.status(404).json({ error: "Invalid, expired, or already used code." });
      }
  
      const { parent_id, child_name } = accessCodeResult.rows[0];
  
      // Mark the access code as verified so it cannot be used again
      await pool.query(
        'UPDATE child_access_codes SET verified = TRUE WHERE code = $1',
        [code]
      );
  
      // Insert a new entry into the children table
      const insertChildResult = await pool.query(
          'INSERT INTO children (parent_id, name, last_latitude, last_longitude, current_zone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [parent_id, child_name, 0.0, 0.0, 'Unknown'] // Dummy initial location data
      );
      const childId = insertChildResult.rows[0].id; // Get the newly generated child ID
  
      res.status(200).json({
        message: "Code verified successfully and child registered.",
        parentId: parent_id,
        childName: child_name,
        childId: childId // Include the new child's ID for the frontend
      });
  
    } catch (error) {
      console.error("Error verifying child code or registering child:", error);
      res.status(500).json({ error: "Failed to verify code and register child." });
    }
  });

export default router;
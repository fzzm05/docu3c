// authMiddleware.js
import env from "dotenv";
import pool from '../db.js'

env.config();

// Middleware to check if the user is logged in
export async function isAuthenticated(req, res, next) {
    // Original: if (!req.session || !req.session.user) {
    // Fix: Check for req.session.userId, as that's what's set during login/signup
    if (!req.session || !req.session.userId) { // <-- Changed from !req.session.user
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
        // Check if session exists in session table
        // This check is often redundant if express-session is configured correctly
        // and successfully re-hydrates req.session from the store.
        // However, keeping it for explicit verification is fine.
        const sessionQuery = `
            SELECT * FROM session 
            WHERE sid = $1
        `;
        const result = await pool.query(sessionQuery, [req.sessionID]);

        if (result.rows.length === 0) {
            // If the session ID sent by the browser doesn't exist in the DB, it's expired or invalid.
            return res.status(401).json({ error: "Session expired. Please log in again." });
        }

        // If req.session.userId exists and the session is found in the DB, proceed.
        return next();
    } catch (error) {
        console.error("Error checking session:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

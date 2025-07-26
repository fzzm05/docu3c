import express from "express";
import env from "dotenv";
import pool from "../db.js"; // Assuming db.js exports your PostgreSQL connection pool

env.config(); // Load environment variables from .env file
const router = express.Router();

// Endpoint to fetch data for the parent dashboard
router.get('/parent-dashboard', async (req, res) => {
    const { parentId } = req.query; // Or req.user.id if using authentication middleware

    // Basic validation for parentId
    if (!parentId) {
        return res.status(400).json({ error: "Parent ID is required to fetch dashboard data." });
    }

    try {
        const result = await pool.query(
            `SELECT
                id AS id,
                name AS name,
                last_latitude AS latitude,
                last_longitude AS longitude,
                current_zone AS location,
                last_seen AS lastUpdated,
                status AS status
            FROM
                children
            WHERE
                parent_id = $1
            ORDER BY
                name;`, // Order by child name for consistent display
            [parentId]
        );

        // If no children are found for this parent, return an empty array or a specific message.
        if (result.rows.length === 0) {
            return res.status(200).json({
                message: "No children found for this parent, or no location data available.",
                childrenData: []
            });
        }

        // Return the fetched children data
        res.status(200).json({
            message: "Parent dashboard data fetched successfully.",
            childrenData: result.rows
        });

    } catch (error) {
        console.error("Error fetching parent dashboard data:", error);
        res.status(500).json({ error: "Failed to fetch parent dashboard data." });
    }
});

export default router;

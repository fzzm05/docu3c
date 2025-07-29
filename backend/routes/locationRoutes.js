// locationRoutes.js

import express from "express";
import env from "dotenv";
import pool from "../db.js";
import { isAuthenticated } from "../middleware/authMiddleware.js"; // axios is no longer needed here

env.config();

export default (io) => { // `io` parameter is still kept in case other routes need it
  const router = express.Router();

  // The HTTP POST endpoint for location update is REMOVED
  // It's now handled via Socket.IO directly in server.js

  // Keep the existing GET endpoint for initial data fetch or fallback
  router.get('/child/location', isAuthenticated, async (req, res) => {
    const childId = req.query.childId;
    const parentId = req.session.userId;

    if (!childId) {
      return res.status(400).json({ error: 'childId is required.' });
    }

    try {
      const result = await pool.query(
        `SELECT
          id,
          name,
          current_zone,
          last_latitude,
          last_longitude,
          last_seen,
          status,
          accuracy
        FROM children
        WHERE id = $1 AND parent_id = $2`,
        [childId, parentId]
      );

      const child = result.rows[0];
      if (!child) {
        return res.status(404).json({ error: 'Child not found or unauthorized access.' });
      }

      const locationData = {
        id: child.id.toString(),
        name: child.name,
        status: child.status || 'unknown',
        location: child.current_zone || 'Unknown Location',
        lastUpdated: child.last_seen,
        coordinates: {
          lat: child.last_latitude || 0,
          lng: child.last_longitude || 0,
        },
        accuracy: child.accuracy || 9999,
      };

      console.log('Fetched child live location (GET):', locationData);
      res.status(200).json({
        message: 'Live location data fetched successfully.',
        locationData,
      });

    } catch (error) {
      console.error('Error fetching child live location from PostgreSQL (GET):', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
};
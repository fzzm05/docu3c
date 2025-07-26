import express from 'express';
import dotenv from 'dotenv';
import pool from '../db.js';
import analyzeChildSafety from '../utils/analyzeChildSafety.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const router = express.Router();

// GET /alerts/child - Fetch child status and alerts
router.get('/child', async (req, res) => {
  const { childId, parentId, lat, lon } = req.query;

  // Validate inputs
  if (!childId || !parentId) {
    return res.status(400).json({ error: 'Child ID and Parent ID are required.' });
  }

  // Validate UUID format for childId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(childId)) {
    return res.status(400).json({ error: 'Invalid child ID format. Must be a UUID.' });
  }

  let latitude = lat ? parseFloat(lat) : null;
  let longitude = lon ? parseFloat(lon) : null;
  if ((lat && isNaN(latitude)) || (lon && isNaN(longitude))) {
    return res.status(400).json({ error: 'Invalid latitude or longitude.' });
  }

  try {
    // Fetch child data
    const childResult = await pool.query(
      `SELECT
        id,
        name,
        status,
        last_latitude AS latitude,
        last_longitude AS longitude
      FROM
        children
      WHERE
        id = $1 AND parent_id = $2`,
      [childId, parentId]
    );

    if (childResult.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found or not authorized.' });
    }

    const child = childResult.rows[0];
    let currentStatus = child.status;
    let updatedLatitude = latitude || child.latitude;
    let updatedLongitude = longitude || child.longitude;

    // Geofencing logic
    let newAlerts = [];
    if (childId === '550e8400-e29b-41d4-a716-446655440000' && latitude > 23.07 && latitude < 23.08 && longitude > 76.85 && longitude < 76.86) {
      currentStatus = 'at_school';
      newAlerts.push({
        id: uuidv4(),
        type: 'location',
        message: 'Arrived at school premises (Live Detected)',
        timestamp: new Date().toISOString(),
        priority: 'low',
        actions: [],
      });
    } else if (childId === '6ba7b810-9dad-11d1-80b4-00c04fd430c8' && latitude > 23.1 && latitude < 23.2 && longitude > 76.9 && longitude < 77.0) {
      currentStatus = 'in_unfamiliar_area_high_risk';
      newAlerts.push({
        id: uuidv4(),
        type: 'safety',
        message: `Entered HIGH-RISK ZONE near (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) (Live Detected)!`,
        timestamp: new Date().toISOString(),
        priority: 'high',
        actions: ['Call Child', 'Send Safety Prompt', 'Contact Authorities'],
      });
    }

    // Call Gemini API for safety analysis
    let geminiAlert = null;
    if (latitude && longitude) {
      const geminiResponse = JSON.parse(await analyzeChildSafety(latitude, longitude));
      if (!geminiResponse.error) {
        geminiAlert = {
          id: uuidv4(),
          type: 'safety',
          message: geminiResponse.data.description,
          timestamp: geminiResponse.timestamp,
          priority: geminiResponse.data.priority,
          actions: geminiResponse.data.actions,
        };
        newAlerts.push(geminiAlert);
      } else {
        console.warn('Gemini analysis failed:', geminiResponse.message);
      }
    }

    // Update child status and coordinates
    await pool.query(
      `UPDATE children
      SET
        status = $1,
        last_latitude = $2,
        last_longitude = $3,
        last_seen = CURRENT_TIMESTAMP
      WHERE
        id = $4`,
      [currentStatus, updatedLatitude, updatedLongitude, childId]
    );

    // Insert new alerts
    for (const alert of newAlerts) {
      await pool.query(
        `INSERT INTO alerts (id, child_id, type, message, timestamp, priority, actions)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          alert.id,
          childId,
          alert.type,
          alert.message,
          alert.timestamp,
          alert.priority,
          JSON.stringify(alert.actions),
        ]
      );
    }

    // Fetch existing alerts
    const alertsResult = await pool.query(
      `SELECT
        id,
        type,
        message,
        timestamp,
        priority,
        actions
      FROM
        alerts
      WHERE
        child_id = $1
      ORDER BY
        timestamp DESC`,
      [childId]
    );

    const alerts = alertsResult.rows.map((alert) => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      priority: alert.priority,
      actions: alert.actions || [],
    }));

    // Respond
    res.status(200).json({
      message: 'Child status and alerts fetched successfully.',
      alertData: {
        currentStatus,
        latitude: updatedLatitude,
        longitude: updatedLongitude,
        alerts,
      },
    });
  } catch (error) {
    console.error('Error fetching child status and alerts:', error);
    res.status(500).json({ error: 'Failed to fetch child status and alerts.' });
  }
});

export default router;
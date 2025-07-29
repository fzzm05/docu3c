import express from "express";
import env from "dotenv";
import pool from "../db.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

env.config();

export default (io) => {
    const router = express.Router();

    router.get('/settings', isAuthenticated, async (req, res) => {
        try {
          const { userId } = req.session;
          const result = await pool.query(
            'SELECT risk_sensitivity, alert_frequency FROM parents_config_settings WHERE parent_id = $1',
            [userId]
          );
      
          if (result.rows.length === 0) {
            return res.status(200).json({
              risk_sensitivity: 2,  // default values
              alert_frequency: 45
            });
          }
      
          res.json(result.rows[0]);
        } catch (error) {
          console.error('Error fetching settings:', error);
          res.status(500).json({ error: 'Internal server error.' });
        }
      });
      

    router.post('/settings', isAuthenticated, async (req, res) => {
        try {
          const { userId } = req.session;
          const { risk_sensitivity, alert_frequency } = req.body;
      
          if (
            typeof risk_sensitivity !== 'number' ||
            typeof alert_frequency !== 'number'
          ) {
            return res.status(400).json({ error: 'Invalid input data.' });
          }
      
          await pool.query(
            `INSERT INTO parents_config_settings (parent_id, risk_sensitivity, alert_frequency)
             VALUES ($1, $2, $3)
             ON CONFLICT (parent_id) DO UPDATE SET
             risk_sensitivity = EXCLUDED.risk_sensitivity,
             alert_frequency = EXCLUDED.alert_frequency`,
            [userId, risk_sensitivity, alert_frequency]
          );
          console.log('Settings updated successfully for user:', userId);
          res.json({ message: 'Settings updated successfully.' });
        } catch (error) {
          console.error('Error updating settings:', error);
          res.status(500).json({ error: 'Internal server error.' });
        }
      });
    return router;
};
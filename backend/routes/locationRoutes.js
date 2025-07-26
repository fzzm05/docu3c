import express from "express";
import env from "dotenv";
import pool from "../db.js";
import axios from "axios";
import { isAuthenticated } from "../middleware/authMiddleware.js";

env.config();
const router = express.Router();

// NEW ENDPOINT: Child device sends location updates
router.post('/child/location-update', async (req, res) => {
    let { childId, latitude, longitude } = req.body; // Removed currentZone from destructuring as it's fetched here
    let currentZone = 'Unknown Zone'; // Default value
    let nearbyPlace = "City Mall"; // Default value for nearby place

    // Now validate with the obtained currentZone
    if (!childId || typeof latitude === 'undefined' || typeof longitude === 'undefined' || !currentZone) {
      return res.status(400).json({ error: "childId, latitude, longitude, and currentZone are required." });
    }

    // --- Fetch region from LocationIQ API ---
    try {
        const locationIqUrl = `https://us1.locationiq.com/v1/reverse.php?key=${process.env.LOCATION_IQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`;
        
        const response = await axios.get(locationIqUrl);
        const locationData = response.data;

        // LocationIQ response structure often includes a 'address' object
        // and 'display_name'. You'll need to decide what constitutes your "region".
        // Common choices for 'region' might be:
        // 1. The 'city' or 'town' from the address object.
        // 2. The 'state' or 'county' if city is too specific.
        // 3. A combination or a higher-level administrative area.
        // 4. The full 'display_name' if you want a complete address string.

        // Example: Trying to get a specific administrative area
        if (locationData && locationData.address) {
            console.log(locationData);
            currentZone = 
                            locationData.address.hostel ||
                            locationData.address.town || 
                          locationData.address.city || 
                          locationData.address.county || 
                          locationData.address.state || 
                          locationData.address.country ||
                          locationData.display_name || // Fallback to full display name
                          'Unknown Zone'; // Final fallback
                        nearbyPlace = locationData.address.city || locationData.address.town || locationData.address.road || 'City Mall'; // Default to 'City Mall' if no city found
        } else if (locationData && locationData.display_name) {
            currentZone = locationData.display_name;
        }

      } catch (locationIqError) {
        console.error("Error fetching location from LocationIQ:", locationIqError.message);
        // It's good practice to still proceed with 'Unknown Zone' or
        // handle this error gracefully without blocking the location update.
        // For example, you might log the error but still update lat/lon.
        currentZone = 'Unknown Zone (API Error)'; // Indicate that API call failed
      }
  
    try {
      // Basic validation: Check if the childId exists in the children table
      const childExists = await pool.query('SELECT 1 FROM children WHERE id = $1', [childId]);
      if (childExists.rows.length === 0) {
        return res.status(404).json({ error: "Child not found." });
      }
      
      try {

      } catch (err){

      }
  
      // Update the child's location and zone in the children table
      await pool.query(
        'UPDATE children SET last_latitude = $1, last_longitude = $2, current_zone = $3, last_seen = NOW() WHERE id = $4',
        [latitude, longitude, currentZone, childId]
      );
  
      // Return the current_zone in the 200 OK response
      res.status(200).json({ message: "Location updated successfully.", currentZone: currentZone, nearbyPlace: nearbyPlace });
  
    } catch (error) {
      console.error("Error updating child location:", error);
      res.status(500).json({ error: "Failed to update child location." });
    }
});

router.get('/child/location', isAuthenticated, async (req, res) => {
    const childId = req.query.childId; // Assuming childId is passed as a query
    const parentId = req.session.userId; // Assuming userId is set during login

    // Basic validation for childId
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
         last_seen
       FROM children
       WHERE id = $1 AND parent_id = $2`, // Filter by child ID AND parent ID for security
      [childId, parentId] // Use parameterized query to prevent SQL injection
    );

    const child = result.rows[0]; // Get the first matching row
    if (!child) {
      // If no child found (either ID doesn't exist or doesn't belong to this parent)
      return res.status(404).json({ error: 'Child not found or unauthorized access.' });
    }

    // Format the data to match the frontend's expected structure
    const locationData = {
      id: child.id.toString(),
      name: child.name,
      status: child.status || 'unknown', // Default to 'unknown' if status is null in DB
      location: child.currentZone || 'Unknown Location',
      lastUpdated: child.last_seen,
      coordinates: {
        lat: child.last_latitude || 0, // Default to 0 if latitude is null
        lng: child.last_longitude || 0, // Default to 0 if longitude is null
      },
    };

    console.log('Fetched child live location:', locationData);
    res.status(200).json({
      message: 'Live location data fetched successfully.',
      locationData,
    });

  } catch (error) {
    console.error('Error fetching child live location from PostgreSQL:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
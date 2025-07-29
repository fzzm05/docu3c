// mockChildLocationData.js

/**
 * Generates mock child location and sensor data.
 * This function is intended to simulate data that might be sent from a child's device.
 *
 * @param {object} [options={}] - Configuration options for the mock data.
 * @param {string} [options.childId='mockChild123'] - The ID of the child.
 * @param {string} [options.parentId='mockParent456'] - The ID of the parent.
 * @param {number} [options.baseLat=28.6139] - Base latitude for generating nearby coordinates. (e.g., New Delhi)
 * @param {number} [options.baseLon=77.2090] - Base longitude for generating nearby coordinates. (e.g., New Delhi)
 * @param {number} [options.latDelta=0.001] - Max random change in latitude.
 * @param {number} [options.lonDelta=0.001] - Max random change in longitude.
 * @param {number} [options.minAccuracy=5] - Minimum accuracy in meters.
 * @param {number} [options.maxAccuracy=50] - Maximum accuracy in meters.
 * @returns {object} An object containing mock child location and sensor data.
 */
export const generateMockChildData = (options = {}) => {
    const {
      childId = 'mockChild123',
      parentId = 'mockParent456',
      baseLat = 28.6139, // New Delhi
      baseLon = 77.2090, // New Delhi
      latDelta = 0.001, // Roughly ~111 meters difference
      lonDelta = 0.001, // Roughly ~85 meters difference at this latitude
      minAccuracy = 5,
      maxAccuracy = 50,
    } = options;
  
    // Simulate slight random movement
    const lat = parseFloat((baseLat + (Math.random() - 0.5) * latDelta).toFixed(6));
    const lon = parseFloat((baseLon + (Math.random() - 0.5) * lonDelta).toFixed(6));
  
    const accuracy = parseFloat((Math.random() * (maxAccuracy - minAccuracy) + minAccuracy).toFixed(1)); // 5-50 meters
  
    const mockPOIs = [
      { name: "Local Park", type: "Park" },
      { name: "Community Library", type: "Education" },
      { name: "SuperMart", type: "Shopping" },
      { name: "ABC School", type: "Education" },
      { name: "Bus Stop", type: "Transport" },
      { name: "Coffee Shop", type: "Food" },
      { name: "Hospital", type: "Healthcare" },
      { name: "Playground", type: "Park" },
    ];
  
    const randomPOI = mockPOIs[Math.floor(Math.random() * mockPOIs.length)];
  
    // Random values for other metrics
    const floor = Math.floor(Math.random() * 5); // 0-4 floors
    const crowd_density = parseFloat(Math.random().toFixed(2)); // 0.00 - 1.00
    const crime_score = parseFloat((Math.random() * 10).toFixed(1)); // 0.0 - 10.0
    const is_familiar = Math.random() > 0.5; // true or false
    const parent_sensitivity = parseFloat(Math.random().toFixed(2)); // 0.00 - 1.00
  
    return {
      childId,
      parentId,
      lat,
      lon,
      floor,
      accuracy,
      nearest_poi: randomPOI.name,
      poi_type: randomPOI.type,
      crowd_density,
      crime_score,
      is_familiar,
      parent_sensitivity,
      timestamp: new Date().toISOString(), // Add a timestamp for when this data was generated
    };
  };

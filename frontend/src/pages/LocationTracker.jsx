import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { Card } from "@/components/ui/card";     // Assuming shadcn/ui Card
import { Badge } from "@/components/ui/badge";   // Assuming shadcn/ui Badge
import { Wifi, Shield, Loader2 } from "lucide-react"; // Added Loader2 for loading state
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'; // Added for map integration
import { io } from "socket.io-client";
import { calculateDistance } from "@/utils/geoUtils"; // Assuming you have a utility function for distance calculation
import { generateMockChildData } from "../utils/generateMockChildData";

// Mock data generation function for additional location properties
const generateMockLocationData = (latitude, longitude) => {
  const poiTypes = ['school', 'park', 'mall', 'restaurant', 'hospital', 'library', 'playground', 'sports_center', 'market', 'bus_stop'];
  const poiNames = {
    school: ['Delhi Public School', 'St. Xavier\'s School', 'Ryan International', 'Modern School', 'Sardar Patel Vidyalaya'],
    park: ['Lodhi Gardens', 'India Gate Lawns', 'Nehru Park', 'Central Park', 'Rose Garden'],
    mall: ['Select City Walk', 'DLF Mall', 'Phoenix Mills', 'Ambience Mall', 'Pacific Mall'],
    restaurant: ['McDonald\'s', 'KFC', 'Pizza Hut', 'Domino\'s', 'Subway'],
    hospital: ['AIIMS', 'Max Hospital', 'Apollo Hospital', 'Fortis Hospital', 'BLK Hospital'],
    library: ['Central Library', 'British Council', 'American Center', 'Delhi Public Library', 'Goethe Institut'],
    playground: ['Children\'s Park', 'Adventure Park', 'Sports Ground', 'Community Park', 'Mini Stadium'],
    sports_center: ['Sports Complex', 'Swimming Pool', 'Gym Center', 'Cricket Ground', 'Tennis Court'],
    market: ['Connaught Place', 'Khan Market', 'Sarojini Nagar', 'Lajpat Nagar', 'Karol Bagh'],
    bus_stop: ['Main Bus Stop', 'Metro Station', 'Bus Terminal', 'Local Stop', 'Junction Stop']
  };

  const zones = ['Safe Zone', 'School Zone', 'Residential Area', 'Commercial Area', 'Park Zone', 'Transit Zone'];
  const places = ['Near Home', 'School Area', 'Shopping District', 'Park Vicinity', 'Metro Station Area', 'Main Road'];
  
  const selectedPoiType = poiTypes[Math.floor(Math.random() * poiTypes.length)];
  const selectedPoiName = poiNames[selectedPoiType][Math.floor(Math.random() * poiNames[selectedPoiType].length)];
  
  return {
    nearest_poi: selectedPoiName,
    poi_type: selectedPoiType,
    crowd_density: Math.floor(Math.random() * 100) + 1, // 1-100
    crime_score: parseFloat((Math.random() * 10).toFixed(1)), // 0.0-10.0
    is_familiar: Math.random() > 0.3, // 70% chance of being familiar
    parent_sensitivity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    currentZone: zones[Math.floor(Math.random() * zones.length)],
    nearbyPlace: places[Math.floor(Math.random() * places.length)]
  };
};

// Assuming VITE_API_URL is defined in your .env.local or .env file
const API_URL = import.meta.env.VITE_API_URL;
// Load Google Maps API Key from environment variables (for map display only)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Ensure this is set
// Corrected environment variable name for Socket.IO server URL
const SOCKET_IO_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

// Map container style
const containerStyle = {
  width: '100%',
  height: '400px', // Fixed height for the map
  borderRadius: '1rem', // Tailwind's rounded-2xl
};

// Define thresholds for sending location data
const DISTANCE_THRESHOLD_METERS = 5; // Send update if moved more than 5 meters
const GEOLOCATION_UPDATE_INTERVAL_MS = 3000; // Check geolocation every 3 seconds

const LocationTracker = () => {
  // State for the most recently obtained location from Geolocation API
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 28.6139, // Default to a known location (e.g., New Delhi)
    longitude: 77.2090,
    accuracy: 9999, // Default high accuracy to avoid false positives initially
    currentZone: "Fetching..", // Default zone, updated by backend response
    nearbyPlace: "Fetching..", // Default nearby place, updated by backend response
    nearest_poi: null, // Placeholder for nearest point of interest
    poi_type: null, // Placeholder for type of nearest point of interest
    crowd_density: null, // Placeholder for crowd density data
    crime_score: null, // Placeholder for crime score data
    is_familiar: false, // Placeholder for familiarity check
    parent_sensitivity: null, // Placeholder for parent sensitivity setting
  });
  
  // State to store the last location SUCCESSFULLY SENT to the backend and acknowledged
  const [lastSentLocation, setLastSentLocation] = useState(null);

  // State to indicate if location sharing is actively connected to the backend
  const [isSharingActive, setIsSharingActive] = useState(false);
  // State to indicate if a location update is currently being sent to the backend
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  // Timestamp of the last successful location update sent
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState('N/A');

  // --- New states for child registration code entry popup ---
  const [isRegistered, setIsRegistered] = useState(false); // True if child device is registered
  const [showCodeEntryPopup, setShowCodeEntryPopup] = useState(false); // Controls popup visibility
  const [childCodeInput, setChildCodeInput] = useState(""); // Input for the child code
  const [codeEntryError, setCodeEntryError] = useState(""); // Error message for code entry
  const [isVerifyingCode, setIsVerifyingCode] = useState(false); // Loading state for code verification

  const [accelerometerData, setAccelerometerData] = useState(null);
  const [barometerData, setBarometerData] = useState(null);

  useEffect(() => {
    let accelerometer, barometer;
  
    // Setup Accelerometer
    if ('Accelerometer' in window) {
      try {
        accelerometer = new Accelerometer({ frequency: 30 });
        accelerometer.addEventListener('reading', () => {
          setAccelerometerData({
            x: accelerometer.x?.toFixed(2),
            y: accelerometer.y?.toFixed(2),
            z: accelerometer.z?.toFixed(2),
          });
        });
        accelerometer.start();
      } catch (error) {
        console.error("Accelerometer error:", error);
      }
    } else {
      console.warn("Accelerometer not supported in this browser.");
    }
  
    // Setup Barometer
    if ('Barometer' in window) {
      try {
        barometer = new Barometer({ frequency: 1 });
        barometer.addEventListener('reading', () => {
          setBarometerData({
            pressure: barometer.pressure?.toFixed(2),
          });
        });
        barometer.start();
      } catch (error) {
        console.error("Barometer error:", error);
      }
    } else {
      console.warn("Barometer not supported in this browser.");
    }
  
    // Cleanup on unmount
    return () => {
      accelerometer?.stop?.();
      barometer?.stop?.();
    };
  }, []);
  

  // State to store registered child's data (childId, parentId, childName from localStorage)
  const [registeredChildData, setRegisteredChildData] = useState(null);

  // State to track if we have received the first valid location
  const [hasValidLocation, setHasValidLocation] = useState(false);
  // State to track if initial location has been sent (ONLY ONCE)
  const [initialLocationSent, setInitialLocationSent] = useState(false);

  // Ref for Socket.IO client instance to persist across renders
  const socketRef = useRef(null);
  // Ref for Geolocation watch ID to clear it on unmount
  const watchIdRef = useRef(null);

  // Load Google Maps JavaScript API for the map display
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-child', // Unique ID for this map instance
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Effect to check local storage for registration data on initial component mount
  useEffect(() => {
    const storedChildData = localStorage.getItem("registeredChildData");
    if (storedChildData) {
      try {
        const parsedData = JSON.parse(storedChildData);
        // Validate that all required fields are present
        if (parsedData.childId && parsedData.parentId && parsedData.childName) {
            setRegisteredChildData(parsedData);
            setIsRegistered(true);
            setShowCodeEntryPopup(false); // Hide popup if valid data found
        } else {
            console.warn("Incomplete registeredChildData in localStorage. Re-registering.");
            localStorage.removeItem("registeredChildData"); // Clear incomplete data
            setShowCodeEntryPopup(true); // Show popup for re-registration
        }
      } catch (e) {
        console.error("Error parsing registeredChildData from localStorage:", e);
        localStorage.removeItem("registeredChildData"); // Clear corrupted data
        setShowCodeEntryPopup(true); // Show popup if data is corrupted
      }
    } else {
      setShowCodeEntryPopup(true); // Show popup if no data found initially
    }
  }, []); // Runs only once on component mount

  // --- useCallback for sending location data to backend via Socket.IO ---
  const sendLocationToBackend = useCallback(async (locData, reason = "unknown") => {
    // Prevent sending if Socket.IO is not connected or child is not registered
    if (!socketRef.current || !socketRef.current.connected) {
        console.warn("Socket.IO not connected, cannot send location.");
        setIsSharingActive(false);
        setIsSendingLocation(false);
        return;
    }
    if (!registeredChildData?.childId) {
        console.warn("Child not registered, cannot send location.");
        setIsSharingActive(false);
        setIsSendingLocation(false);
        return;
    }

    setIsSendingLocation(true);
    console.log(`📍 SENDING LOCATION TO BACKEND (Reason: ${reason}):`, locData);

    // Generate mock data for additional fields
    const mockData = generateMockLocationData(locData.latitude, locData.longitude);

    const dataToSend = {
        childId: registeredChildData.childId,
        latitude: locData.latitude,
        longitude: locData.longitude,
        accuracy: locData.accuracy,
        // Add mock data fields
        nearest_poi: mockData.nearest_poi,
        poi_type: mockData.poi_type,
        crowd_density: mockData.crowd_density,
        crime_score: mockData.crime_score,
        is_familiar: mockData.is_familiar,
        parent_sensitivity: mockData.parent_sensitivity,
        // Include sensor data if available
        accelerometerData,
        barometerData,
        timestamp: new Date().toISOString()
    };

    try {
        // Emit 'locationUpdate' event to the server with an acknowledgment callback
        socketRef.current.emit('locationUpdate', dataToSend, (ack) => {
            if (ack && ack.status === 'success') {
                console.log("✅ Location update acknowledged by server:", ack);
                setIsSharingActive(true);
                setIsSendingLocation(false);
                setLastLocationUpdateTime(new Date().toLocaleTimeString());
                setLastSentLocation(locData); // Update last successfully sent location
                
                // Mark initial location as sent if this was the initial send
                if (reason === "initial") {
                    setInitialLocationSent(true);
                }

                // Update local state with zone/place from backend if provided in acknowledgment
                // If backend doesn't return these, use the mock data we generated
                setCurrentLocation(prevLoc => ({
                    ...prevLoc,
                    currentZone: ack.currentZone || mockData.currentZone,
                    nearbyPlace: ack.nearbyPlace || mockData.nearbyPlace,
                    nearest_poi: ack.nearest_poi || mockData.nearest_poi,
                    poi_type: ack.poi_type || mockData.poi_type,
                    crowd_density: ack.crowd_density || mockData.crowd_density,
                    crime_score: ack.crime_score || mockData.crime_score,
                    is_familiar: ack.is_familiar !== undefined ? ack.is_familiar : mockData.is_familiar,
                    parent_sensitivity: ack.parent_sensitivity || mockData.parent_sensitivity,
                }));
            } else {
                console.error("❌ Location update acknowledgment failed:", ack);
                setIsSendingLocation(false);
                setCurrentLocation(prevLoc => ({ ...prevLoc, currentZone: "Update Failed", nearbyPlace: "Update Failed" }));
            }
        });
    } catch (error) {
        console.error("❌ Error emitting location update via Socket.IO:", error);
        setIsSendingLocation(false);
        setCurrentLocation(prevLoc => ({ ...prevLoc, currentZone: "Socket Error", nearbyPlace: "Socket Error" }));
    }
  }, [registeredChildData, accelerometerData, barometerData]);

  // --- Socket.IO Connection Management Effect ---
  useEffect(() => {
    // Disconnect and clean up if not registered or childId is missing
    if (!isRegistered || !registeredChildData?.childId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsSharingActive(false);
      setIsSendingLocation(false);
      setInitialLocationSent(false);
      return;
    }

    // Only (re)connect if not already connected and childId matches
    if (socketRef.current && socketRef.current.connected && socketRef.current.io.opts.query.childId === registeredChildData.childId) {
        setIsSharingActive(true);
        return;
    }

    console.log("🔌 Attempting to connect Socket.IO...");
    // Initialize Socket.IO client
    socketRef.current = io(SOCKET_IO_SERVER_URL, {
        query: { childId: registeredChildData.childId },
        withCredentials: true
    });

    // Event listener for successful connection
    socketRef.current.on('connect', () => {
      console.log('🔌✅ Socket.IO connected for child:', registeredChildData.childId);
      setIsSharingActive(true);
    });

    // Event listener for disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌❌ Socket.IO disconnected:', reason);
      setIsSharingActive(false);
      setIsSendingLocation(false);
      setInitialLocationSent(false);
    });

    // Event listener for connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('🔌❌ Socket.IO connection error:', error.message);
      setIsSharingActive(false);
      setIsSendingLocation(false);
      setCurrentLocation(prevLoc => ({ ...prevLoc, currentZone: "Connection Error", nearbyPlace: "Connection Error" }));
    });

    // Cleanup function
    return () => {
      console.log("🔌🧹 Cleaning up Socket.IO connection...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isRegistered, registeredChildData?.childId]);

  // --- Effect to handle INITIAL location sending (ONLY ONCE) ---
  useEffect(() => {
    // Only send initial location if:
    // - Registered and have childId
    // - Socket is connected
    // - We have a valid location
    // - Initial location hasn't been sent yet
    if (!isRegistered || 
        !registeredChildData?.childId || 
        !socketRef.current?.connected || 
        !hasValidLocation || 
        initialLocationSent) {
      return;
    }

    console.log("🚀 SENDING INITIAL LOCATION (ONE TIME ONLY)");
    sendLocationToBackend(currentLocation, "initial");
  }, [isRegistered, registeredChildData?.childId, hasValidLocation, initialLocationSent, sendLocationToBackend]);

  // --- Effect to handle location checking for movement (DISTANCE-BASED ONLY) ---
  useEffect(() => {
    // Don't start location checking if not properly set up
    if (!isRegistered || 
        !registeredChildData?.childId || 
        !initialLocationSent) { // Wait until initial location is sent
      return;
    }

    // Check for Geolocation API support
    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      setCurrentLocation(prevLoc => ({ ...prevLoc, currentZone: "Geo Not Supported" }));
      setIsSharingActive(false);
      setLastLocationUpdateTime('N/A');
      return;
    }

    console.log("🎯 Starting distance-based location monitoring...");

    // Function to check current location and compare with last sent location
    const checkLocationForMovement = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Always update the current location state for UI display
          setCurrentLocation(prevLoc => ({
            ...prevLoc,
            latitude,
            longitude,
            accuracy,
            currentZone: prevLoc.currentZone || "Fetching...",
            nearbyPlace: prevLoc.nearbyPlace || "Fetching..."
          }));

          // Check if we need to send an update based on distance moved
          if (lastSentLocation) {
            const distance = calculateDistance(
              lastSentLocation.latitude, lastSentLocation.longitude,
              latitude, longitude
            );

            console.log(`📏 Distance moved: ${distance.toFixed(2)}m (threshold: ${DISTANCE_THRESHOLD_METERS}m)`);

            if (distance >= DISTANCE_THRESHOLD_METERS) {
              console.log(`🚶‍♂️ SIGNIFICANT MOVEMENT DETECTED! Sending location update...`);
              sendLocationToBackend({ latitude, longitude, accuracy }, `moved ${distance.toFixed(2)}m`);
            }
          }
        },
        (error) => {
          console.error("❌ Error getting current location for movement check:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Set up interval to check for movement
    const intervalId = setInterval(checkLocationForMovement, GEOLOCATION_UPDATE_INTERVAL_MS);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up location movement monitoring...");
      clearInterval(intervalId);
    };
  }, [isRegistered, registeredChildData?.childId, initialLocationSent, lastSentLocation, sendLocationToBackend]);

  // --- Effect to get initial valid location (FOR UI DISPLAY) ---
  useEffect(() => {
    if (!isRegistered || !registeredChildData?.childId) {
      setHasValidLocation(false);
      return;
    }

    if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      return;
    }

    console.log("🌍 Getting initial location for UI display...");

    // Get initial location once for UI display
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log("🌍✅ Initial location obtained:", { latitude, longitude, accuracy });
        
        setCurrentLocation(prevLoc => ({
          ...prevLoc,
          latitude,
          longitude,
          accuracy,
        }));

        // Mark that we have a valid location
        if (latitude !== 28.6139 || longitude !== 77.2090) {
          setHasValidLocation(true);
        }
      },
      (error) => {
        console.error("❌ Error getting initial location:", error);
        setCurrentLocation(prevLoc => ({ 
          ...prevLoc, 
          currentZone: "Location Error", 
          nearbyPlace: "Location Error" 
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [isRegistered, registeredChildData?.childId]);

  // Handler for submitting the child code in the popup
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setCodeEntryError("");

    if (!childCodeInput.trim()) {
      setCodeEntryError("Please enter the 11-digit code.");
      return;
    }

    setIsVerifyingCode(true);
    try {
      const response = await fetch(`${API_URL}/code/verify-child-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: childCodeInput }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        const newRegisteredChildData = {
          parentId: data.parentId,
          childName: data.childName,
          childId: data.childId,
        };
        localStorage.setItem("registeredChildData", JSON.stringify(newRegisteredChildData));
        setRegisteredChildData(newRegisteredChildData);
        setIsRegistered(true);
        setShowCodeEntryPopup(false);
        // Reset all tracking states
        setInitialLocationSent(false);
        setHasValidLocation(false);
        setLastSentLocation(null);
      } else {
        setCodeEntryError(data.error || "Invalid or expired code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setCodeEntryError("Network error or server unreachable. Please try again.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // --- Inline Popup Component for Child Code Entry ---
  const CodeEntryPopup = () => (
    <div className="fixed inset-0 bg-neutral-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-neutral-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full relative">
        <h3 className="text-xl font-semibold mb-4 text-neutral-100">Enter Child Code</h3>
        <p className="text-neutral-300 mb-6">
          Please enter the 11-digit code provided by your parent.
        </p>

        {codeEntryError && <p className="text-red-500 text-sm mb-4">{codeEntryError}</p>}

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="11-digit code"
              value={childCodeInput}
              onChange={(e) => setChildCodeInput(e.target.value)}
              className="w-full p-2 bg-neutral-700 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="11"
              required
              disabled={isVerifyingCode}
            />
          </div>
          <Button
            type="submit"
            className={`w-full bg-green-600 text-white p-2 rounded transition duration-200 ease-in-out
                      ${isVerifyingCode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
            disabled={isVerifyingCode}
          >
            {isVerifyingCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Submit Code"
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  // Render the popup if not registered, otherwise render the main tracker UI
  if (!isRegistered && showCodeEntryPopup) {
    return <CodeEntryPopup />;
  }

  return (
    <div className="min-h-screen bg-surface-base dark:bg-neutral-950 font-sans flex flex-col justify-center py-8">
      {/* Header */}
      <div className="px-6 pb-8">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 text-center">
          {registeredChildData ? `${registeredChildData.childName}'s Location Tracker` : "Location Tracker"}
        </h1>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-8 max-w-md mx-auto w-full">
        {/* Status Badge */}
        {
          isSharingActive ? (
            <Badge className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 rounded-full text-sm font-medium flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Sharing Active
            </Badge>
          ) : isSendingLocation ? (
            <Badge className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 rounded-full text-sm font-medium flex items-center gap-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Location...
            </Badge>
          ) : (
            <Badge className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 rounded-full text-sm  font-medium flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Sharing Inactive
            </Badge>
          )
        }

        {/* Map Card */}
        <Card className="p-6 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg rounded-2xl relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-gray-800 dark:text-gray-100">
                Current Location
              </h2>
              <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Safe zone
              </Badge>
            </div>

            {/* Google Map Integration */}
            {isLoaded && currentLocation.latitude && currentLocation.longitude ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                    zoom={15}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        rotateControl: false,
                        scaleControl: false,
                    }}
                >
                    <Marker
                        position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                        title={registeredChildData?.childName || "Child Location"}
                    />
                </GoogleMap>
            ) : loadError ? (
                <div className="flex items-center justify-center h-48 text-red-500">Error loading map: {loadError.message}</div>
            ) : (
                <div className="flex items-center justify-center h-48 text-gray-400">Loading map...</div>
            )}

            {/* Location Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Latitude
                  </span>
                  <p className="text-base font-mono text-gray-800 dark:text-gray-100 mt-1">
                    {currentLocation.latitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Longitude
                  </span>
                  <p className="text-base font-mono text-gray-800 dark:text-gray-100 mt-1">
                    {currentLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Accuracy
                  </span>
                  <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                    ±{currentLocation.accuracy.toFixed(1)}m
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Current Zone
                  </span>
                  <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                    {currentLocation.currentZone}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-neutral-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Nearby Place
                </span>
                <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                  Near: {currentLocation.nearbyPlace}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Debug Information */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-neutral-900 p-3 rounded">
          <p><strong>Debug Info:</strong></p>
          <p>✅ Valid Location: {hasValidLocation ? 'Yes' : 'No'}</p>
          <p>🚀 Initial Sent: {initialLocationSent ? 'Yes' : 'No'}</p>
          <p>🔌 Socket Connected: {socketRef.current?.connected ? 'Yes' : 'No'}</p>
          {lastSentLocation && (
            <p>📍 Last Sent: {lastSentLocation.latitude.toFixed(4)}, {lastSentLocation.longitude.toFixed(4)}</p>
          )}
          {/* Debug Sensor Data */}
          {(accelerometerData || barometerData) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-100 dark:bg-neutral-900 p-3 rounded">
              <p><strong>Sensor Data:</strong></p>
              {accelerometerData && (
                <p>📦 Accel → X: {accelerometerData.x}, Y: {accelerometerData.y}, Z: {accelerometerData.z}</p>
              )}
              {barometerData && (
                <p>🌬️ Pressure: {barometerData.pressure} hPa</p>
              )}
            </div>
          )}
        </div>

        {/* Footer with last update time */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Last Backend Update: {lastLocationUpdateTime}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="px-8 py-3 rounded-full border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
            onClick={() => {
                // Reset all states and stop tracking
                setIsSharingActive(false);
                setIsSendingLocation(false);
                setLastLocationUpdateTime('Stopped');
                setLastSentLocation(null);
                setHasValidLocation(false);
                setInitialLocationSent(false);
                setCurrentLocation({
                  latitude: 28.6139,
                  longitude: 77.2090,
                  accuracy: 9999,
                  currentZone: "Sharing Stopped",
                  nearbyPlace: "Sharing Stopped"
                });
                
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    console.log("🔌🛑 Socket.IO disconnected by user.");
                }
            }}
          >
            Stop Sharing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationTracker;
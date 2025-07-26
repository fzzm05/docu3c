import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui Button
import { Card } from "@/components/ui/card";     // Assuming shadcn/ui Card
import { Badge } from "@/components/ui/badge";   // Assuming shadcn/ui Badge
import { Heart, MapPin, Clock, Wifi, Shield, Loader2 } from "lucide-react"; // Added Loader2 for loading state
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'; // Added for map integration

// Assuming VITE_API_URL is defined in your .env.local or .env file
const API_URL = import.meta.env.VITE_API_URL;
// Load Google Maps API Key from environment variables (for map display only)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Ensure this is set

// Map container style
const containerStyle = {
  width: '100%',
  height: '400px', // Fixed height for the map
  borderRadius: '1rem', // Tailwind's rounded-2xl
};

const LocationTracker = () => {
  // State for location data
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 3.2,
    currentZone: "Fetching zone...", // New state for the zone, will be updated by backend response
    nearbyPlace: "Fetching...", // Static mock for now, will be updated by backend
  });
  const [locationSharing, setLocationSharing] = useState(false);
  const [lastLocationUpdateTime, setLastLocationUpdateTime] = useState('just now'); // For footer

  // --- New states for code entry popup ---
  const [isRegistered, setIsRegistered] = useState(false); // True if child device is registered
  const [showCodeEntryPopup, setShowCodeEntryPopup] = useState(false);
  const [childCodeInput, setChildCodeInput] = useState("");
  const [codeEntryError, setCodeEntryError] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false); // Loading state for code verification

  // State to store registered child's data (from localStorage)
  // Now includes childId, parentId, and childName
  const [registeredChildData, setRegisteredChildData] = useState(null);

  // Load Google Maps JavaScript API for the map display
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-child', // Unique ID for this map instance
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Effect to check local storage on initial load
  useEffect(() => {
    const storedChildData = localStorage.getItem("registeredChildData");
    if (storedChildData) {
      try {
        const parsedData = JSON.parse(storedChildData);
        // Ensure all expected fields are present (childId, parentId, childName)
        if (parsedData.childId && parsedData.parentId && parsedData.childName) {
            setRegisteredChildData(parsedData);
            setIsRegistered(true);
        } else {
            console.warn("Incomplete registeredChildData in localStorage. Re-registering.");
            localStorage.removeItem("registeredChildData"); // Clear incomplete data
            setShowCodeEntryPopup(true);
        }
      } catch (e) {
        console.error("Error parsing registeredChildData from localStorage:", e);
        localStorage.removeItem("registeredChildData"); // Clear corrupted data
        setShowCodeEntryPopup(true); // Show popup if data is corrupted
      }
    } else {
      setShowCodeEntryPopup(true); // Show popup if no data found
    }
  }, []); // Runs only once on component mount

  // Effect to fetch location every 3 seconds IF registered
  useEffect(() => {
    let intervalId;
    if (isRegistered && registeredChildData?.childId) { // Ensure childId is available
      const getLocationAndSend = async () => { // Made async to await backend calls
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => { // Made callback async
              const { latitude, longitude, accuracy } = position.coords;

              // Update local state with new latitude, longitude, and accuracy
              // currentZone will be updated by the backend response
              setLocation(prevLoc => ({
                ...prevLoc, // Keep previous currentZone until updated by backend
                latitude,
                longitude,
                accuracy,
              }));
              setLocationSharing(true);
              setLastLocationUpdateTime(new Date().toLocaleTimeString()); // Update last updated time

              // Send location data to backend (only lat, lon, childId)
              try {
                const response = await fetch(`${API_URL}/location/child/location-update`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    childId: registeredChildData.childId, // Use the stored childId
                    latitude,
                    longitude,
                    // currentZone is now determined by backend, so don't send it from here
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error("Backend location update failed:", errorData);
                  // Optionally, show a toast or message to the user
                  setLocation(prevLoc => ({ ...prevLoc, currentZone: "Update Error", nearbyPlace: "Update Error"})); // Indicate error in zone
                } else {
                  const responseData = await response.json();
                  // Update currentZone in state with value from backend
                  setLocation(prevLoc => ({ ...prevLoc, currentZone: responseData.currentZone, nearbyPlace: responseData.nearbyPlace || "Unknown" })); // Update nearbyPlace if provided
                }
              } catch (backendError) {
                console.error("Network error sending location to backend:", backendError);
                // Optionally, show a toast or message to the user
                setLocation(prevLoc => ({ ...prevLoc, currentZone: "Network Error", nearbyPlace: "Network Error" })); // Indicate network error in zone
              }

            },
            (error) => {
              console.error("Error fetching location:", error);
              setLocation({
                latitude: 28.6139,
                longitude: 77.2090,
                accuracy: 3.2,
                currentZone: "Location Error" // Set zone to error if geolocation fails
              });
              setLocationSharing(false);
              setLastLocationUpdateTime('Error');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          console.error("Geolocation is not supported by this browser.");
          setLocationSharing(false);
          setLastLocationUpdateTime('N/A');
          setLocation(prevLoc => ({ ...prevLoc, currentZone: "Geo Not Supported" })); // Indicate geo not supported
        }
      };

      // Initial location fetch and send
      getLocationAndSend();

      // Set up interval to fetch and send location every 3 seconds
      intervalId = setInterval(getLocationAndSend, 3000);
    }

    // Cleanup interval on component unmount or if registration status changes
    return () => clearInterval(intervalId);
  }, [isRegistered, registeredChildData?.childId]); // Rerun effect if isRegistered or childId changes

  // Handler for submitting the code in the popup
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

  // --- Popup Component (Inline for simplicity) ---
  const CodeEntryPopup = () => (
    <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50">
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
          locationSharing ? (
            <Badge className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 rounded-full text-sm font-medium flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Sharing Active
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
              {/* Safety Badge */}
              <Badge className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 rounded-full text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Safe zone
              </Badge>
            </div>
            
            {/* Google Map Integration */}
            {isLoaded && location.latitude && location.longitude ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: location.latitude, lng: location.longitude }}
                    zoom={15} // Adjust zoom level as needed
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
                        position={{ lat: location.latitude, lng: location.longitude }}
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
                    {location.latitude.toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Longitude
                  </span>
                  <p className="text-base font-mono text-gray-800 dark:text-gray-100 mt-1">
                    {location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Accuracy
                  </span>
                  <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                    ±{location.accuracy.toFixed(1)}m
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Current Zone
                  </span>
                  <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                    {location.currentZone} {/* Display current zone from backend response */}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-neutral-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Nearby Place
                </span>
                <p className="text-base text-gray-800 dark:text-gray-100 mt-1">
                  {console.log("Location data:", location)} {/* Debugging log */}
                  Near: {location.nearbyPlace} {/* This remains static mock for now */}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="px-8 py-3 rounded-full border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
          >
            Stop Sharing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationTracker;

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';
import { ZoomIn, ZoomOut, Navigation, MapPin, Clock, Gauge, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Assuming you have a custom hook for authentication

// Retrieve API keys from environment variables
const Maps_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_API_URL;

// Styles for the map container
const containerStyle = {
  width: '100%',
  height: '100%',
};

function formatIsoToIST(isoDateString) {
  // 1. Create a Date object from the ISO string.
  // The Date constructor correctly parses ISO 8601 strings, treating 'Z' as UTC.
  const date = new Date(isoDateString);

  // 2. Define formatting options for Indian Standard Time (IST).
  const options = {
    weekday: 'long',   // e.g., "Saturday"
    year: 'numeric',   // e.g., "2025"
    month: 'long',     // e.g., "July"
    day: 'numeric',    // e.g., "26"
    hour: 'numeric',   // e.g., "12"
    minute: 'numeric', // e.g., "42"
    second: 'numeric', // e.g., "35"
    hour12: true,      // Use 12-hour clock (AM/PM)
    timeZone: 'Asia/Kolkata', // Specify the desired time zone (IST)
    timeZoneName: 'short', // e.g., "IST"
  };

  // 3. Create a DateTimeFormat instance for the desired locale and options.
  // 'en-IN' is the locale for English in India, which will help with number formatting
  // and other locale-specific nuances if any.
  const formatter = new Intl.DateTimeFormat('en-IN', options);

  // 4. Format the date.
  return formatter.format(date);
}

// Default center for the map if no child is selected or data is unavailable
const defaultCenter = {
  lat: 23.2599, // Example: Bhopal, India (a central point in Madhya Pradesh)
  lng: 77.4126,
};

const LiveMap = ({ activeChild }) => {
  const { user } = useAuth();
  const [childData, setChildData] = useState(null); // State to store the active child's live data
  const [loadingChildData, setLoadingChildData] = useState(false);
  const [childDataError, setChildDataError] = useState(null);
  const [map, setMap] = useState(null); // State to hold the map instance for programmatic controls

  // Callback to set the map instance when it loads
  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  // Callback to clear the map instance when it unmounts
  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Helper function to determine status color (can be moved to a utils file if shared)
  const getStatusColor = (status) => {
    switch (status) {
      case 'safe':
        return 'text-green-500 border-green-500 bg-green-50';
      case 'warning':
        return 'text-orange-500 border-orange-500 bg-orange-50';
      case 'danger':
        return 'text-red-500 border-red-500 bg-red-50 animate-pulse';
      default:
        return 'text-gray-500 border-gray-500 bg-gray-50';
    }
  };

  // Define consistent colors for the active child's map pin and pulse
  const activePinColor = 'bg-blue-600';
  const activePulseColor = 'bg-blue-600';

  // Effect hook to fetch live location data for the active child
  useEffect(() => {
    let intervalId;
    const fetchLiveLocation = async () => {
      // If no active child is selected or user ID is unavailable, clear data and stop fetching
      if (!activeChild || !user?.id) {
        setChildData(null);
        setLoadingChildData(false);
        setChildDataError(null);
        return;
      }

      setLoadingChildData(true);
      setChildDataError(null); // Clear previous errors
      try {
        // Construct the URL with childId and parentId for backend identification and security
        const url = new URL(`${API_URL}/location/child/location`);
        url.searchParams.append('childId', activeChild);
        url.searchParams.append('parentId', user.id);

        const response = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include', // Ensures session cookies are sent
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: `HTTP error! status: ${response.status}` };
          }
          throw new Error(errorData.error || errorData.message || `Failed to fetch live location with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched live location data:", data); // Debugging log

        // Assuming data.locationData contains: { id, name, status, location, lastUpdated, coordinates: { lat, lng } }
        setChildData(data.locationData);

        // If the map is loaded and new coordinates are available, pan the map to the new location
        if (map && data.locationData?.coordinates) {
          map.panTo(data.locationData.coordinates);
        }

      } catch (err) {
        console.error("Error fetching live location:", err);
        setChildDataError(`Failed to load live location: ${err.message}. Please check your connection or try again.`);
      } finally {
        setLoadingChildData(false);
      }
    };

    // Initial data fetch when component mounts or activeChild/user changes
    fetchLiveLocation();

    // Set up an interval to refresh data periodically for live tracking
    intervalId = setInterval(fetchLiveLocation, 10000); // Fetch every 10 seconds

    // Clean up the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);

  }, [activeChild, user, map]); // Dependencies: re-run effect if these values change

  // Function to handle map zoom in
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  // Function to handle map zoom out
  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  // Function to recenter the map on the child's location or default center
  const handleRecenter = () => {
    if (map && childData?.coordinates) {
      map.panTo(childData.coordinates);
    } else if (map) {
      map.panTo(defaultCenter);
    }
  };

  // Render content when no child is selected
  if (!activeChild) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">Select a child to view location</h2>
          <p className="text-sm text-muted-foreground">Choose from the sidebar to see live tracking</p>
        </div>
      </div>
    );
  }

  // Render loading state while fetching initial child data
  if (loadingChildData && !childData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <p>Loading live location data for {activeChild}...</p>
        </div>
      </div>
    );
  }

  // Render error state if fetching child data fails
  if (childDataError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-red-500">
          <p>{childDataError}</p>
          <p className="text-sm text-muted-foreground mt-2">Please ensure the backend is running and you have internet access.</p>
        </div>
      </div>
    );
  }

  // Render message if no data is available for the selected child (e.g., child not active)
  if (!childData) {
     return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-lg font-medium text-muted-foreground mb-2">Location data not available for {activeChild}</h2>
          <p className="text-sm text-muted-foreground">The child might not be active or data is not yet recorded.</p>
        </div>
      </div>
    );
  }

  // Main render for the LiveMap component when childData is available
  return (
    <div className="flex-1 flex flex-col">
      {/* Header section displaying child's name and last updated time */}
      <div className="bg-card border-b border-neutral-200 border-border px-6 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            <MapPin className="inline-block h-4 mr-2 text-[#8e8e8e]" />
            Live Location – {childData.name}
          </h2>
          <div className="text-sm text-muted-foreground">
            Updated {formatIsoToIST(childData.lastUpdated)}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {/* Conditional rendering based on whether Google Maps API Key is available */}
        {Maps_API_KEY ? (
          <LoadScript googleMapsApiKey={Maps_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={childData.coordinates || defaultCenter} // Center map on child's coordinates or default
              zoom={15} // Initial zoom level
              onLoad={onLoad} // Callback when map loads
              onUnmount={onUnmount} // Callback when map unmounts
              options={{
                disableDefaultUI: true, // Hide all default Google Map UI controls
                zoomControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                rotateControl: false,
                scaleControl: false,
              }}
            >
              {/* Marker for the child's live location */}
              {childData.coordinates && (
                <MarkerF
                  position={childData.coordinates}
                  // Custom icon could be defined here if a specific SVG path or image is desired
                >
                    {/* Custom info window/label above the marker */}
                    <div className="absolute transform -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap">
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
                            <div className="text-sm font-medium text-foreground">{childData.name}</div>
                            <div className="text-xs text-muted-foreground">{childData.location}</div>
                        </div>
                    </div>
                </MarkerF>
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          // Message displayed if API key is missing
          <div className="flex items-center justify-center h-full text-red-500">
            Google Maps API Key is missing. Please set VITE_Maps_API_KEY in your .env file.
          </div>
        )}

        {/* Map Controls (Zoom In, Zoom Out, Recenter) */}
        <div className="absolute top-6 right-6 flex flex-col space-y-2 z-20">
          <button
            onClick={handleZoomIn}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleRecenter}
            className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Navigation className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Location Information Panel */}
        <div className="absolute bottom-6 left-6 bg-white border border-gray-200 rounded-xl p-4 shadow-md max-w-sm z-20">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {/* Status indicator, uses activePinColor if the child is active, otherwise status color */}
              <div className={`w-3 h-3 rounded-full ${activeChild === childData.id ? activePinColor : getStatusColor(childData.status).split(' ')[0]}`} />
              <span className="font-medium text-foreground">{childData.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Coordinates</div>
                  <div className="text-muted-foreground">
                    {childData.coordinates?.lat?.toFixed(4) || 'N/A'}, {childData.coordinates?.lng?.toFixed(4) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Accuracy</div>
                  <div className="text-muted-foreground">±5 meters</div> {/* This is a hardcoded placeholder */}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="font-medium">Last seen:</span>
                <span className="text-muted-foreground ml-1">{formatIsoToIST(childData.lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
// SafetyAlerts.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Phone, MessageSquare, Clock, AlertTriangle, Users, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

// REMOVED: Mock children data - you should rely on your actual child data now

const formatTime = (isoDateString) => {
  try {
    const date = new Date(isoDateString);

    if (isNaN(date.getTime())) {
      console.error("formatTime: Invalid date string provided:", isoDateString);
      return "Invalid Time";
    }

    return date.toLocaleTimeString();
  } catch (error) {
    console.error("formatTime: Error formatting time:", error);
    return "Error";
  }
};

// Memoized fetch function for child status
const fetchChildStatusFromBackend = async (childId, latitude, longitude, parentId, accuracy) => {
  if (!childId || !parentId) {
    console.warn('SafetyAlerts: Cannot fetch child status - missing childId or parentId.');
    return { currentStatus: 'unknown', alerts: [], error: 'Missing childId or parentId' }; // Return empty data to avoid errors
  }

  try {
    const url = new URL(`${API_URL}/alerts/child`);
    url.searchParams.append('childId', childId);
    url.searchParams.append('parentId', parentId);
    url.searchParams.append('lat', latitude || '');
    url.searchParams.append('lon', longitude || '');
    url.searchParams.append('accuracy', accuracy || '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData.error || errorData.message || 'Failed to fetch child status');
    }

    const data = await response.json();
    console.log('SafetyAlerts: Fetched alert data:', data);
    // If the backend returns { error: true, message: "..." } in a 200 OK response
    if (data.error === true) {
      return { currentStatus: 'error_backend', alerts: [], error: data.message || 'Backend reported an error' };
    }
    return data.alertData || { currentStatus: 'unknown', alerts: [] };
  } catch (error) {
    console.error('SafetyAlerts: Network or API error fetching child status:', error);
    return { currentStatus: 'error_fetching', alerts: [], error: error.message };
  }
};

// Gemini JSON function
const fetchGeminiChildData = async (childId, accuracy, latitude, longitude, parentId) => {
  try {
    const data = await fetchChildStatusFromBackend(childId, accuracy, latitude, longitude, parentId);
    setChildData(data); // Set childData for rendering UI

    const jsonResponse = {
      error: false,
      data: {
        childId,
        currentStatus: data.currentStatus,
        latitude,
        longitude,
        alerts: data.alerts,
      },
      timestamp: new Date().toISOString(),
    };

    if (data.error) { // This checks for a specific 'error' field in the returned data object
      setError(data.error);
    } else {
      setError(null); // Clear error if data fetch was successful
    }

    console.log('SafetyAlerts: Gemini JSON response:', jsonResponse);
    return JSON.stringify(jsonResponse);
  } catch (error) {
    console.error('SafetyAlerts: Error in fetchGeminiChildData:', error);
    return JSON.stringify({
      error: true,
      message: 'Network or API error fetching child data',
      data: null,
    });
  }
};

// Helper functions
const getAlertIcon = (type) => {
  switch (type) {
    case 'location':
      return <MapPin className="w-4 h-4" />;
    case 'activity':
      return <Clock className="w-4 h-4" />;
    case 'safety':
      return <AlertTriangle className="w-4 h-4" />;
    case 'crowd':
      return <Users className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

const getAlertStyles = (priority) => {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-red-400 bg-red-50 text-red-900';
    case 'medium':
      return 'border-l-4 border-orange-400 bg-orange-50 text-orange-800';
    case 'low':
      return 'border-l-4 border-green-500 bg-green-50 text-green-900';
    default:
      return 'border-l-4 border-gray-400 bg-gray-50 text-gray-800';
  }
};

const SafetyAlerts = ({ activeChild, currentLatitude, currentLongitude, accuracy }) => {
  const { user } = useAuth();
  const [childData, setChildData] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Log prop changes for debugging
  useEffect(() => {
    console.log('SafetyAlerts: Props updated - activeChild:', activeChild, 'lat:', currentLatitude, 'lon:', currentLongitude, 'accuracy:', accuracy);
  }, [activeChild, currentLatitude, currentLongitude, accuracy]);

  // Use useCallback for fetchDetails to ensure it's stable and doesn't cause unnecessary re-renders
  const fetchDetails = useCallback(async () => {
    if (!activeChild || !user?.id) {
      console.log('SafetyAlerts: No activeChild or user.id, clearing data');
      setChildData(null);
      setJsonData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Only proceed if currentLatitude and currentLongitude are valid numbers
    if (typeof currentLatitude !== 'number' || typeof currentLongitude !== 'number' || isNaN(currentLatitude) || isNaN(currentLongitude)) {
      console.log('SafetyAlerts: Missing or invalid lat/lon, clearing data');
      setChildData(null);
      setJsonData(null);
      setLoading(false);
      setError('Missing or invalid location data for alerts. Please ensure child device is active and sending location.');
      return;
    }

    setLoading(true);
    setError(null);
    console.log('SafetyAlerts: Initiating fetch for childId:', activeChild);

    try {
      // Fetch data for alerts UI
      const data = await fetchChildStatusFromBackend(activeChild, currentLatitude, currentLongitude, user.id);
      setChildData(data); // Set childData for rendering UI

      // Fetch JSON data for Gemini output
      const json = await fetchGeminiChildData(activeChild, currentLatitude, currentLongitude, user.id);
      setJsonData(JSON.parse(json)); // Set jsonData for Gemini display

      if (data.error) {
        setError(data.error);
      } else {
        setError(null); // Clear error if data fetch was successful
      }
    } catch (err) {
      console.error('SafetyAlerts: Error in fetchDetails:', err);
      setError(`Failed to load alerts: ${err.message}`);
      setChildData(null); // Clear data on error
      setJsonData(null);
    } finally {
      setLoading(false);
    }
  }, [activeChild, currentLatitude, currentLongitude, user]); // Dependencies for useCallback

  // Effect hook to call fetchDetails when dependencies change
  useEffect(() => {
    console.log('SafetyAlerts: useEffect triggered to fetch details.');
    fetchDetails();
  }, [fetchDetails]); // Dependency is the memoized fetchDetails function

  if (!activeChild) {
    return (
      <div className="bg-card border-l border-border border-neutral-200 flex flex-col" style={{ width: 'var(--alerts-width, 240px)' }}>
        <div className="p-4 border-b border-border border-neutral-200">
          <h2 className="text-lg font-semibold text-foreground">Safety Feed</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground text-sm">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a child to view alerts</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine child's name for display if childData is available
  const childName = childData?.name || activeChild; // Fallback to activeChild ID if name not yet loaded

  return (
    <div className="bg-card border-l border-border border-neutral-200 flex flex-col" style={{ height: '93vh', width: 'var(--alerts-width, 320px)' }}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 border-border">
        <h2 className="text-lg font-semibold text-foreground">Safety Feed</h2>
        {/* Update this to use the actual child name once available in childData */}
        {childData && !loading && !error && (
            <p className="text-sm text-muted-foreground mt-1">Real-time alerts for {childData.name || activeChild}</p>
        )}
        {loading && (
          <p className="text-xs text-muted-foreground mt-1 animate-pulse">Fetching child's live status...</p>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1">Error: {error}</p>
        )}
        {childData && !error && (
          <p className="text-xs text-blue-600 mt-1">
            Current Status: <span className="font-semibold">{childData.currentStatus?.replace(/_/g, ' ') || 'Unknown'}</span>
          </p>
        )}
      </div>

      {/* Alerts List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : !childData || !childData.alerts || childData.alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">All clear! No active alerts.</p>
          </div>
        ) : (
          childData.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg shadow-sm border border-gray-200 ${getAlertStyles(alert.priority)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{alert.message}</p>
                  <div className="flex items-center text-xs opacity-75 mb-3">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(alert.timestamp)} {/* Ensure timestamp is passed to formatTime */}
                  </div>
                  {alert.actions && alert.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {alert.actions.map((action, index) => (
                        <button
                          key={index}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-background hover:bg-muted-foreground/10 border border-border rounded-full text-xs font-medium text-foreground transition-colors"
                        >
                          {action === 'Call Child' && <Phone className="w-3 h-3" />}
                          {action === 'Send Safety Prompt' && <MessageSquare className="w-3 h-3" />}
                          {action === 'Contact Authorities' && <AlertTriangle className="w-3 h-3" />}
                          <span>{action}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {/* Gemini JSON Display (for debugging/integration with Gemini)
        {jsonData && (
          <div className="bg-neutral-800 p-3 rounded-lg text-xs text-neutral-300 font-mono overflow-auto max-h-48 mt-4">
            <h4 className="font-semibold text-neutral-100 mb-2">Gemini Response JSON:</h4>
            <pre>{JSON.stringify(jsonData, null, 2)}</pre>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default SafetyAlerts;
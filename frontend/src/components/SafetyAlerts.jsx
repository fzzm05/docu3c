import React from 'react';
import { Phone, MessageSquare, Clock, AlertTriangle, Users, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

// Mock children data for name lookup
const mockChildren = [
  { id: 'vijay', name: 'Vijay' },
  { id: 'priya', name: 'Priya' },
  { id: 'arjun', name: 'Arjun' },
  { id: 'sara', name: 'Sara' },
];

const formatTime = (isoDateString) => {
  try {
    const date = new Date(isoDateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date string provided:", isoDateString);
      return "Invalid Time";
    }

    // Use toLocaleTimeString for locale-specific time formatting.
    // You can customize options further if needed, e.g., for 24-hour format or no seconds.
    // Example options:
    // { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true } for HH:MM:SS AM/PM
    // { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } for HH:MM:SS (24-hour)
    return date.toLocaleTimeString(); // Default locale-specific time format
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Error";
  }
};

// Fetch alerts and status from the backend
const fetchChildStatusFromBackend = async (childId, latitude, longitude, parentId) => {
  try {
    console.log('SafetyAlerts: Fetching alerts for childId:', childId, 'lat:', latitude, 'lon:', longitude, 'parentId:', parentId);
    const url = new URL(`${API_URL}/alerts/child`);
    url.searchParams.append('childId', childId);
    url.searchParams.append('parentId', parentId);
    url.searchParams.append('lat', latitude || '');
    url.searchParams.append('lon', longitude || '');

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
    return data.alertData || { currentStatus: 'unknown', latitude, longitude, alerts: [] };
  } catch (error) {
    console.error('SafetyAlerts: Network or API error fetching child status:', error);
    return { currentStatus: 'error_fetching', latitude, longitude, alerts: [], error: error.message };
  }
};

// Gemini JSON function
const fetchGeminiChildData = async (childId, latitude, longitude, parentId) => {
  try {
    const data = await fetchChildStatusFromBackend(childId, latitude, longitude, parentId);

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

// SafetyAlerts Component
const SafetyAlerts = ({ activeChild, currentLatitude, currentLongitude }) => {
  const { user } = useAuth();
  const [childData, setChildData] = React.useState(null);
  const [jsonData, setJsonData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Log prop changes
  React.useEffect(() => {
    console.log('SafetyAlerts: Props changed - activeChild:', activeChild, 'lat:', currentLatitude, 'lon:', currentLongitude);
  }, [activeChild, currentLatitude, currentLongitude]);

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!activeChild || !user?.id) {
        console.log('SafetyAlerts: No activeChild or user.id, clearing data');
        setChildData(null);
        setJsonData(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (currentLatitude == null || currentLongitude == null) {
        console.log('SafetyAlerts: Missing lat/lon, clearing data');
        setChildData(null);
        setJsonData(null);
        setLoading(false);
        setError('Missing location data');
        return;
      }

      setLoading(true);
      setError(null);
      console.log('SafetyAlerts: Fetching data for childId:', activeChild);
      // Fetch data for alerts UI
      const data = await fetchChildStatusFromBackend(activeChild, currentLatitude, currentLongitude, user.id);
      setChildData(data);
      // Fetch JSON data for Gemini output
      const json = await fetchGeminiChildData(activeChild, currentLatitude, currentLongitude, user.id);
      setJsonData(JSON.parse(json));
      setLoading(false);

      if (data.error) {
        setError(data.error);
      }
    };

    fetchDetails();
  }, [activeChild, currentLatitude, currentLongitude, user]);

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

  return (
    <div className="bg-card border-l border-border border-neutral-200 flex flex-col" style={{ height: '92vh', width: 'var(--alerts-width, 320px)' }}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 border-border">
        <h2 className="text-lg font-semibold text-foreground">Safety Feed</h2>
        {/* <p className="text-sm text-muted-foreground mt-1">Real-time alerts for {childData.name}</p> */}
        {loading && (
          <p className="text-xs text-muted-foreground mt-1 animate-pulse">Fetching child's live status...</p>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1">Error: {error}</p>
        )}
        {childData && !error && (
          <p className="text-xs text-blue-600 mt-1">
            Current Status: <span className="font-semibold">{childData.currentStatus.replace(/_/g, ' ')}</span>
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
        ) : !childData || childData.alerts.length === 0 ? (
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
                    {(alert.timestamp)}
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
      </div>
    </div>
  );
};

export default SafetyAlerts;
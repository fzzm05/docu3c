// childrenSidebar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Assuming you have a custom hook for authentication
import axios, { formToJSON } from 'axios';

// Assuming VITE_API_URL is defined in your .env.local or .env file
const API_URL = import.meta.env.VITE_API_URL;

// Mock data for children list (will be replaced by actual data from backend)
const mockChildren = [
  {
    id: 'vijay',
    name: 'Vijay',
    status: 'safe',
    location: 'VIT Hostel Block 4',
    lastUpdated: '2 mins ago',
    coordinates: { lat: 12.9715, lng: 79.1590 }
  },
  {
    id: 'priya',
    name: 'Priya',
    status: 'warning',
    location: 'Unknown Area - Park Street',
    lastUpdated: '15 mins ago',
    coordinates: { lat: 12.9755, lng: 79.1545 }
  },
  {
    id: 'arjun',
    name: 'Arjun',
    status: 'safe',
    location: 'School Campus',
    lastUpdated: '5 mins ago',
    coordinates: { lat: 12.9685, lng: 79.1620 }
  },
  {
    id: 'sara',
    name: 'Sara',
    status: 'danger',
    location: 'High-Risk Zone Detected',
    lastUpdated: '1 min ago',
    coordinates: { lat: 12.9800, lng: 79.1500 }
  }
];

// Helper component to display status indicator
const StatusIndicator = ({ status }) => {
  let bgColor = 'bg-gray-400';
  switch (status) {
    case 'safe':
      bgColor = 'bg-green-500';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      break;
    case 'danger':
      bgColor = 'bg-red-500';
      break;
    default:
      bgColor = 'bg-gray-400'; // Default for unknown status
  }
  return <div className={`w-3 h-3 rounded-full ${bgColor}`} />;
};

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


// Helper function to get human-readable status text
const getStatusText = (status) => {
  switch (status) {
    case 'safe':
      return 'Safe';
    case 'warning':
      return 'Unfamiliar Area';
    case 'danger':
      return 'High-Risk Zone';
    default:
      return 'Unknown';
  }
};

// Helper function to get emoji for status
const getStatusEmoji = (status) => {
  switch (status) {
    case 'safe':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'danger':
      return '🔴';
    default:
      return '⚪';
  }
};

// --- New SkeletonLoader Component ---
const SkeletonLoader = () => {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => ( // Render 3 skeleton items
        <div key={index} className="p-3 rounded-lg flex items-start space-x-3 bg-neutral-200 animate-pulse">
          {/* Status Indicator Skeleton */}
          <div className="flex items-center mt-1 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
          </div>
          
          {/* Child Information Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 bg-neutral-300 rounded w-24"></div> {/* Name skeleton */}
              <div className="h-3 bg-neutral-300 rounded w-16"></div> {/* Last updated skeleton */}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-4 bg-neutral-300 rounded w-8"></div> {/* Emoji/Status skeleton */}
              <div className="h-4 bg-neutral-300 rounded w-28"></div> {/* Status text skeleton */}
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground">
              <div className="h-3 bg-neutral-300 rounded w-full"></div> {/* Location skeleton */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
// --- End New SkeletonLoader Component ---


const ChildrenSidebar = ({ activeChild, onChildSelect }) => {
  const { user} = useAuth();
  // State for controlling the visibility and content of the popup
  const [showPopup, setShowPopup] = useState(false);
  // Initialize with mockChildren, but it will be overwritten by fetched data
  const [children, setChildren] = useState(mockChildren); 
  const [childrenError, setChildrenError] = useState(null); // State for error messages
  const [loadingChildren, setLoadingChildren] = useState(false); // Loading state for children list
  const [generatedCode, setGeneratedCode] = useState('');
  const [expiryMessage, setExpiryMessage] = useState('');
  const [childNameInput, setChildNameInput] = useState(''); // State for the child's name input
  const [showCodeSection, setShowCodeSection] = useState(false); // Controls visibility of code and expiry
  const [popupError, setPopupError] = useState(''); // Displays error messages within the popup
  const [isGeneratingCode, setIsGeneratingCode] = useState(false); // Loading state for code generation

  // --- Frontend Rate Limiting States and Refs ---
  const [rateLimitMessage, setRateLimitMessage] = useState(''); // Message for rate limit
  // useRef is used here to persist values across renders without causing re-renders
  const requestCountRef = useRef(0); // Tracks the number of requests made
  const lastRequestTimeRef = useRef(0); // Stores the timestamp of the last request
  const RATE_LIMIT_MAX = 5; // Maximum allowed requests
  const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Time window for rate limit (1 minute)

  // Handler for the initial "Add Children" button click in the sidebar
  const handleAddChildrenClick = () => {
    // Reset all popup-related states when opening the popup
    setGeneratedCode('');
    setExpiryMessage('');
    setChildNameInput('');
    setShowCodeSection(false);
    setPopupError('');
    setRateLimitMessage(''); // Clear any previous rate limit message
    setShowPopup(true); // Show the popup
  };

  // useEffect to fetch children data from the backend
  useEffect(() => {
    console.log(user);
    const fetchChildren = async () => {
      try {
        setLoadingChildren(true);
        setChildrenError(null); // Clear any previous errors

        const parentId = user.id; // Assuming user object has an id field
        console.log("Fetching data for parentId:", parentId); // Debugging log to check parentId

        // --- Changes start here for using native fetch ---
        // Construct the URL with query parameters
        const url = new URL(`${API_URL}/data/parent-dashboard`);
        url.searchParams.append('parentId', parentId);

        const response = await fetch(url.toString(), {
          method: 'GET', // Default for fetch, but explicit is good
          credentials: 'include' // Equivalent to axios' withCredentials: true
          // Add headers if needed, e.g.:
          // headers: {
          //   'Content-Type': 'application/json',
          //   'Authorization': `Bearer ${yourAuthToken}` // If using token-based auth
          // }
        });

        // Check if the response was successful (HTTP status 2xx)
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json(); // Try to parse error message from body
          } catch (e) {
            errorData = { message: `HTTP error! status: ${response.status}` }; // Fallback
          }
          throw new Error(errorData.error || errorData.message || `Failed with status: ${response.status}`);
        }

        const data = await response.json(); // Parse the JSON response body
        console.log("Fetched children data:", data); // Debugging log
        setChildren(data.childrenData); // Assuming your API returns { message: "...", childrenData: [...] }
        // --- Changes end here ---

      } catch (err) {
        console.error("Error fetching children data:", err);
        setChildrenError(`Failed to load children data: ${err.message}. Please try again later.`);
        // Optionally, if the error is due to no children, you might want to keep mockChildren
        // setChildren(mockChildren);
      } finally {
        setLoadingChildren(false);
      }
    };

    // Ensure user.id is available before fetching
    if (user && user.id) {
        fetchChildren(); // Initial fetch when component mounts

        // Set up interval to refresh data periodically (e.g., every 5 seconds)
        const intervalId = setInterval(fetchChildren, 5000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    } else {
        console.warn("User ID not available, skipping initial children data fetch.");
        setLoadingChildren(false); // Ensure loading state is reset
    }
}, [user]); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Handler for the "Show Code" button click within the popup
  const handleShowCode = async () => {
    // Validate that a child name has been entered
    if (!childNameInput.trim()) {
      setPopupError('Please enter a child\'s name.');
      return;
    }
    setPopupError(''); // Clear any previous errors

    // --- Frontend Rate Limiting Logic ---
    const now = Date.now();
    // If the time window has passed, reset the request count
    if (now - lastRequestTimeRef.current > RATE_LIMIT_WINDOW_MS) {
      requestCountRef.current = 0;
      lastRequestTimeRef.current = now;
    }

    // Check if the rate limit has been exceeded
    if (requestCountRef.current >= RATE_LIMIT_MAX) {
      setRateLimitMessage(`You can only generate ${RATE_LIMIT_MAX} codes per minute. Please wait.`);
      return;
    }

    // Increment request count and update last request time
    requestCountRef.current++;
    lastRequestTimeRef.current = now; // Update last request time for the current request
    setRateLimitMessage(''); // Clear previous rate limit message if any

    setIsGeneratingCode(true); // Set loading state to true
    try {
      // Make API call to backend to generate and store the child access code
      const response = await axios.post(`${API_URL}/code/generate-child-code`, 
        { childName: childNameInput },
        { withCredentials: true } // Important: Ensures session cookie is sent with the request
      );

      const data = response.data; // Axios automatically parses JSON

      if (response.status === 200 || response.status === 201) { // Check for 200 OK status
        // If successful, set the generated code and expiry message
        setGeneratedCode(data.code);
        const expiresAtDate = new Date(data.expiresAt);
        const minutes = expiresAtDate.getMinutes().toString().padStart(2, '0');
        const seconds = expiresAtDate.getSeconds().toString().padStart(2, '0');
        setExpiryMessage(`Valid until ${expiresAtDate.getHours()}:${minutes}:${seconds}`);
        setShowCodeSection(true); // Show the section with the code
      } else {
        // Handle errors from the backend (e.g., validation, rate limiting)
        setPopupError(data.error || 'Failed to generate code.');
        if (response.status === 429) { // Specific handling for Too Many Requests
          setRateLimitMessage(data.error || 'Too many requests. Please try again in a minute.');
        }
      }
    } catch (error) {
      // Handle network errors or other unexpected issues
      console.error("Error fetching child code:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setPopupError(error.response.data.error || 'Server error generating code.');
        if (error.response.status === 429) {
          setRateLimitMessage(error.response.data.error || 'Too many requests. Please try again in a minute.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        setPopupError('No response from server. Check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setPopupError('Error setting up the request.');
      }
    } finally {
      setIsGeneratingCode(false); // Always reset loading state
    }
  };

  // Handler to close the popup
  const handleClosePopup = () => {
    setShowPopup(false);
    // Reset all popup-related states when closing
    setGeneratedCode('');
    setExpiryMessage('');
    setChildNameInput('');
    setShowCodeSection(false);
    setPopupError('');
    setRateLimitMessage(''); // Clear rate limit message on close
    // Note: requestCountRef and lastRequestTimeRef are NOT reset here,
    // as the rate limit window continues across popup opens/closes.
  };

  return (
    <div className="bg-card border-r border-neutral-200 flex flex-col" style={{ height:'92vh', width: 'var(--sidebar-width, 240px)' }}>
      {/* Sidebar Header */}
      <div className="p-2 border-b border-neutral-200 border-border">
        <h1 className="text-sm font-semibold text-foreground">My Children</h1>
      </div>

      {/* Children List */}
      <div className="flex-1 p-2 space-y-3 overflow-y-auto">
        {loadingChildren ? (
          <SkeletonLoader /> // Display skeleton loader when loading
        ) : childrenError ? (
          <p className="text-center text-red-500">{childrenError}</p>
        ) : children.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs">No children added yet. Click "Add Child" to get started!</p>
        ) : (
          children.map((child) => (
            console.log('Rendering child:', child), // Debugging log
            <div
              key={child.id}
              onClick={() => onChildSelect(child.id)}
              className={`
                p-2 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
                flex items-start space-x-3 border-neutral-100
                ${activeChild === child.id 
                  ? 'bg-neutral-200 text-neutral-800' // Active child styling
                  : 'hover:bg-neutral-100' // Inactive child hover styling
                }
              `}
            >
              {/* Status Indicator */}
              <div className="flex items-center mt-1 flex-shrink-0">
                <StatusIndicator status={child.status} />
              </div>
              
              {/* Child Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-xs text-sm">{child.name}</h3>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-[#8e8e8e]" />
                    {formatTime(child.lastupdated)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-medium ${
                    child.status === 'safe' ? 'text-green-600' :
                    child.status === 'warning' ? 'text-yellow-600' :
                    child.status === 'danger' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {getStatusText(child.status)}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-[#8e8e8e]" />
                  <span className="truncate">{child.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Child Button */}
      <div className="p-2 border-t border-neutral-200 border-border">
        <button 
          onClick={handleAddChildrenClick} 
          className="w-full flex items-center justify-center space-x-2 
                     bg-primary text-primary-foreground py-1.5 px-4 rounded-lg 
                     font-medium text-sm hover:bg-primary/90 transition-colors duration-200 hover:bg-neutral-100 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Child</span>
        </button>
      </div>

      {/* Popup for Add Child with Code */}
      {showPopup && (
        <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full relative">
            <button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-neutral-400 hover:text-gray-100 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-semibold mb-4 text-gray-100">Add Child</h3>
            
            {/* Display error messages */}
            {popupError && <p className="text-red-500 text-sm mb-4">{popupError}</p>}
            {rateLimitMessage && <p className="text-yellow-400 text-sm mb-4">{rateLimitMessage}</p>}

            {/* Name Input Field */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Child's Name"
                value={childNameInput}
                onChange={(e) => setChildNameInput(e.target.value)}
                className="w-full p-2 bg-neutral-600 text-neutral-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                // Disable input if code section is shown or code is being generated
                disabled={showCodeSection || isGeneratingCode} 
              />
            </div>

            {/* Show Code Button (conditionally rendered) */}
            {!showCodeSection && (
              <button
                onClick={handleShowCode}
                className={`w-full bg-green-600 text-white p-2 rounded transition duration-200 ease-in-out
                          ${isGeneratingCode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                // Disable button if code is being generated or rate limit is hit
                disabled={isGeneratingCode || requestCountRef.current >= RATE_LIMIT_MAX} 
              >
                {isGeneratingCode ? 'Generating Code...' : 'Show Code'}
              </button>
            )}

            {/* Code Display Section (conditionally rendered) */}
            {showCodeSection && (
              <>
                <p className="text-gray-300 mb-6 mt-4">Share this code with your child's device:</p>
                <div className="bg-gray-600 text-green-400 text-3xl font-bold py-4 px-6 rounded-lg mb-4 select-all break-all">
                  {generatedCode}
                </div>
                <p className="text-red-400 text-sm italic">
                  This code is valid for the next 4 minutes.
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {expiryMessage}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { mockChildren };
export default ChildrenSidebar;
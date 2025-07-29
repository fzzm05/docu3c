// ParentDashboard.jsx

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import ChildrenSidebar from '@/components/ChildrenSidebar';
import LiveMap from '@/components/LiveMap';
import SafetyAlerts from '@/components/SafetyAlerts';
import { useAuth } from '../context/AuthContext';
import Settings from '../components/Settings';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [activeChild, setActiveChild] = useState(null);
  const [childData, setChildData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  useEffect(() => {
    console.log('ParentDashboard: activeChild changed to', activeChild);
    // *** ADDED/MODIFIED LOG HERE ***
    console.log('ParentDashboard: childData (before clear on activeChild change):', childData);
    setChildData(null); // Clear childData for the new child
  }, [activeChild]);

  // *** ADDED LOG HERE to see childData updates from LiveMap ***
  useEffect(() => {
    console.log('ParentDashboard: childData updated by LiveMap to:', childData);
    if (childData && childData.coordinates) {
        console.log('ParentDashboard: childData coordinates - Lat:', childData.coordinates.lat, 'Lng:', childData.coordinates.lng);
    }
  }, [childData]);


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onSettingsClick={openSettings} />

      {showSettings && (
        <div
          onClick={closeSettings}
          className="fixed inset-0 z-50 bg-opacity-30 flex items-center justify-center"
        >
          <div
            className="bg-white rounded-xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSettings}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            <Settings onClose={closeSettings} />
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        <ChildrenSidebar activeChild={activeChild} onChildSelect={setActiveChild} />
        <LiveMap activeChild={activeChild} setParentChildData={setChildData} />
        <SafetyAlerts
          activeChild={activeChild}
          currentLatitude={childData?.coordinates?.lat || null}
          currentLongitude={childData?.coordinates?.lng || null}
        />
      </div>
    </div>
  );
};

export default ParentDashboard;
import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import ChildrenSidebar from '@/components/ChildrenSidebar';
import LiveMap from '@/components/LiveMap';
import SafetyAlerts from '@/components/SafetyAlerts';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const ParentDashboard = () => {
  const { user } = useAuth();
  const [activeChild, setActiveChild] = useState(null);
  const [childData, setChildData] = useState(null);
  const [loadingChildData, setLoadingChildData] = useState(false);
  const [childDataError, setChildDataError] = useState(null);

  // Log when activeChild changes
  useEffect(() => {
    console.log('ParentDashboard: activeChild changed to', activeChild);
  }, [activeChild]);

  // Fetch live location data
  useEffect(() => {
    let intervalId;
    const fetchLiveLocation = async () => {
      if (!activeChild || !user?.id) {
        console.log('ParentDashboard: No activeChild or user.id, clearing childData');
        setChildData(null);
        setLoadingChildData(false);
        setChildDataError(null);
        return;
      }

      setLoadingChildData(true);
      setChildDataError(null);
      console.log('ParentDashboard: Fetching location for childId:', activeChild, 'parentId:', user.id);
      try {
        const url = new URL(`${API_URL}/location/child/location`);
        url.searchParams.append('childId', activeChild);
        url.searchParams.append('parentId', user.id);

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
          throw new Error(errorData.error || errorData.message || `Failed to fetch live location with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('ParentDashboard: Fetched location data:', data);
        setChildData(data.locationData);
      } catch (err) {
        console.error('ParentDashboard: Error fetching live location:', err);
        setChildDataError(`Failed to load live location: ${err.message}`);
      } finally {
        setLoadingChildData(false);
      }
    };

    fetchLiveLocation();
    intervalId = setInterval(fetchLiveLocation, 10000);

    return () => clearInterval(intervalId);
  }, [activeChild, user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <ChildrenSidebar activeChild={activeChild} onChildSelect={setActiveChild} />
        <LiveMap activeChild={activeChild} />
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
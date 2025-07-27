import React from 'react';
import { createBrowserRouter, replace, RouterProvider, Navigate } from 'react-router-dom';
import LocationTracker from './pages/LocationTracker'; // Assuming you have this component
import ParentDashboard from './pages/ParentDashboard';
import Login from './pages/Login'; // Assuming you have this component
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute'; // Assuming you have this component
import Signup from './pages/Signup'; // Assuming you have this component

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/parent-dashboard" replace/>
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup /> // Assuming you have this component
  },
  {
    path: '/location',
    element: <LocationTracker />
  },
  {
    path: '/parent-dashboard',
    element: 
      <ProtectedRoute>
        <ParentDashboard />
      </ProtectedRoute>
  }
]);

function App() {
  return (
    <AuthProvider>
      <div className='min-h-screen'>
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;

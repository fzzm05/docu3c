import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to handle user registration (signup)
  const register = async (email, password, name) => { // Added 'name' parameter
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }), // Added 'name' to body
        credentials: "include", // Important for sending/receiving cookies
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user); // Automatically log in the user after successful registration
        return data.user; // Return user data for successful signup
      } else {
        throw new Error(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      throw error; // Re-throw to be caught by Signup.jsx
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for sending/receiving cookies
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        setUser(data.user);
        return data.user; // Return user data for successful login
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw error; // Re-throw to be caught by Login.jsx
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setUser(null);
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/auth/check-auth`, {
          credentials: "include",
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user);
        }
      } catch (error) {
          console.error("Error checking auth:", error);
          setUser(null); // Reset user state if there's an error
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

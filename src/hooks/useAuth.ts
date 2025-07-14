import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Mock user data for demonstration
const mockUser: User = {
  id: "1",
  name: "Bro Fitness",
  email: "bro@brofit.com",
  avatar: "💪",
  level: 15,
  xp: 2450,
  streak: 12
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (in a real app, this would check localStorage/cookies)
    const savedUser = localStorage.getItem("brofit_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Mock login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would make an API call
    if (email && password) {
      const loggedInUser = { ...mockUser, email };
      setUser(loggedInUser);
      localStorage.setItem("brofit_user", JSON.stringify(loggedInUser));
    }
    
    setLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    
    // Mock signup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would make an API call
    if (name && email && password) {
      const newUser = { 
        ...mockUser, 
        name, 
        email, 
        level: 1, 
        xp: 0, 
        streak: 0 
      };
      setUser(newUser);
      localStorage.setItem("brofit_user", JSON.stringify(newUser));
    }
    
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("brofit_user");
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading
  };
};
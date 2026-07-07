import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { useNotifications } from './NotificationsContext';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ redirectUrl?: string }>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface SignupData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: 'individual' | 'enterprise';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get contexts - these will be undefined if not wrapped in their providers
  let notificationsContext;
  try {
    notificationsContext = useNotifications();
  } catch {
    // NotificationsProvider not available, continue without notifications
    notificationsContext = null;
  }
  
  // Removed applicationsContext as startup creation is now handled by ProfileWizard

  useEffect(() => {
    console.log('AuthContext useEffect running');
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    console.log('Saved user:', savedUser);
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('Restored user session:', userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ redirectUrl?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login(email, password);
      const userData: User = {
        id: response.user._id,
        fullName: response.user.fullName,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        profileComplete: response.user.profileComplete,
        createdAt: response.user.createdAt,
      };
      
      setUser(userData);
      
      // Create notification for admin when new user logs in
      if (notificationsContext && userData.role !== 'admin') {
        notificationsContext.createSignupNotification(
          userData.fullName,
          userData.email,
          userData.role
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
    setIsLoading(false);
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.signup(data);
      const userData: User = {
        id: response.user._id,
        fullName: response.user.fullName,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        profileComplete: response.user.profileComplete,
        createdAt: response.user.createdAt,
      };
      
      setUser(userData);
      
      // Create notification for admin when new user signs up
      if (notificationsContext) {
        notificationsContext.createSignupNotification(
          data.fullName,
          data.email,
          data.role
        );
      }
      
      // Create application for enterprise users (startups)
      if (data.role === 'enterprise' && applicationsContext) {
        // Generate a random TRL level between 1-9
        const trlLevel = Math.floor(Math.random() * 9) + 1;
        
        // Determine application type based on TRL level
        const type = trlLevel <= 5 ? 'incubation' : 'innovation';
        
        // Generate a startup name if not provided
        const startupName = data.fullName.includes(' ') 
          ? `${data.fullName.split(' ')[0]}'s Startup`
          : `${data.fullName}'s Startup`;
        
        // Generate a sector based on email domain or random
        const sectors = ['CleanTech', 'HealthTech', 'EdTech', 'FinTech', 'AgriTech', 'AI/ML', 'IoT', 'Blockchain'];
        const sector = sectors[Math.floor(Math.random() * sectors.length)];
        
        applicationsContext.addApplication({
          name: startupName,
          founder: data.fullName,
          sector: sector,
          type: type,
          trlLevel: trlLevel,
          email: data.email,
          submissionDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update localStorage
      const savedData = localStorage.getItem('user');
      if (savedData) {
        const currentData = JSON.parse(savedData);
        localStorage.setItem('user', JSON.stringify({
          ...currentData,
          ...updates
        }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
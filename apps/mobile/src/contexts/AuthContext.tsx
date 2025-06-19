import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    autoDownload: boolean;
    notifications: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<{ success: boolean; error?: string }>;
  
  // Biometric authentication
  isBiometricAvailable: boolean;
  enableBiometric: () => Promise<{ success: boolean; error?: string }>;
  disableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<{ success: boolean; error?: string }>;
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
} as const;

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    token: null,
  });
  
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
    loadStoredAuth();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, rememberMe] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME),
      ]);

      if (storedToken && storedUser && rememberMe === 'true') {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
          token: storedToken,
        });
        
        // Validate token with backend
        await validateToken(storedToken);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const validateToken = async (token: string): Promise<void> => {
    try {
      // In a real app, this would make an API call to validate the token
      // const response = await fetch('/api/auth/validate', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Token validation failed');
      // }
      
      // For demo purposes, we'll just simulate validation
      console.log('Token validated successfully');
    } catch (error) {
      console.error('Token validation failed:', error);
      await logout();
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // In a real app, this would make an API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Login failed');
      // }
      // 
      // const { user, token, refreshToken } = await response.json();
      
      // Mock successful login for demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: 'John Doe',
        role: 'user',
        preferences: {
          theme: 'system',
          fontSize: 18,
          autoDownload: false,
          notifications: true,
        },
      };
      
      const mockToken = 'mock_jwt_token_' + Date.now();
      const mockRefreshToken = 'mock_refresh_token_' + Date.now();
      
      // Store auth data
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, mockToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, mockRefreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser)),
        AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, credentials.rememberMe ? 'true' : 'false'),
      ]);
      
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        token: mockToken,
      });
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Validate passwords match
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // In a real app, this would make an API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials),
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Registration failed');
      // }
      // 
      // const { user, token, refreshToken } = await response.json();
      
      // Mock successful registration for demo
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: credentials.name,
        role: 'user',
        preferences: {
          theme: 'system',
          fontSize: 18,
          autoDownload: false,
          notifications: true,
        },
      };
      
      const mockToken = 'mock_jwt_token_' + Date.now();
      const mockRefreshToken = 'mock_refresh_token_' + Date.now();
      
      // Store auth data
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, mockToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, mockRefreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser)),
        AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true'),
      ]);
      
      setAuthState({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        token: mockToken,
      });
      
      return { success: true };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // In a real app, this would make an API call to invalidate the token
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${authState.token}` }
      // });
      
      // Clear stored auth data
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME),
      ]);
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        token: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        token: null,
      });
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // In a real app, this would make an API call
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Failed to send reset email');
      // }
      
      // Mock successful request for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send reset email' 
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // In a real app, this would make an API call
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, newPassword }),
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Failed to reset password');
      // }
      
      // Mock successful reset for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reset password' 
      };
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      // In a real app, this would make an API call
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${authState.token}`
      //   },
      //   body: JSON.stringify(updates),
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Failed to update profile');
      // }
      // 
      // const updatedUser = await response.json();
      
      // Mock successful update for demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...authState.user, ...updates };
      
      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  };

  const refreshToken = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedRefreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      // In a real app, this would make an API call
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refreshToken: storedRefreshToken }),
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Token refresh failed');
      // }
      // 
      // const { token, refreshToken: newRefreshToken } = await response.json();
      
      // Mock successful refresh for demo
      const newToken = 'mock_jwt_token_' + Date.now();
      const newRefreshToken = 'mock_refresh_token_' + Date.now();
      
      // Store new tokens
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, newToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
      ]);
      
      setAuthState(prev => ({
        ...prev,
        token: newToken,
      }));
      
      return { success: true };
    } catch (error) {
      // If refresh fails, logout the user
      await logout();
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  };

  const enableBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isBiometricAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        return { success: true };
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to enable biometric authentication' 
      };
    }
  };

  const disableBiometric = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  };

  const authenticateWithBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const isBiometricEnabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      
      if (!isBiometricEnabled || !isBiometricAvailable) {
        throw new Error('Biometric authentication is not enabled');
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        return { success: true };
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Biometric authentication failed' 
      };
    }
  };

  const contextValue: AuthContextType = {
    // State
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    token: authState.token,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshToken,
    
    // Biometric authentication
    isBiometricAvailable,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
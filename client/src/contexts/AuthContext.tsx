import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => void;
  register?: (userData: any) => Promise<void>;
  logout: () => void;
  checkoutRedirectUrl: string | null;
  setCheckoutRedirectUrl: (url: string | null) => void;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAdmin: false,
  isAuthenticated: false,
  login: () => {},
  register: async () => {},
  logout: () => {},
  checkoutRedirectUrl: null,
  setCheckoutRedirectUrl: () => {},
  getAuthToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Try to get user from localStorage on initial load
  const getUserFromStorage = (): User | null => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
      }
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [checkoutRedirectUrl, setCheckoutRedirectUrl] = useState<string | null>(
    localStorage.getItem('checkoutRedirectUrl')
  );

  // Login function to store user in state and localStorage
  const login = (userData: User, token?: string) => {
    console.log('AuthContext: Logging in user:', userData);
    console.log('AuthContext: Token provided:', !!token);

    // Store user data
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // Store token if provided
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('AuthContext: Token stored in localStorage');
      console.log('AuthContext: Token length:', token.length);

      // Verify token was stored correctly
      const storedToken = localStorage.getItem('authToken');
      console.log('AuthContext: Token verification - stored correctly:', storedToken === token);
    } else {
      console.log('AuthContext: No token provided to login function');
    }

    setError(null);
    setIsLoading(false);
  };

  // Register function
  const register = async (userData: any): Promise<void> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      if (data.user) {
        login(data.user, data.token);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function to clear user from state and localStorage
  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setCheckoutRedirectUrl(null);
    localStorage.removeItem('checkoutRedirectUrl');
    setError(null);
  };

  // Function to get authentication token for API requests
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Check if we have a stored token
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // Verify if token is still valid by checking expiration
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            return storedToken;
          }
        } catch (e) {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
        }
      }

      // If no valid token, try to get a new one using current session
      if (user) {
        // We need to get credentials from somewhere - this is a limitation
        // For now, we'll use a different approach
        console.log('Need to implement token refresh mechanism');
        return null;
      }

      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Save checkout redirect URL to localStorage when it changes
  useEffect(() => {
    if (checkoutRedirectUrl) {
      localStorage.setItem('checkoutRedirectUrl', checkoutRedirectUrl);
    } else {
      localStorage.removeItem('checkoutRedirectUrl');
    }
  }, [checkoutRedirectUrl]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('AuthContext: Checking authentication status...');

        // First check if we have a stored token
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            // Verify token is still valid
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
              // Token is still valid, verify with server
              const userData = JSON.parse(storedUser);
              console.log('AuthContext: Token valid, verifying with server for user:', userData.username);

              try {
                console.log('AuthContext: Making request to /api/auth/me with token');
                const response = await fetch('/api/auth/me', {
                  headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  },
                  credentials: 'include'
                });

                console.log('AuthContext: /api/auth/me response status:', response.status);

                if (response.ok) {
                  const data = await response.json();
                  if (data.user) {
                    console.log('AuthContext: Server confirmed authentication for:', data.user.username);
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setIsLoading(false);
                    return;
                  }
                } else {
                  console.log('AuthContext: /api/auth/me failed with status:', response.status);
                  // Token might be invalid, remove it
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                }

                // If server verification failed, clear stored data
                console.log('AuthContext: Server verification failed, clearing stored data');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
              } catch (serverError) {
                console.log('AuthContext: Server verification error, clearing stored data');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
              }
            } else {
              console.log('AuthContext: Stored token expired, clearing...');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
            }
          } catch (e) {
            console.log('AuthContext: Invalid stored token, clearing...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }

        // If no valid token, user is not authenticated
        console.log('AuthContext: No valid authentication found');
      } catch (err) {
        console.error('AuthContext: Error fetching user:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAdmin,
        isAuthenticated,
        login,
        register,
        logout,
        checkoutRedirectUrl,
        setCheckoutRedirectUrl,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

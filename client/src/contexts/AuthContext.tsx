import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkoutRedirectUrl: string | null;
  setCheckoutRedirectUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAdmin: false,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  checkoutRedirectUrl: null,
  setCheckoutRedirectUrl: () => {},
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
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout function to clear user from state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            login(data.user);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching user:', err);
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
        logout,
        checkoutRedirectUrl,
        setCheckoutRedirectUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

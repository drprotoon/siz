import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar usuário atual
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
      }
    },
    retry: false
  });
  
  useEffect(() => {
    setIsLoading(isUserLoading);
  }, [isUserLoading]);
  
  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no login');
      }
      
      // Atualizar o cache do usuário
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no logout');
      }
      
      // Limpar o cache do usuário
      queryClient.setQueryData(['auth-user'], null);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Registro
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no registro');
      }
      
      // Atualizar o cache do usuário
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Interface para os dados do usuário
 */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  role: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  district?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface para o endereço do usuário
 */
export interface UserAddress {
  postalCode: string;
  street: string;
  number?: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  country?: string;
}

/**
 * Hook para buscar e gerenciar os dados do perfil do usuário
 */
export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();

  // Buscar perfil do usuário
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<UserProfile>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;

      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/profile`);
        const data = await response.json();

        // Garantir que sempre retornamos um objeto válido
        if (!data) {
          console.warn('Perfil do usuário não encontrado, retornando objeto vazio');
          return {
            id: user.id,
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'user',
            createdAt: new Date().toISOString()
          } as UserProfile;
        }

        return data;
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Retornar um objeto básico em vez de lançar erro
        return {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'user',
          createdAt: new Date().toISOString()
        } as UserProfile;
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para atualizar o perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const response = await apiRequest('PUT', `/api/users/${user.id}/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar a query do perfil para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });

      // Invalidar também os dados de endereço
      queryClient.invalidateQueries({ queryKey: ['user-address', user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    refetch,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
}

/**
 * Hook para buscar e gerenciar o endereço do usuário
 */
export function useUserAddress() {
  const { user, isAuthenticated } = useAuth();

  // Buscar endereço do usuário
  const {
    data: address,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<UserAddress>({
    queryKey: ['user-address', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;

      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/address`);
        const data = await response.json();

        // Garantir que sempre retornamos um objeto válido, mesmo que vazio
        if (!data) {
          return {
            postalCode: '',
            street: '',
            district: '',
            city: '',
            state: '',
            country: 'Brasil'
          };
        }

        return data;
      } catch (error) {
        console.error('Erro ao buscar endereço do usuário:', error);
        // Retornar um objeto vazio em vez de null
        return {
          postalCode: '',
          street: '',
          district: '',
          city: '',
          state: '',
          country: 'Brasil'
        };
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Mutation para atualizar o endereço
  const updateAddressMutation = useMutation({
    mutationFn: async (data: UserAddress) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const response = await apiRequest('POST', `/api/users/${user.id}/address`, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar a query do endereço para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['user-address', user?.id] });

      // Invalidar também o perfil, pois ele contém dados de endereço
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
  });

  return {
    address,
    isLoading,
    isError,
    error,
    refetch,
    updateAddress: updateAddressMutation.mutate,
    isUpdating: updateAddressMutation.isPending,
    updateError: updateAddressMutation.error,
  };
}

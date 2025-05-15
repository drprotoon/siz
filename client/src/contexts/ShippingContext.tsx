import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { FrenetShippingService } from '@/lib/frenetService';

interface ShippingContextType {
  selectedShipping: FrenetShippingService | null;
  setSelectedShipping: (shipping: FrenetShippingService | null) => void;
  shippingOptions: FrenetShippingService[];
  setShippingOptions: (options: FrenetShippingService[]) => void;
  clearShipping: () => void;
}

const ShippingContext = createContext<ShippingContextType>({
  selectedShipping: null,
  setSelectedShipping: () => {},
  shippingOptions: [],
  setShippingOptions: () => {},
  clearShipping: () => {},
});

export const useShipping = () => useContext(ShippingContext);

interface ShippingProviderProps {
  children: ReactNode;
}

export const ShippingProvider: React.FC<ShippingProviderProps> = ({ children }) => {
  // Estado para armazenar o frete selecionado
  const [selectedShipping, setSelectedShipping] = useState<FrenetShippingService | null>(null);

  // Estado para armazenar as opções de frete disponíveis
  const [shippingOptions, setShippingOptions] = useState<FrenetShippingService[]>([]);

  // Função para limpar o frete selecionado
  const clearShipping = () => {
    setSelectedShipping(null);
    setShippingOptions([]);
  };

  // Tentar carregar o frete do localStorage na inicialização (para compatibilidade)
  useEffect(() => {
    try {
      const savedShipping = localStorage.getItem('selectedShipping');
      if (savedShipping) {
        const parsedShipping = JSON.parse(savedShipping) as FrenetShippingService;
        if (parsedShipping && parsedShipping.ServiceCode && parsedShipping.ShippingPrice) {
          setSelectedShipping(parsedShipping);
          console.log('Frete carregado do localStorage para o contexto:', parsedShipping);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar opção de frete do localStorage:', error);
    }
  }, []);

  return (
    <ShippingContext.Provider
      value={{
        selectedShipping,
        setSelectedShipping,
        shippingOptions,
        setShippingOptions,
        clearShipping,
      }}
    >
      {children}
    </ShippingContext.Provider>
  );
};

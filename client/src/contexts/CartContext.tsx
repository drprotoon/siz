import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Definir a interface para os itens do carrinho
export interface CartProduct {
  id: number;
  name: string;
  price: string | number;
  images: string[];
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  sku?: string;
  quantity?: number;
}

export interface CartItem {
  id: string; // Usando string para IDs gerados localmente
  productId: number;
  quantity: number;
  product: CartProduct;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartProduct, quantity: number) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isLoading: boolean;
  subtotal: number;
  buyNow: (product: CartProduct, quantity: number) => void;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  updateCartItemQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isLoading: false,
  subtotal: 0,
  buyNow: () => {},
});

export const useCart = () => useContext(CartContext);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Calcular o subtotal do carrinho
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
    0
  );

  // Gerar um ID único para o item do carrinho
  const generateCartItemId = (productId: number): string => {
    return `cart_${productId}_${Date.now()}`;
  };

  // Carregar o carrinho (do servidor se autenticado, senão do localStorage)
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (isAuthenticated && user) {
          // Se autenticado, carregar do servidor
          console.log('Usuário autenticado, carregando carrinho do servidor...');
          try {
            const response = await apiRequest('GET', '/api/cart');
            if (response.ok) {
              const serverCartItems = await response.json();
              console.log('Carrinho carregado do servidor:', serverCartItems);

              // Converter formato do servidor para formato do contexto
              const convertedItems: CartItem[] = serverCartItems.map((item: any) => ({
                id: item.id.toString(),
                productId: item.productId,
                quantity: item.quantity,
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  images: item.product.images || [],
                  weight: item.product.weight,
                  height: item.product.height,
                  width: item.product.width,
                  length: item.product.length,
                  sku: item.product.sku
                }
              }));

              setCartItems(convertedItems);
            } else {
              console.log('Erro ao carregar carrinho do servidor, usando localStorage');
              loadFromLocalStorage();
            }
          } catch (error) {
            console.error('Erro ao carregar carrinho do servidor:', error);
            loadFromLocalStorage();
          }
        } else {
          // Se não autenticado, carregar do localStorage
          loadFromLocalStorage();
        }
      } finally {
        setIsLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart) as CartItem[];
          setCartItems(parsedCart);
          console.log('Carrinho carregado do localStorage:', parsedCart);
        } else {
          console.log('Nenhum carrinho encontrado no localStorage');
          setCartItems([]);
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
        setCartItems([]);
      }
    };

    loadCart();
  }, [isAuthenticated, user]);

  // Salvar o carrinho no localStorage apenas se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      console.log('Carrinho salvo no localStorage:', cartItems);
    }
  }, [cartItems, isLoading, isAuthenticated]);

  // Adicionar um produto ao carrinho
  const addToCart = (product: CartProduct, quantity: number) => {
    setCartItems(prevItems => {
      // Verificar se o produto já existe no carrinho
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);

      if (existingItemIndex >= 0) {
        // Atualizar a quantidade se o produto já existir
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;

        toast({
          title: "Quantidade atualizada",
          description: `${product.name} agora tem ${updatedItems[existingItemIndex].quantity} unidades no carrinho.`,
          variant: "default",
        });

        return updatedItems;
      } else {
        // Adicionar novo item se o produto não existir
        const newItem: CartItem = {
          id: generateCartItemId(product.id),
          productId: product.id,
          quantity,
          product: {
            ...product,
            quantity: undefined // Não armazenar a quantidade do produto no item do carrinho
          }
        };

        toast({
          title: "Adicionado ao carrinho",
          description: `${product.name} foi adicionado ao seu carrinho.`,
          variant: "default",
        });

        return [...prevItems, newItem];
      }
    });
  };

  // Atualizar a quantidade de um item no carrinho
  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Remover um item do carrinho
  const removeFromCart = (id: string) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === id);
      if (itemToRemove) {
        toast({
          title: "Item removido",
          description: `${itemToRemove.product.name} foi removido do seu carrinho.`,
          variant: "default",
        });
      }
      return prevItems.filter(item => item.id !== id);
    });
  };

  // Limpar o carrinho
  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do seu carrinho.",
      variant: "default",
    });
  };

  // Função para compra direta (sem adicionar ao carrinho)
  const buyNow = (product: CartProduct, quantity: number) => {
    // Limpar o carrinho atual
    setCartItems([]);

    // Adicionar apenas o produto atual ao carrinho
    const newItem: CartItem = {
      id: generateCartItemId(product.id),
      productId: product.id,
      quantity,
      product: {
        ...product,
        quantity: undefined // Não armazenar a quantidade do produto no item do carrinho
      }
    };

    setCartItems([newItem]);

    toast({
      title: "Compra direta",
      description: `Você será redirecionado para finalizar a compra de ${product.name}.`,
      variant: "default",
    });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        isLoading,
        subtotal,
        buyNow
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

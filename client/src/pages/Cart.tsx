import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import ShippingCalculator from "@/components/ShippingCalculator";
// Frenet integrado ao freight-client
import { useShipping } from "@/contexts/ShippingContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Cart() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { selectedShipping, setSelectedShipping } = useShipping();
  const { isAuthenticated } = useAuth();

  // Usar o contexto do carrinho em vez de fazer requisições ao servidor
  const {
    cartItems,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    isLoading,
    subtotal
  } = useCart();

  // CEP do vendedor (loja) - Deve ser configurado de acordo com o endereço da loja
  const SELLER_CEP = "74591-990"; // Exemplo: CEP da Av. Paulista em São Paulo

  // Handle quantity change
  const handleQuantityChange = (id: string, quantity: number) => {
    updateCartItemQuantity(id, quantity);
  };

  // Handle remove item
  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  // Handle clear cart
  const handleClearCart = () => {
    clearCart();
  };

  // Usar o subtotal do contexto do carrinho
  const calculateSubtotal = () => {
    return subtotal;
  };

  // Shipping cost from Frenet calculation or default value
  const shippingCost = selectedShipping ? selectedShipping.ShippingPrice : 0;

  // Calculate total
  const total = calculateSubtotal() + shippingCost;

  // Handle shipping selection
  const handleSelectShipping = (shipping: FrenetShippingService) => {
    // Salvar a opção de frete selecionada no contexto
    setSelectedShipping(shipping);

    // Mostrar toast de confirmação
    toast({
      title: "Frete selecionado",
      description: `${shipping.Carrier} - ${shipping.ServiceDescription} por ${formatCurrency(shipping.ShippingPrice)}`,
      variant: "default",
    });
  };

  // Mesmo se não estiver autenticado, mostramos o carrinho
  // Os produtos são armazenados no localStorage e serão associados à conta quando o usuário fizer login

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center border-b pb-4">
              <Skeleton className="h-24 w-24 rounded-md mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-16 ml-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Não precisamos mais do estado de erro, pois estamos usando localStorage

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Seu Carrinho está Vazio</h1>
        <p className="text-gray-600 mb-8">Parece que você ainda não adicionou nenhum produto ao seu carrinho.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-pink-600 text-white">
            Continuar Comprando
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-6">Seu Carrinho de Compras</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                      <div>
                        <Link href={`/product/${item.product.slug || ''}`} className="font-medium hover:text-primary">
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500">{item.product.category?.name || "Sem categoria"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(parseFloat(item.product.price))}</TableCell>
                  <TableCell>
                    <QuantitySelector
                      initialValue={item.quantity}
                      min={1}
                      max={item.product.quantity}
                      onChange={(value) => handleQuantityChange(item.id, value)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parseFloat(item.product.price) * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Continuar Comprando
            </Button>
            <Button
              variant="outline"
              onClick={handleClearCart}
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              Limpar Carrinho
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Resumo do Pedido</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium">
                  {selectedShipping
                    ? formatCurrency(selectedShipping.ShippingPrice)
                    : "Calcule abaixo"}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Shipping Calculator */}
            <ShippingCalculator
              onSelectShipping={handleSelectShipping}
              sellerCEP={SELLER_CEP}
            />

            {isAuthenticated ? (
              <Button
                className="w-full bg-primary hover:bg-pink-600 text-white flex items-center justify-center"
                onClick={() => {
                  // Redirecionar para o checkout sem verificar frete
                  navigate('/checkout');
                }}
              >
                <span className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Finalizar Compra
                </span>
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-md border border-blue-100">
                  Faça login ou crie uma conta para finalizar sua compra
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="bg-primary hover:bg-pink-600 text-white rounded-md py-2 px-4 text-center">
                    Entrar
                  </Link>
                  <Link href="/register" className="bg-gray-800 hover:bg-gray-700 text-white rounded-md py-2 px-4 text-center">
                    Criar Conta
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500 text-center">
              <p>Pagamento seguro com criptografia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

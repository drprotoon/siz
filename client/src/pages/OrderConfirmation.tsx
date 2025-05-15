import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Truck, MapPin, Package, ArrowRight, Loader2, AlertTriangle, Home } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrderConfirmationPage() {
  const [, params] = useLocation().match(/\/order-confirmation\/(\d+)/) || [];
  const orderId = params ? parseInt(params) : null;
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Buscar detalhes do pedido
  const { data: order, isLoading, isError } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      if (!orderId) return null;
      
      try {
        const response = await apiRequest('GET', `/api/orders/${orderId}`);
        return response.json();
      } catch (error) {
        console.error('Erro ao buscar detalhes do pedido:', error);
        throw error;
      }
    },
    enabled: !!orderId && isAuthenticated
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando detalhes do pedido...</span>
      </div>
    );
  }
  
  // Error state
  if (isError || !order) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
        <p className="text-gray-600 mb-8">Não foi possível encontrar os detalhes deste pedido.</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate('/orders')}>
            Meus Pedidos
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Voltar para a Loja
          </Button>
        </div>
      </div>
    );
  }
  
  // Calcular totais
  const subtotal = order.items.reduce((sum: number, item: any) => (
    sum + (parseFloat(item.price) * item.quantity)
  ), 0);
  
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
        <p className="text-xl text-gray-600">
          Seu pedido #{order.id} foi recebido e está sendo processado.
        </p>
        <p className="text-gray-500 mt-2">
          Data do pedido: {formatDate(new Date(order.createdAt))}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-primary" />
              Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Número do Pedido: #{order.id}</p>
            <p className="text-gray-500">Status: {order.status}</p>
            <p className="text-gray-500">Data: {formatDate(new Date(order.createdAt))}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5 text-primary" />
              Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.shippingMethod.carrier} - {order.shippingMethod.service}</p>
            <p className="text-gray-500">Prazo: até {order.shippingMethod.estimatedDelivery} dias úteis</p>
            <p className="text-gray-500">Valor: {formatCurrency(order.shippingMethod.price)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{order.shippingAddress.street}, {order.shippingAddress.number}</p>
            {order.shippingAddress.complement && (
              <p>{order.shippingAddress.complement}</p>
            )}
            <p>{order.shippingAddress.district}</p>
            <p>{order.shippingAddress.city} - {order.shippingAddress.state}</p>
            <p>CEP: {order.shippingAddress.postalCode}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>
            Detalhes dos produtos que você comprou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  {item.product && item.product.images && item.product.images[0] ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {item.product ? item.product.name : `Produto #${item.productId}`}
                    </p>
                    <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    <p className="text-sm text-gray-500">Preço unitário: {formatCurrency(parseFloat(item.price))}</p>
                  </div>
                </div>
                <p className="font-medium">
                  {formatCurrency(parseFloat(item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frete</span>
              <span>{formatCurrency(order.shippingMethod.price)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-xl">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Ver Todos os Pedidos
          </Button>
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Continuar Comprando
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Enviamos um e-mail de confirmação para o seu endereço de e-mail cadastrado.
        </p>
        <p className="text-gray-600">
          Dúvidas? Entre em contato com nosso <Link href="/contact"><a className="text-primary hover:underline">atendimento ao cliente</a></Link>.
        </p>
      </div>
    </div>
  );
}

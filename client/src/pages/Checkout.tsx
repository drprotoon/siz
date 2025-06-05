import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Truck, MapPin, ShoppingBag, ArrowLeft, Check, Clock, AlertTriangle } from 'lucide-react';
import AddressForm from '@/components/AddressForm';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/utils';
import { processPayment } from '@/lib/paymentService';
import { useUserAddress } from '@/hooks/use-user-data';
import { useShipping } from '@/contexts/ShippingContext';
import { useCart } from '@/contexts/CartContext';
// Frenet integrado ao freight-client

// Não precisamos mais definir a interface FrenetShippingService aqui, pois estamos importando do frenetService.ts

// Não precisamos mais definir a interface CartItem aqui, pois estamos importando do CartContext



export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('shipping');
  const { selectedShipping, setSelectedShipping } = useShipping() as {
    selectedShipping: FrenetShippingService | null,
    setSelectedShipping: (shipping: FrenetShippingService | null) => void
  };
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit_card');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // CEP do vendedor (loja) - Deve ser configurado de acordo com o endereço da loja
  const SELLER_CEP = "74591-990"; // Exemplo: CEP da Av. Paulista em São Paulo

  // Redirecionar para login se não estiver autenticado, mas salvar a URL atual
  useEffect(() => {
    if (!isAuthenticated) {
      // Salvar a URL atual para redirecionamento após o login
      const { setCheckoutRedirectUrl } = useAuth();
      setCheckoutRedirectUrl('/checkout');

      toast({
        title: 'Autenticação necessária',
        description: 'Você precisa estar logado para acessar o checkout.',
        variant: 'default'
      });
      navigate('/login');
    }
  }, [isAuthenticated, navigate, toast]);

  // Usar o contexto do carrinho em vez de fazer requisições ao servidor
  const { cartItems, isLoading: isCartLoading, subtotal: cartSubtotal, clearCart } = useCart();
  const { clearShipping } = useShipping();
  const isCartError = false; // Não temos mais erro de carregamento do carrinho

  // Usar o hook personalizado para buscar o endereço do usuário
  const { address: addressData, isLoading: isAddressLoading } = useUserAddress();

  // Não avançamos automaticamente para a aba de pagamento
  // O usuário deve clicar no botão "Continuar para Pagamento"
  useEffect(() => {
    // Se tiver frete selecionado, apenas exibir no console
    if (selectedShipping) {
      console.log('Frete selecionado no contexto:', selectedShipping);
    }
  }, [selectedShipping]);

  // Buscar opções de frete quando o endereço estiver disponível
  const { isLoading: isShippingLoading, refetch: refetchShipping, data: shippingOptions } = useQuery<FrenetShippingService[]>({
    queryKey: ['shipping-options', addressData?.postalCode, cartItems],
    queryFn: async () => {
      if (!cartItems || cartItems.length === 0) return [];

      // Se não tiver CEP, retornar array vazio mas não impedir o checkout
      if (!addressData || !addressData.postalCode) {
        console.log('Endereço ou CEP não disponível, continuando sem calcular frete');
        return [];
      }

      // Verificar se o CEP tem 8 dígitos
      const cep = addressData.postalCode.replace(/\D/g, '');
      if (cep.length !== 8) {
        console.log('CEP inválido, deve ter 8 dígitos:', cep);
        return [];
      }

      // Forçar o cálculo de frete mesmo que já tenha sido calculado antes
      console.log('Calculando frete para CEP:', addressData.postalCode);

      // Preparar os itens para a cotação
      const shippingItems = cartItems.map(item => {
        // Converter o peso para número e garantir que seja um valor válido
        let weight = 0.5; // valor padrão
        if (item.product.weight) {
          // Se o peso for uma string, converter para número
          if (typeof item.product.weight === 'string') {
            weight = parseFloat((item.product.weight as string).replace(/[^\d.-]/g, ''));
          } else {
            weight = Number(item.product.weight);
          }
          // Garantir que o peso seja um número válido
          if (isNaN(weight) || weight <= 0) {
            weight = 0.5; // valor padrão se inválido
          }

          // Converter para kg se o peso for muito alto (provavelmente está em gramas)
          if (weight > 30) {
            weight = weight / 1000;
          }
        }

        // Converter outras dimensões para números
        const height = Number(item.product.height) || 10;
        const length = Number(item.product.length) || 15;
        const width = Number(item.product.width) || 15;

        return {
          Height: height,
          Length: length,
          Width: width,
          Weight: weight,
          Quantity: item.quantity,
          SKU: item.product.sku || item.product.id.toString()
        };
      });

      // Calcular o valor total do pedido
      const invoiceValue = cartItems.reduce(
        (sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity),
        0
      );

      // Preparar a requisição para a API da Frenet
      const request = {
        SellerCEP: SELLER_CEP.replace(/\D/g, ''),
        RecipientCEP: addressData.postalCode.replace(/\D/g, ''),
        ShipmentInvoiceValue: invoiceValue,
        ShippingServiceCode: null,
        ShippingItemArray: shippingItems,
        RecipientCountry: "BR"
      };

      try {
        // Log detalhado da requisição para depuração
        console.log('Enviando requisição de frete:', JSON.stringify(request));

        const response = await apiRequest('POST', '/api/freight/quote', request);
        const data = await response.json();

        // Log da resposta para depuração
        console.log('Resposta da API de frete:', data);

        // Verificar se a resposta contém uma mensagem de erro
        if (data.message) {
          console.error('Erro retornado pela API:', data.message);
          return [];
        }

        // Filtrar serviços com erro
        if (data.ShippingSevicesArray && data.ShippingSevicesArray.length > 0) {
          const validServices = data.ShippingSevicesArray.filter(
            (service: FrenetShippingService) => !service.Error && service.ShippingPrice > 0
          );

          if (validServices.length === 0) {
            console.warn('Nenhuma opção de frete válida encontrada');
          } else {
            console.log('Opções de frete válidas:', validServices.length);
          }

          // As opções de frete serão atualizadas no contexto pelo componente ShippingCalculator
          return validServices;
        }

        return [];
      } catch (error) {
        console.error('Erro ao calcular frete:', error);
        // Não exibir toast para não sobrecarregar a interface
        return [];
      }
    },
    // Permitir a consulta mesmo sem CEP, mas apenas se estiver autenticado e tiver itens no carrinho
    enabled: isAuthenticated && !!cartItems && cartItems.length > 0
  });

  // Mutation para criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/orders', orderData);
      return response.json();
    },
    onSuccess: (data) => {
      // Limpar carrinho usando o contexto
      clearCart();

      // Limpar dados de frete
      clearShipping();

      // Redirecionar para página de confirmação
      navigate(`/order-confirmation/${data.id}`);

      toast({
        title: 'Pedido realizado com sucesso!',
        description: 'Obrigado pela sua compra. Você receberá atualizações sobre o envio.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar pedido',
        description: error.message || 'Não foi possível finalizar seu pedido. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    }
  });

  // Calcular subtotal usando o contexto do carrinho
  const calculateSubtotal = () => {
    return cartSubtotal;
  };

  // Shipping cost from selected option
  const shippingCost = selectedShipping ? selectedShipping.ShippingPrice : 0;

  // Calculate total
  const total = calculateSubtotal() + shippingCost;

  // Atualizar o total quando o frete mudar
  useEffect(() => {
    if (selectedShipping) {
      console.log('Frete selecionado, atualizando total:', selectedShipping.ShippingPrice);
    }
  }, [selectedShipping]);

  // Handle shipping selection
  const handleSelectShipping = (shipping: any) => {
    // Salvar a opção de frete selecionada no contexto
    setSelectedShipping(shipping);

    // Não avançamos automaticamente para a aba de pagamento
    // O usuário deve clicar no botão "Continuar para Pagamento"

    toast({
      title: "Frete selecionado",
      description: `${shipping.Carrier} - ${shipping.ServiceDescription} por ${formatCurrency(shipping.ShippingPrice)}`,
      variant: "default",
    });
  };

  // Recalcular frete quando o endereço mudar
  useEffect(() => {
    if (addressData && addressData.postalCode && addressData.postalCode.replace(/\D/g, '').length === 8) {
      console.log('Endereço atualizado, recalculando frete...');
      // Não recalculamos automaticamente, apenas quando o usuário clicar em salvar
      // refetchShipping();

      // Não selecionamos automaticamente a primeira opção de frete
      // O usuário deve selecionar manualmente
    }
  }, [addressData]);

  // Handle address save
  const handleAddressSave = (address: any) => {
    // Não exibir toast para não sobrecarregar a interface
    console.log('Endereço salvo com sucesso:', address);

    // Verificar se temos um CEP válido para calcular o frete
    if (address && address.postalCode && address.postalCode.replace(/\D/g, '').length === 8) {
      console.log('Calculando frete para o endereço salvo');
      // Refetch shipping options with new address
      refetchShipping();
    } else {
      console.log('CEP inválido ou não fornecido, não é possível calcular o frete');
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: 'Autenticação necessária',
        description: 'Você precisa estar logado para finalizar a compra.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: 'Método de pagamento necessário',
        description: 'Por favor, selecione um método de pagamento antes de finalizar a compra.',
        variant: 'destructive'
      });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Process payment
      const paymentResult = await processPayment({
        amount: total,
        method: selectedPaymentMethod,
        currency: 'BRL'
      });

      if (paymentResult.success) {
        // Create order
        const orderItems = cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        }));

        // Preparar dados do pedido
        const orderData: any = {
          items: orderItems,
          payment: {
            method: selectedPaymentMethod,
            transactionId: paymentResult.transactionId,
            status: 'approved'
          },
          subtotal: calculateSubtotal(),
          shippingCost: selectedShipping ? selectedShipping.ShippingPrice : 0,
          total: total
        };

        // Adicionar endereço se disponível
        if (addressData) {
          orderData.shippingAddress = {
            postalCode: addressData.postalCode || '',
            street: addressData.street || '',
            number: addressData.number || '',
            complement: addressData.complement || '',
            district: addressData.district || '',
            city: addressData.city || '',
            state: addressData.state || '',
            country: addressData.country || 'Brasil'
          };
        }

        // Adicionar método de envio se disponível
        if (selectedShipping) {
          orderData.shippingMethod = {
            carrier: selectedShipping.Carrier,
            service: selectedShipping.ServiceDescription,
            price: selectedShipping.ShippingPrice,
            estimatedDelivery: selectedShipping.DeliveryTime
          };
        }

        createOrderMutation.mutate(orderData);
      } else {
        throw new Error('Falha no processamento do pagamento. Por favor, tente novamente.');
      }
    } catch (error: any) {
      toast({
        title: 'Falha na finalização da compra',
        description: error.message || 'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Loading state
  if (isCartLoading || isAddressLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  // Error state
  if (isCartError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Erro ao carregar o carrinho</h1>
        <p className="text-gray-600 mb-6">Não foi possível carregar os itens do seu carrinho. Por favor, tente novamente mais tarde.</p>
        <Button onClick={() => navigate('/cart')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o carrinho
        </Button>
      </div>
    );
  }

  // Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
        <p className="text-gray-600 mb-6">Adicione produtos ao seu carrinho antes de finalizar a compra.</p>
        <Button onClick={() => navigate('/')}>
          Continuar comprando
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shipping">
                <Truck className="mr-2 h-4 w-4" />
                Entrega
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagamento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shipping" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                  <CardDescription>
                    Confirme ou atualize seu endereço de entrega
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddressForm
                    initialAddress={addressData ? {
                      Success: true,
                      CEP: addressData.postalCode,
                      Street: addressData.street,
                      District: addressData.district,
                      City: addressData.city,
                      UF: addressData.state
                    } : undefined}
                    onSave={handleAddressSave}
                    showCard={false}
                    showSaveButton={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    Opções de Entrega (Opcional)
                  </CardTitle>
                  <CardDescription>
                    Escolha o método de entrega ou prossiga sem selecionar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mostrar opção de frete já selecionada */}
                  {selectedShipping ? (
                    <div className="mb-4">
                      <div className="border border-primary p-4 rounded-md bg-primary/5">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div className="font-medium">
                                {selectedShipping.Carrier} - {selectedShipping.ServiceDescription}
                                <div className="text-sm text-green-600 flex items-center mt-1">
                                  <Check className="h-4 w-4 mr-1" />
                                  <span>Frete selecionado</span>
                                </div>
                              </div>
                              <span className="font-bold">
                                {formatCurrency(selectedShipping.ShippingPrice)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Entrega em até {selectedShipping.DeliveryTime} dias úteis</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSelectedShipping(null);
                          localStorage.removeItem('selectedShipping');
                          refetchShipping();
                        }}
                      >
                        Alterar frete
                      </Button>
                    </div>
                  ) : addressData && addressData.postalCode ? (
                    isShippingLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Calculando opções de frete...</span>
                      </div>
                    ) : shippingOptions && shippingOptions.length > 0 ? (
                      <RadioGroup value={(selectedShipping as any)?.ServiceCode || ""}>
                        {(shippingOptions as any[]).map((service) => (
                          <div
                            key={service.ServiceCode}
                            className={`border p-4 rounded-md mb-3 cursor-pointer hover:border-primary ${
                              (selectedShipping as any)?.ServiceCode === service.ServiceCode ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => handleSelectShipping(service)}
                          >
                            <div className="flex items-center">
                              <RadioGroupItem
                                value={service.ServiceCode}
                                id={service.ServiceCode}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <Label htmlFor={service.ServiceCode} className="font-medium cursor-pointer">
                                    {service.Carrier} - {service.ServiceDescription}
                                  </Label>
                                  <span className="font-bold">{formatCurrency(service.ShippingPrice)}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Entrega em até {service.DeliveryTime} dias úteis
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Não foi possível encontrar opções de frete para este endereço.</p>
                        <p className="mt-2">Você pode prosseguir sem selecionar frete.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => refetchShipping()}
                        >
                          <Loader2 className="mr-2 h-4 w-4" />
                          Tentar novamente
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Informe seu CEP no formulário acima para calcular o frete.</p>
                      <p className="mt-2">Você pode prosseguir sem selecionar frete.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => setActiveTab('payment')}
                  >
                    Continuar para Pagamento
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja pagar seu pedido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodSelect}>
                    <div className={`border p-4 rounded-md mb-3 cursor-pointer hover:border-primary ${
                      selectedPaymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : ''
                    }`}>
                      <div className="flex items-center">
                        <RadioGroupItem value="credit_card" id="credit_card" className="mr-3" />
                        <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                          <div className="font-medium">Cartão de Crédito</div>
                          <div className="text-sm text-gray-500">Visa, Mastercard, Elo, American Express</div>
                        </Label>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-md mb-3 cursor-pointer hover:border-primary ${
                      selectedPaymentMethod === 'pix' ? 'border-primary bg-primary/5' : ''
                    }`}>
                      <div className="flex items-center">
                        <RadioGroupItem value="pix" id="pix" className="mr-3" />
                        <Label htmlFor="pix" className="flex-1 cursor-pointer">
                          <div className="font-medium">PIX</div>
                          <div className="text-sm text-gray-500">Pagamento instantâneo</div>
                        </Label>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-md cursor-pointer hover:border-primary ${
                      selectedPaymentMethod === 'boleto' ? 'border-primary bg-primary/5' : ''
                    }`}>
                      <div className="flex items-center">
                        <RadioGroupItem value="boleto" id="boleto" className="mr-3" />
                        <Label htmlFor="boleto" className="flex-1 cursor-pointer">
                          <div className="font-medium">Boleto Bancário</div>
                          <div className="text-sm text-gray-500">O pedido será processado após a confirmação do pagamento</div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('shipping')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={isProcessingOrder || !selectedPaymentMethod}
                  >
                    {isProcessingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Finalizar Compra
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md overflow-hidden mr-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(parseFloat(item.product.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span className="font-medium">
                    {selectedShipping
                      ? formatCurrency(selectedShipping.ShippingPrice)
                      : "Selecione um método de envio"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/cart')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o Carrinho
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

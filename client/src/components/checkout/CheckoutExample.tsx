import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, FileText, QrCode } from 'lucide-react';
import { PixCheckout } from './PixCheckout';
import { formatCurrency, type CustomerInfo } from '@/lib/abacatePayService';

interface CheckoutExampleProps {
  orderId: number;
  amount: number;
  customerInfo?: CustomerInfo;
  onPaymentSuccess?: () => void;
  onPaymentCancel?: () => void;
}

export function CheckoutExample({
  orderId,
  amount,
  customerInfo,
  onPaymentSuccess,
  onPaymentCancel
}: CheckoutExampleProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showPixCheckout, setShowPixCheckout] = useState(false);

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito/Débito',
      description: 'Visa, Mastercard, Elo',
      icon: CreditCard,
      available: false // Não implementado ainda
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      description: 'Vencimento em 3 dias úteis',
      icon: FileText,
      available: false // Não implementado ainda
    },
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo via AbacatePay',
      icon: QrCode,
      available: true
    }
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    
    if (methodId === 'pix') {
      setShowPixCheckout(true);
    } else {
      setShowPixCheckout(false);
    }
  };

  const handlePixPaymentSuccess = () => {
    setShowPixCheckout(false);
    onPaymentSuccess?.();
  };

  const handlePixPaymentCancel = () => {
    setShowPixCheckout(false);
    setSelectedPaymentMethod('');
  };

  if (showPixCheckout) {
    return (
      <PixCheckout
        amount={amount}
        orderId={orderId}
        customerInfo={customerInfo}
        onPaymentSuccess={handlePixPaymentSuccess}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
          setShowPixCheckout(false);
        }}
        onCancel={handlePixPaymentCancel}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Finalizar Pagamento</CardTitle>
        <CardDescription>
          Pedido #{orderId} - {formatCurrency(amount)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-3">Escolha a forma de pagamento:</h3>
          
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={handlePaymentMethodSelect}
            className="space-y-3"
          >
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              
              return (
                <div key={method.id} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    disabled={!method.available}
                  />
                  <Label
                    htmlFor={method.id}
                    className={`flex items-center space-x-3 flex-1 cursor-pointer p-3 rounded-lg border transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      !method.available ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.name}</span>
                        {!method.available && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Em breve
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {selectedPaymentMethod && selectedPaymentMethod !== 'pix' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Esta forma de pagamento ainda não está disponível. 
              Por favor, escolha PIX para continuar.
            </p>
          </div>
        )}

        <Separator />

        {/* Resumo do pedido */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Resumo do pedido:</h4>
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frete:</span>
            <span>Grátis</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Informações do cliente */}
        {customerInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dados do cliente:</h4>
            <div className="text-sm text-gray-600">
              <p>{customerInfo.name}</p>
              <p>{customerInfo.email}</p>
              {customerInfo.phone && <p>{customerInfo.phone}</p>}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onPaymentCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (selectedPaymentMethod === 'pix') {
                setShowPixCheckout(true);
              }
            }}
            disabled={!selectedPaymentMethod || selectedPaymentMethod !== 'pix'}
            className="flex-1"
          >
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

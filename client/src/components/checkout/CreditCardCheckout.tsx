import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createCreditCardPayment,
  formatCurrency,
  type CreateAbacatePaymentData,
  type AbacatePaymentResponse,
  type CustomerInfo
} from '@/lib/abacatePayService';

interface CreditCardCheckoutProps {
  amount: number;
  orderId: number;
  customerInfo?: CustomerInfo;
  onPaymentSuccess?: (paymentData: AbacatePaymentResponse) => void;
  onPaymentError?: (error: string) => void;
  onCancel?: () => void;
}

export function CreditCardCheckout({
  amount,
  orderId,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}: CreditCardCheckoutProps) {
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate card details
    const validation = validateCreditCard({
      number: cardDetails.number.replace(/\s/g, ''),
      name: cardDetails.name,
      expiry: cardDetails.expiry,
      cvc: cardDetails.cvc
    });

    if (!validation.valid) {
      newErrors.general = validation.error || 'Dados do cartão inválidos';
    }

    // Individual field validation
    if (!cardDetails.number.replace(/\s/g, '')) {
      newErrors.number = 'Número do cartão é obrigatório';
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = 'Nome do titular é obrigatório';
    }

    if (!cardDetails.expiry) {
      newErrors.expiry = 'Data de validade é obrigatória';
    }

    if (!cardDetails.cvc) {
      newErrors.cvc = 'CVV é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Process payment
  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      const paymentData: CreateAbacatePaymentData = {
        amount,
        orderId,
        paymentMethod: 'credit_card',
        customerInfo,
        cardDetails: {
          number: cardDetails.number.replace(/\s/g, ''),
          name: cardDetails.name,
          expiry: cardDetails.expiry,
          cvc: cardDetails.cvc
        }
      };

      const result = await createCreditCardPayment(paymentData);

      toast({
        title: 'Pagamento aprovado!',
        description: 'Seu cartão foi processado com sucesso.',
      });
      onPaymentSuccess?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no processamento do cartão';
      toast({
        title: 'Erro no pagamento',
        description: errorMessage,
        variant: 'destructive',
      });
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento com Cartão
        </CardTitle>
        <CardDescription>
          Valor: {formatCurrency(amount)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {errors.general && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              maxLength={19}
              className={errors.number ? 'border-red-500' : ''}
            />
            {errors.number && (
              <p className="text-sm text-red-500 mt-1">{errors.number}</p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardName">Nome do Titular</Label>
            <Input
              id="cardName"
              placeholder="Nome como está no cartão"
              value={cardDetails.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpiry">Validade</Label>
              <Input
                id="cardExpiry"
                placeholder="MM/AA"
                value={cardDetails.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                maxLength={5}
                className={errors.expiry ? 'border-red-500' : ''}
              />
              {errors.expiry && (
                <p className="text-sm text-red-500 mt-1">{errors.expiry}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cardCvc">CVV</Label>
              <Input
                id="cardCvc"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) => handleInputChange('cvc', e.target.value)}
                maxLength={4}
                className={errors.cvc ? 'border-red-500' : ''}
              />
              {errors.cvc && (
                <p className="text-sm text-red-500 mt-1">{errors.cvc}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Pagamento Seguro</p>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• Seus dados são criptografados</li>
                <li>• Não armazenamos informações do cartão</li>
                <li>• Processamento seguro via SSL</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Pagar {formatCurrency(amount)}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
        </div>

        {/* Payment Info */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Pagamento via AbacatePay:</strong> Processamento seguro e confiável.
            Aceitamos Visa, Mastercard, Elo e American Express.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

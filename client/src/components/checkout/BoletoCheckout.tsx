import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  createBoletoPayment, 
  formatCurrency,
  type CreateAbacatePaymentData,
  type AbacatePaymentResponse,
  type CustomerInfo 
} from '@/lib/abacatePayService';

interface BoletoCheckoutProps {
  amount: number;
  orderId: number;
  customerInfo?: CustomerInfo;
  onPaymentSuccess?: (paymentData: AbacatePaymentResponse) => void;
  onPaymentError?: (error: string) => void;
  onCancel?: () => void;
}

export function BoletoCheckout({
  amount,
  orderId,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}: BoletoCheckoutProps) {
  const [boletoData, setBoletoData] = useState<AbacatePaymentResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: customerInfo?.name || '',
    email: customerInfo?.email || '',
    document: customerInfo?.document || '',
    phone: customerInfo?.phone || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // Validar CPF/CNPJ
  const validateDocument = (document: string): boolean => {
    const cleanDoc = document.replace(/\D/g, '');
    return cleanDoc.length === 11 || cleanDoc.length === 14;
  };

  // Formatar CPF/CNPJ
  const formatDocument = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length <= 11) {
      // CPF: 000.000.000-00
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2');
    }
  };

  // Validar campos
  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerDetails.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!customerDetails.email.trim() || !customerDetails.email.includes('@')) {
      newErrors.email = 'Email válido é obrigatório';
    }

    if (!customerDetails.document.trim() || !validateDocument(customerDetails.document)) {
      newErrors.document = 'CPF ou CNPJ válido é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gerar boleto
  const generateBoleto = async () => {
    if (!validateFields()) {
      return;
    }

    setIsGenerating(true);
    try {
      const paymentData: CreateAbacatePaymentData = {
        amount,
        orderId,
        paymentMethod: 'boleto',
        customerInfo: {
          name: customerDetails.name,
          email: customerDetails.email,
          document: customerDetails.document.replace(/\D/g, ''),
          phone: customerDetails.phone
        }
      };

      const response = await createBoletoPayment(paymentData);
      setBoletoData(response);

      toast({
        title: 'Boleto gerado com sucesso',
        description: 'Você pode baixar o boleto e pagar até a data de vencimento.',
      });

      onPaymentSuccess?.(response);
    } catch (error) {
      console.error('Erro ao gerar boleto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar boleto';
      toast({
        title: 'Erro ao gerar boleto',
        description: errorMessage,
        variant: 'destructive'
      });
      onPaymentError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Baixar boleto
  const downloadBoleto = () => {
    if (boletoData?.qrCode) {
      // Simular download do boleto
      const link = document.createElement('a');
      link.href = boletoData.qrCode; // Na implementação real, seria a URL do PDF do boleto
      link.download = `boleto-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pagamento com Boleto
        </CardTitle>
        <CardDescription>
          Valor: {formatCurrency(amount)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!boletoData ? (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="document">CPF/CNPJ *</Label>
                <Input
                  id="document"
                  type="text"
                  value={customerDetails.document}
                  onChange={(e) => setCustomerDetails(prev => ({ 
                    ...prev, 
                    document: formatDocument(e.target.value) 
                  }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  maxLength={18}
                  className={errors.document ? 'border-red-500' : ''}
                />
                {errors.document && <p className="text-sm text-red-500 mt-1">{errors.document}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                O boleto terá vencimento em 3 dias úteis. Após o pagamento, a confirmação pode levar até 2 dias úteis.
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={generateBoleto}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Boleto
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Boleto gerado com sucesso! Clique no botão abaixo para baixar.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Valor: <strong>{formatCurrency(amount)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Vencimento: <strong>{new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</strong>
              </p>
            </div>

            <Button
              onClick={downloadBoleto}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Boleto
            </Button>

            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

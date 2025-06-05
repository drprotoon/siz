import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, QrCode, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createAbacatePayment,
  checkPaymentStatus,
  copyPixCode,
  formatCurrency,
  calculateTimeRemaining,
  generateQRCodeImage,
  type CreateAbacatePaymentData,
  type AbacatePaymentResponse,
  type CustomerInfo
} from '@/lib/abacatePayService';

interface PixCheckoutProps {
  amount: number;
  orderId: number;
  customerInfo?: CustomerInfo;
  onPaymentSuccess?: (paymentData: AbacatePaymentResponse) => void;
  onPaymentError?: (error: string) => void;
  onCancel?: () => void;
}

export function PixCheckout({
  amount,
  orderId,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel
}: PixCheckoutProps) {
  const [paymentData, setPaymentData] = useState<AbacatePaymentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ minutes: 0, seconds: 0, expired: false });
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');

  const { toast } = useToast();

  // Criar pagamento PIX
  const createPayment = async () => {
    setIsLoading(true);
    try {
      const data: CreateAbacatePaymentData = {
        amount,
        orderId,
        customerInfo
      };

      const response = await createAbacatePayment(data);
      setPaymentData(response);
      setPaymentStatus(response.status);

      // Gerar QR Code se tiver o texto PIX
      if (response.qrCodeText) {
        setIsGeneratingQR(true);
        try {
          const qrImage = await generateQRCodeImage(response.qrCodeText);
          setQrCodeImage(qrImage);
        } catch (qrError) {
          console.error('Erro ao gerar QR Code:', qrError);
          // Continuar mesmo se o QR Code falhar
        } finally {
          setIsGeneratingQR(false);
        }
      }

      toast({
        title: 'PIX gerado com sucesso',
        description: 'Escaneie o QR Code ou copie o código PIX para pagar.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar PIX';
      toast({
        title: 'Erro ao gerar PIX',
        description: errorMessage,
        variant: 'destructive',
      });
      onPaymentError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar status do pagamento
  const checkStatus = async () => {
    if (!paymentData) return;

    setIsCheckingStatus(true);
    try {
      const status = await checkPaymentStatus(paymentData.id);
      setPaymentStatus(status.status as any);
      
      if (status.status === 'paid') {
        toast({
          title: 'Pagamento confirmado!',
          description: 'Seu pagamento foi processado com sucesso.',
        });
        onPaymentSuccess?.(paymentData);
      } else if (status.status === 'failed') {
        toast({
          title: 'Pagamento falhou',
          description: 'Houve um problema com seu pagamento.',
          variant: 'destructive',
        });
        onPaymentError?.('Payment failed');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Copiar código PIX
  const handleCopyPixCode = async () => {
    if (!paymentData?.qrCodeText) return;

    try {
      await copyPixCode(paymentData.qrCodeText);
      toast({
        title: 'Código copiado!',
        description: 'O código PIX foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código PIX.',
        variant: 'destructive',
      });
    }
  };

  // Regenerar QR Code
  const handleRegenerateQRCode = async () => {
    if (!paymentData?.qrCodeText) return;

    setIsGeneratingQR(true);
    try {
      const qrImage = await generateQRCodeImage(paymentData.qrCodeText);
      setQrCodeImage(qrImage);
      toast({
        title: 'QR Code regenerado',
        description: 'O QR Code foi gerado novamente com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar QR Code',
        description: 'Não foi possível gerar o QR Code. Use o código PIX.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Atualizar contador de tempo
  useEffect(() => {
    if (!paymentData?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(paymentData.expiresAt!);
      setTimeRemaining(remaining);
      
      if (remaining.expired && paymentStatus === 'pending') {
        setPaymentStatus('expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expiresAt, paymentStatus]);

  // Verificar status automaticamente
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return;

    const interval = setInterval(checkStatus, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, [paymentData, paymentStatus]);

  // Inicializar pagamento automaticamente
  useEffect(() => {
    if (!paymentData) {
      createPayment();
    }
  }, []);

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'paid': return 'Pago';
      case 'failed': return 'Falhou';
      case 'expired': return 'Expirado';
      default: return 'Aguardando pagamento';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerando PIX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Erro ao gerar PIX</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível gerar o código PIX. Tente novamente.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={createPayment} className="flex-1">
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX
          </span>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Valor: {formatCurrency(amount)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {paymentStatus === 'pending' && (
          <>
            {/* Timer */}
            {paymentData.expiresAt && !timeRemaining.expired && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Tempo restante: {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
                </AlertDescription>
              </Alert>
            )}

            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeImage ? (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img
                    src={qrCodeImage}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Escaneie com seu banco ou app de pagamento
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateQRCode}
                    disabled={isGeneratingQR}
                    className="w-full mt-2 text-xs"
                  >
                    {isGeneratingQR ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Regenerar QR Code
                  </Button>
                </div>
              ) : isGeneratingQR ? (
                <div className="w-48 h-48 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                    <p className="text-sm text-gray-500">Gerando QR Code...</p>
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">QR Code PIX</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Instruções de pagamento */}
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                <strong>Como pagar com PIX:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Abra o app do seu banco</li>
                  <li>Escaneie o QR Code ou copie o código PIX</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Código PIX */}
            <div>
              <p className="text-sm font-medium mb-2">Código PIX (Copia e Cola):</p>
              <div className="bg-gray-50 border rounded-lg overflow-hidden">
                <div className="p-3 max-h-24 overflow-y-auto">
                  <p className="text-xs font-mono break-all text-gray-700 leading-relaxed">
                    {paymentData.qrCodeText}
                  </p>
                </div>
                <div className="border-t bg-white p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPixCode}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar código PIX
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cole este código no seu app de pagamento ou banco
              </p>
            </div>

            {/* Botão verificar status */}
            <Button
              variant="outline"
              onClick={checkStatus}
              disabled={isCheckingStatus}
              className="w-full"
            >
              {isCheckingStatus ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar status
            </Button>

            {/* Informações de segurança */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Pagamento Seguro</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• PIX é um meio de pagamento oficial do Banco Central</li>
                    <li>• Transação instantânea e segura</li>
                    <li>• Confirmação automática em segundos</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {paymentStatus === 'paid' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Pagamento confirmado! Seu pedido está sendo processado.
            </AlertDescription>
          </Alert>
        )}

        {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {paymentStatus === 'expired' 
                ? 'O tempo para pagamento expirou. Gere um novo PIX.'
                : 'Houve um problema com o pagamento. Tente novamente.'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
            <Button onClick={createPayment} className="flex-1">
              Gerar novo PIX
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

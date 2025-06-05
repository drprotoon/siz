import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PixCheckout } from '@/components/checkout/PixCheckout';
import { type CustomerInfo } from '@/lib/abacatePayService';

export default function TestPixCheckout() {
  const [showPixCheckout, setShowPixCheckout] = useState(false);
  const [testData, setTestData] = useState({
    amount: 100.50,
    orderId: 12345,
    customerName: 'João Silva',
    customerEmail: 'joao@email.com'
  });

  const handleStartTest = () => {
    setShowPixCheckout(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('✅ Pagamento confirmado!', paymentData);
    alert('Pagamento confirmado com sucesso!');
    setShowPixCheckout(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Erro no pagamento:', error);
    alert(`Erro no pagamento: ${error}`);
    setShowPixCheckout(false);
  };

  const handlePaymentCancel = () => {
    console.log('🚫 Pagamento cancelado');
    setShowPixCheckout(false);
  };

  if (showPixCheckout) {
    const customerInfo: CustomerInfo = {
      name: testData.customerName,
      email: testData.customerEmail
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowPixCheckout(false)}
              className="mr-4"
            >
              ← Voltar ao Teste
            </Button>
            <h1 className="text-3xl font-bold">Teste PIX Checkout</h1>
          </div>

          <div className="flex justify-center">
            <PixCheckout
              amount={testData.amount}
              orderId={testData.orderId}
              customerInfo={customerInfo}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">🧪 Teste do Componente PIX Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuração do Teste */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configuração do Teste</CardTitle>
              <CardDescription>
                Configure os dados para testar o componente PixCheckout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={testData.amount}
                  onChange={(e) => setTestData(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="orderId">ID do Pedido</Label>
                <Input
                  id="orderId"
                  type="number"
                  value={testData.orderId}
                  onChange={(e) => setTestData(prev => ({
                    ...prev,
                    orderId: parseInt(e.target.value) || 0
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="customerName">Nome do Cliente</Label>
                <Input
                  id="customerName"
                  value={testData.customerName}
                  onChange={(e) => setTestData(prev => ({
                    ...prev,
                    customerName: e.target.value
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email do Cliente</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={testData.customerEmail}
                  onChange={(e) => setTestData(prev => ({
                    ...prev,
                    customerEmail: e.target.value
                  }))}
                />
              </div>

              <Separator />

              <Button 
                onClick={handleStartTest}
                className="w-full"
                size="lg"
              >
                🚀 Iniciar Teste PIX
              </Button>
            </CardContent>
          </Card>

          {/* Informações do Teste */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Informações do Teste</CardTitle>
              <CardDescription>
                O que será testado neste componente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">✅ Funcionalidades Testadas:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Geração de QR Code PIX real
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Exibição do código PIX para cópia
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Timer de expiração
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Verificação de status
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Interface responsiva
                  </li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">⚠️ Observações:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Este é um ambiente de teste</li>
                  <li>• O pagamento não será processado realmente</li>
                  <li>• Use dados fictícios para teste</li>
                  <li>• Verifique se o QR Code é gerado corretamente</li>
                </ul>
              </div>

              <Separator />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2">🔧 Configuração Necessária:</h4>
                <p className="text-sm text-blue-700">
                  Para funcionar em produção, configure as variáveis de ambiente:
                </p>
                <ul className="text-xs text-blue-600 mt-2 space-y-1">
                  <li>• ABACATEPAY_API_KEY</li>
                  <li>• ABACATEPAY_WEBHOOK_SECRET</li>
                  <li>• WEBHOOK_BASE_URL</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo dos Dados */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📊 Resumo dos Dados de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Valor:</span>
                <p className="text-lg font-bold text-green-600">
                  R$ {testData.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="font-medium">Pedido:</span>
                <p className="text-lg font-bold">#{testData.orderId}</p>
              </div>
              <div>
                <span className="font-medium">Cliente:</span>
                <p className="text-lg font-bold">{testData.customerName}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p className="text-lg font-bold">{testData.customerEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

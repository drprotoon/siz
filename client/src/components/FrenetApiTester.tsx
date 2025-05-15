import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FrenetApiTester() {
  const { toast } = useToast();
  const [postalCode, setPostalCode] = useState('');
  const [result, setResult] = useState<any>(null);

  // Mutation para testar a API da Frenet
  const testApiMutation = useMutation({
    mutationFn: async (cep: string) => {
      const response = await fetch('/api/freight/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postalCode: cep }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao testar a API da Frenet');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Teste realizado com sucesso',
        description: 'A API da Frenet respondeu corretamente.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível testar a API da Frenet.',
        variant: 'destructive',
      });
    },
  });

  // Formatar o CEP enquanto o usuário digita
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5);
    setPostalCode(value);
  };

  // Testar a API
  const handleTestApi = () => {
    if (postalCode.replace(/\D/g, '').length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, digite um CEP válido com 8 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    testApiMutation.mutate(postalCode);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste da API da Frenet</CardTitle>
        <CardDescription>
          Teste a conexão com a API da Frenet usando um CEP válido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">CEP de Destino</Label>
            <div className="flex space-x-2">
              <Input
                id="postalCode"
                placeholder="00000-000"
                value={postalCode}
                onChange={handlePostalCodeChange}
                maxLength={9}
              />
              <Button
                onClick={handleTestApi}
                disabled={testApiMutation.isPending}
              >
                {testApiMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar API'
                )}
              </Button>
            </div>
          </div>

          {testApiMutation.isPending && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Testando a API...</span>
            </div>
          )}

          {testApiMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                {testApiMutation.error instanceof Error
                  ? testApiMutation.error.message
                  : 'Erro ao testar a API da Frenet'}
              </AlertDescription>
            </Alert>
          )}

          {testApiMutation.isSuccess && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>
                A API da Frenet respondeu corretamente.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Resposta da API:</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        <p>
          Este teste envia uma requisição para a API da Frenet usando o CEP informado.
          Os dados de origem e produtos são fixos para fins de teste.
        </p>
      </CardFooter>
    </Card>
  );
}

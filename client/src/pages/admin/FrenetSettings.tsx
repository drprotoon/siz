import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layouts/AdminLayout';
import FrenetInfoPanel from '@/components/FrenetInfoPanel';
import FrenetApiTester from '@/components/FrenetApiTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, Settings, RefreshCw, TestTube } from 'lucide-react';

export default function FrenetSettings() {
  const { toast } = useToast();
  const [sellerCEP, setSellerCEP] = useState('74591990');
  const [apiToken, setApiToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Aqui você implementaria a lógica para salvar as configurações
      // Por exemplo, uma chamada para uma API que salva as configurações no banco de dados

      toast({
        title: 'Configurações salvas',
        description: 'As configurações da Frenet foram salvas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Frenet</h1>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">
              <Truck className="mr-2 h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="test">
              <TestTube className="mr-2 h-4 w-4" />
              Teste da API
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <FrenetInfoPanel />

            <Card>
              <CardHeader>
                <CardTitle>Teste de Cotação</CardTitle>
                <CardDescription>
                  Faça um teste de cotação de frete para verificar se a integração está funcionando corretamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Para testar a cotação de frete, vá até a página do carrinho e adicione um produto.
                  Em seguida, insira um CEP válido e clique em "Calcular Frete".
                </p>
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Ir para o Carrinho
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <FrenetApiTester />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da API</CardTitle>
                <CardDescription>
                  Configure os parâmetros da integração com a Frenet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sellerCEP">CEP de Origem</Label>
                      <Input
                        id="sellerCEP"
                        placeholder="00000-000"
                        value={sellerCEP}
                        onChange={(e) => setSellerCEP(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        CEP do remetente (sua loja)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiToken">Token da API</Label>
                      <Input
                        id="apiToken"
                        type="password"
                        placeholder="Token da API Frenet"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Token fornecido pela Frenet para autenticação
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Configurações'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

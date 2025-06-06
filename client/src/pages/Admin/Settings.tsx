import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, CreditCard, Store, Shield, Save } from 'lucide-react';
import { settingsAPI } from '@/api';

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para configurações do PIX/AbacatePay
  const [abacatePayApiKey, setAbacatePayApiKey] = useState('');
  const [abacatePayApiUrl, setAbacatePayApiUrl] = useState('https://api.abacatepay.com');
  const [abacatePayWebhookSecret, setAbacatePayWebhookSecret] = useState('');
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('');
  const [pixEnabled, setPixEnabled] = useState(true);
  
  // Estados para configurações gerais da loja
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  // Buscar configurações do PIX/AbacatePay
  const { data: pixSettings, isLoading: pixLoading } = useQuery({
    queryKey: ['settings', 'pix'],
    queryFn: () => settingsAPI.getByCategory('pix'),
    select: (response) => response.data
  });

  // Buscar configurações gerais
  const { data: generalSettings, isLoading: generalLoading } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => settingsAPI.getByCategory('general'),
    select: (response) => response.data
  });

  // Buscar configurações de shipping
  const { data: shippingSettings, isLoading: shippingLoading } = useQuery({
    queryKey: ['settings', 'shipping'],
    queryFn: () => settingsAPI.getByCategory('shipping'),
    select: (response) => response.data
  });

  // Mutation para salvar configurações do PIX
  const savePixSettingsMutation = useMutation({
    mutationFn: async (settings: {
      abacatePayApiKey: string;
      abacatePayApiUrl: string;
      abacatePayWebhookSecret: string;
      webhookBaseUrl: string;
      pixEnabled: boolean;
    }) => {
      const promises = [
        settingsAPI.updateSetting('pix', 'abacatepay_api_key', settings.abacatePayApiKey, 'Chave da API do AbacatePay'),
        settingsAPI.updateSetting('pix', 'abacatepay_api_url', settings.abacatePayApiUrl, 'URL da API do AbacatePay'),
        settingsAPI.updateSetting('pix', 'abacatepay_webhook_secret', settings.abacatePayWebhookSecret, 'Chave secreta para validar webhooks'),
        settingsAPI.updateSetting('pix', 'webhook_base_url', settings.webhookBaseUrl, 'URL base para webhooks'),
        settingsAPI.updateSetting('pix', 'pix_enabled', settings.pixEnabled.toString(), 'Habilitar pagamentos PIX')
      ];
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'pix'] });
      toast({
        title: 'Configurações do PIX salvas',
        description: 'As configurações do PIX foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações do PIX:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações do PIX. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Mutation para salvar configurações gerais
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async (settings: {
      storeName: string;
      storeEmail: string;
      storePhone: string;
      freeShippingThreshold: string;
    }) => {
      const promises = [
        settingsAPI.updateSetting('general', 'store_name', settings.storeName, 'Nome da loja'),
        settingsAPI.updateSetting('general', 'store_email', settings.storeEmail, 'Email da loja'),
        settingsAPI.updateSetting('general', 'store_phone', settings.storePhone, 'Telefone da loja'),
        settingsAPI.updateSetting('shipping', 'free_shipping_threshold', settings.freeShippingThreshold, 'Valor mínimo para frete grátis (em reais)')
      ];
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'shipping'] });
      toast({
        title: 'Configurações gerais salvas',
        description: 'As configurações gerais foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações gerais:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações gerais. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  // Carregar configurações do PIX quando disponíveis
  useEffect(() => {
    if (pixSettings) {
      const apiKeySetting = pixSettings.find((s: any) => s.key === 'abacatepay_api_key');
      const apiUrlSetting = pixSettings.find((s: any) => s.key === 'abacatepay_api_url');
      const webhookSecretSetting = pixSettings.find((s: any) => s.key === 'abacatepay_webhook_secret');
      const webhookBaseUrlSetting = pixSettings.find((s: any) => s.key === 'webhook_base_url');
      const pixEnabledSetting = pixSettings.find((s: any) => s.key === 'pix_enabled');

      if (apiKeySetting) setAbacatePayApiKey(apiKeySetting.value || '');
      if (apiUrlSetting) setAbacatePayApiUrl(apiUrlSetting.value || 'https://api.abacatepay.com');
      if (webhookSecretSetting) setAbacatePayWebhookSecret(webhookSecretSetting.value || '');
      if (webhookBaseUrlSetting) setWebhookBaseUrl(webhookBaseUrlSetting.value || '');
      if (pixEnabledSetting) setPixEnabled(pixEnabledSetting.value === 'true');
    }
  }, [pixSettings]);

  // Carregar configurações gerais quando disponíveis
  useEffect(() => {
    if (generalSettings) {
      const storeNameSetting = generalSettings.find((s: any) => s.key === 'store_name');
      const storeEmailSetting = generalSettings.find((s: any) => s.key === 'store_email');
      const storePhoneSetting = generalSettings.find((s: any) => s.key === 'store_phone');

      if (storeNameSetting) setStoreName(storeNameSetting.value || '');
      if (storeEmailSetting) setStoreEmail(storeEmailSetting.value || '');
      if (storePhoneSetting) setStorePhone(storePhoneSetting.value || '');
    }
  }, [generalSettings]);

  // Carregar configurações de shipping quando disponíveis
  useEffect(() => {
    if (shippingSettings) {
      const freeShippingSetting = shippingSettings.find((s: any) => s.key === 'free_shipping_threshold');
      if (freeShippingSetting) setFreeShippingThreshold(freeShippingSetting.value || '');
    }
  }, [shippingSettings]);

  const handleSavePixSettings = async () => {
    if (!abacatePayApiKey.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, preencha a chave da API do AbacatePay.',
        variant: 'destructive',
      });
      return;
    }

    savePixSettingsMutation.mutate({
      abacatePayApiKey,
      abacatePayApiUrl,
      abacatePayWebhookSecret,
      webhookBaseUrl,
      pixEnabled
    });
  };

  const handleSaveGeneralSettings = async () => {
    if (!storeName.trim() || !storeEmail.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome e email da loja.',
        variant: 'destructive',
      });
      return;
    }

    saveGeneralSettingsMutation.mutate({
      storeName,
      storeEmail,
      storePhone,
      freeShippingThreshold
    });
  };

  const isLoading = pixLoading || generalLoading || shippingLoading;

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="pix" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              PIX
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Aba Configurações Gerais */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua loja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nome da Loja</Label>
                      <Input
                        id="storeName"
                        placeholder="SIZ Cosméticos"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Nome que aparecerá no site e nos emails
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeEmail">Email da Loja</Label>
                      <Input
                        id="storeEmail"
                        type="email"
                        placeholder="contato@sizcos.com"
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Email principal para contato
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="storePhone">Telefone da Loja</Label>
                      <Input
                        id="storePhone"
                        placeholder="(11) 99999-9999"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Telefone para contato (opcional)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeShippingThreshold">Frete Grátis (R$)</Label>
                      <Input
                        id="freeShippingThreshold"
                        type="number"
                        placeholder="150"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Valor mínimo para frete grátis
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveGeneralSettings}
                      disabled={saveGeneralSettingsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saveGeneralSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Configurações PIX */}
          <TabsContent value="pix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do PIX (AbacatePay)</CardTitle>
                <CardDescription>
                  Configure a integração com o AbacatePay para pagamentos PIX.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pixEnabled">Habilitar PIX</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar ou desativar pagamentos PIX
                      </p>
                    </div>
                    <Switch
                      id="pixEnabled"
                      checked={pixEnabled}
                      onCheckedChange={setPixEnabled}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="abacatePayApiKey">Chave da API</Label>
                      <Input
                        id="abacatePayApiKey"
                        type="password"
                        placeholder="abacate_live_xxxxxxxxxxxxxxxx"
                        value={abacatePayApiKey}
                        onChange={(e) => setAbacatePayApiKey(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Sua chave de API do AbacatePay (obrigatório)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abacatePayApiUrl">URL da API</Label>
                      <Input
                        id="abacatePayApiUrl"
                        placeholder="https://api.abacatepay.com"
                        value={abacatePayApiUrl}
                        onChange={(e) => setAbacatePayApiUrl(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        URL base da API do AbacatePay
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abacatePayWebhookSecret">Chave Secreta do Webhook</Label>
                      <Input
                        id="abacatePayWebhookSecret"
                        type="password"
                        placeholder="minha-chave-secreta-super-segura"
                        value={abacatePayWebhookSecret}
                        onChange={(e) => setAbacatePayWebhookSecret(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Chave secreta para validar webhooks do AbacatePay
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookBaseUrl">URL Base do Webhook</Label>
                      <Input
                        id="webhookBaseUrl"
                        placeholder="https://siz-cosmetic-store-pro.vercel.app"
                        value={webhookBaseUrl}
                        onChange={(e) => setWebhookBaseUrl(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        URL base do seu site para receber webhooks
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePixSettings}
                      disabled={savePixSettingsMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {savePixSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações PIX'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Gerencie as configurações de segurança da aplicação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Configurações de Segurança</h3>
                    <p className="text-muted-foreground">
                      Esta seção será implementada em futuras atualizações.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

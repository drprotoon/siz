import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function SupabaseTester() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('api');

  // Mutation para testar a conexão com o Supabase via API
  const testApiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/supabase-test');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Teste de API concluído',
        description: data.status === 'success'
          ? 'Conexão com o Supabase via API está funcionando!'
          : 'Erro na conexão com o Supabase via API',
        variant: data.status === 'success' ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no teste de API',
        description: error.message || 'Não foi possível conectar à API',
        variant: 'destructive',
      });
    },
  });

  // Mutation para testar a Edge Function
  const testEdgeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/edge-test');

      if (!response.ok) {
        throw new Error(`Edge API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Teste de Edge Function concluído',
        description: data.status === 'success'
          ? 'Edge Function está funcionando corretamente!'
          : 'Erro na Edge Function',
        variant: data.status === 'success' ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no teste de Edge Function',
        description: error.message || 'Não foi possível conectar à Edge Function',
        variant: 'destructive',
      });
    },
  });

  // Mutation para testar a autenticação via Edge Function
  const testAuthMutation = useMutation({
    mutationFn: async () => {
      // Primeiro, tentar fazer login com credenciais de teste
      try {
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'teste@exemplo.com',
            password: 'senha123'
          })
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();

          // Se o login for bem-sucedido, verificar o usuário atual
          if (loginData.session && loginData.session.access_token) {
            const meResponse = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${loginData.session.access_token}`
              }
            });

            const meData = await meResponse.json();

            return {
              login: loginData,
              me: meData,
              success: true
            };
          }

          return {
            login: loginData,
            success: true
          };
        }

        // Se o login falhar, tentar apenas verificar o endpoint
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        return {
          endpoint: 'working',
          data,
          success: false
        };
      } catch (error) {
        // Se ocorrer um erro, verificar se o endpoint está acessível
        try {
          const response = await fetch('/api/auth/login', {
            method: 'OPTIONS'
          });

          return {
            endpoint: response.ok ? 'accessible' : 'inaccessible',
            status: response.status,
            success: false
          };
        } catch (e: any) {
          throw new Error(`Auth endpoint inaccessible: ${e.message || String(e)}`);
        }
      }
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Teste de autenticação concluído',
        description: data.success
          ? 'Autenticação via Edge Function está funcionando!'
          : 'Endpoint de autenticação acessível, mas login falhou',
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no teste de autenticação',
        description: error.message || 'Não foi possível acessar o endpoint de autenticação',
        variant: 'destructive',
      });
    },
  });

  // Função para testar a conexão direta com o Supabase
  const testDirectConnection = async () => {
    setLoading(true);
    try {
      // Verificar a URL e a chave do Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credenciais do Supabase não encontradas nas variáveis de ambiente');
      }

      // Testar a conexão com o banco de dados
      const { data: products, error: dbError } = await supabase
        .from('products')
        .select('id, name')
        .limit(5);

      // Testar a conexão com o storage
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .from('product-images')
        .list();

      // Preparar resultado
      const result = {
        timestamp: new Date().toISOString(),
        supabaseUrl: `${supabaseUrl.substring(0, 15)}...`,
        supabaseKey: `${supabaseKey.substring(0, 5)}...`,
        database: {
          connected: !dbError,
          error: dbError ? dbError.message : null,
          products: products || []
        },
        storage: {
          connected: !bucketError,
          error: bucketError ? bucketError.message : null,
          files: bucketData ? bucketData.map((f: any) => f.name) : []
        }
      };

      setResult(result);

      toast({
        title: 'Teste direto concluído',
        description: !dbError && !bucketError
          ? 'Conexão direta com o Supabase está funcionando!'
          : 'Erro na conexão direta com o Supabase',
        variant: !dbError && !bucketError ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no teste direto',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mutation para verificar as variáveis de ambiente
  const testEnvMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/env-test');

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Verificação de ambiente concluída',
        description: 'Variáveis de ambiente verificadas com sucesso',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na verificação de ambiente',
        description: error.message || 'Não foi possível verificar as variáveis de ambiente',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Conexão com o Supabase</CardTitle>
        <CardDescription>
          Verifique se a conexão com o Supabase está funcionando corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="api" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">API Regular</TabsTrigger>
            <TabsTrigger value="edge">Edge Functions</TabsTrigger>
            <TabsTrigger value="direct">Conexão Direta</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button
                onClick={() => testApiMutation.mutate()}
                disabled={testApiMutation.isPending}
                variant="default"
              >
                {testApiMutation.isPending ? 'Testando API...' : 'Testar via API'}
              </Button>

              <Button
                onClick={() => testEnvMutation.mutate()}
                disabled={testEnvMutation.isPending}
                variant="secondary"
              >
                {testEnvMutation.isPending ? 'Verificando...' : 'Verificar Ambiente'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Testa a conexão com o Supabase usando endpoints de API regulares.
            </p>
          </TabsContent>

          <TabsContent value="edge" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button
                onClick={() => testEdgeMutation.mutate()}
                disabled={testEdgeMutation.isPending}
                variant="default"
              >
                {testEdgeMutation.isPending ? 'Testando Edge...' : 'Testar Edge Function'}
              </Button>

              <Button
                onClick={() => testAuthMutation.mutate()}
                disabled={testAuthMutation.isPending}
                variant="secondary"
              >
                {testAuthMutation.isPending ? 'Testando Auth...' : 'Testar Autenticação'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Testa a conexão com o Supabase usando Edge Functions, que são executadas mais próximas dos usuários.
            </p>
          </TabsContent>

          <TabsContent value="direct" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button
                onClick={testDirectConnection}
                disabled={loading}
                variant="default"
              >
                {loading ? 'Testando...' : 'Testar Conexão Direta'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Testa a conexão direta com o Supabase a partir do navegador, sem passar pelo backend.
            </p>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Ambiente: {import.meta.env.MODE} ({import.meta.env.PROD ? 'produção' : 'desenvolvimento'})
        </div>
      </CardFooter>
    </Card>
  );
}

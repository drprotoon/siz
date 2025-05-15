import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuthFormProps {
  onSuccess?: () => void;
  showCard?: boolean;
}

export default function AuthForm({ onSuccess, showCard = true }: AuthFormProps) {
  const { toast } = useToast();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');

  // Estado do formulário de login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Estado do formulário de registro
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await login(data.email, data.password);
    },
    onSuccess: () => {
      toast({
        title: 'Login realizado com sucesso',
        description: 'Você foi autenticado com sucesso.',
        variant: 'default'
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no login',
        description: error.message || 'Não foi possível fazer login. Verifique suas credenciais.',
        variant: 'destructive'
      });
    }
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      await register(data.name, data.email, data.password);
    },
    onSuccess: () => {
      toast({
        title: 'Registro realizado com sucesso',
        description: 'Sua conta foi criada com sucesso.',
        variant: 'default'
      });

      // Mudar para a aba de login após o registro
      setActiveTab('login');

      // Limpar o formulário de registro
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no registro',
        description: error.message || 'Não foi possível criar sua conta. Tente novamente.',
        variant: 'destructive'
      });
    }
  });

  // Manipular mudanças no formulário de login
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manipular mudanças no formulário de registro
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submeter formulário de login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive'
      });
      return;
    }

    loginMutation.mutate(loginData);
  };

  // Submeter formulário de registro
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive'
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas digitadas não são iguais.',
        variant: 'destructive'
      });
      return;
    }

    registerMutation.mutate({
      name: registerData.name,
      email: registerData.email,
      password: registerData.password
    });
  };

  const content = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Cadastro</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="space-y-4">
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={loginData.email}
              onChange={handleLoginChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="********"
              value={loginData.password}
              onChange={handleLoginChange}
            />
          </div>

          {loginMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : 'Erro ao fazer login'}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register" className="space-y-4">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              placeholder="Seu nome"
              value={registerData.name}
              onChange={handleRegisterChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">E-mail</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={registerData.email}
              onChange={handleRegisterChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              placeholder="********"
              value={registerData.password}
              onChange={handleRegisterChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="********"
              value={registerData.confirmPassword}
              onChange={handleRegisterChange}
            />
          </div>

          {registerMutation.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : 'Erro ao criar conta'}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );

  return showCard ? (
    <Card>
      <CardHeader>
        <CardTitle>Acesse sua conta</CardTitle>
        <CardDescription>
          Faça login ou crie uma conta para continuar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  ) : content;
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, User, MapPin, ShieldCheck, AlertTriangle, Save, Check } from 'lucide-react';
import AddressForm from '@/components/AddressForm';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPostalCode } from '@/lib/utils';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('personal');

  // Estado para informações pessoais
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    birthdate: '',
    // Campos de endereço
    address: '',
    postal_code: '',
    address_number: '',
    address_complement: '',
    district: '',
    city: '',
    state: '',
    country: 'Brasil'
  });

  // Estado para alteração de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Buscar informações do usuário
  const { data: userData, isLoading: userDataLoading, refetch: refetchUserData } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;

      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/profile`);
        return response.json();
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!user?.id
  });

  // Buscar endereço do usuário
  const { data: addressData, isLoading: addressLoading, refetch: refetchAddress } = useQuery({
    queryKey: ['user-address', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;

      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/address`);
        return response.json();
      } catch (error) {
        console.error('Erro ao buscar endereço do usuário:', error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id
  });

  // Atualizar estados quando os dados forem carregados
  useEffect(() => {
    if (userData) {
      console.log('Dados do usuário carregados no perfil:', userData);
      setPersonalInfo({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        cpf: userData.cpf || '',
        birthdate: userData.birthdate || '',
        // Campos de endereço
        address: userData.address || '',
        postal_code: userData.postal_code || '',
        address_number: userData.address_number || '',
        address_complement: userData.address_complement || '',
        district: userData.district || '',
        city: userData.city || '',
        state: userData.state || '',
        country: userData.country || 'Brasil'
      });
    }
  }, [userData]);

  // Mutation para atualizar informações pessoais
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('Enviando dados do perfil para atualização:', data);
      const response = await apiRequest('PUT', `/api/users/${user.id}/profile`, data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Perfil atualizado com sucesso:', data);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
        variant: 'default'
      });

      // Atualizar dados do usuário
      refetchUserData();

      // Atualizar também os dados de endereço para o checkout
      queryClient.invalidateQueries({ queryKey: ['user-address', user?.id] });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message || 'Não foi possível atualizar suas informações.',
        variant: 'destructive'
      });
    }
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const response = await apiRequest('PUT', `/api/users/${user.id}/password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
        variant: 'default'
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message || 'Não foi possível alterar sua senha.',
        variant: 'destructive'
      });
    }
  });

  // Manipular mudanças no formulário de informações pessoais
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Formatação específica para CPF
    if (name === 'cpf') {
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 11) formattedValue = formattedValue.substring(0, 11);

      // Formatar CPF: 000.000.000-00
      if (formattedValue.length > 9) {
        formattedValue = `${formattedValue.substring(0, 3)}.${formattedValue.substring(3, 6)}.${formattedValue.substring(6, 9)}-${formattedValue.substring(9)}`;
      } else if (formattedValue.length > 6) {
        formattedValue = `${formattedValue.substring(0, 3)}.${formattedValue.substring(3, 6)}.${formattedValue.substring(6)}`;
      } else if (formattedValue.length > 3) {
        formattedValue = `${formattedValue.substring(0, 3)}.${formattedValue.substring(3)}`;
      }

      setPersonalInfo(prev => ({ ...prev, [name]: formattedValue }));
    }
    // Formatação específica para telefone
    else if (name === 'phone') {
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 11) formattedValue = formattedValue.substring(0, 11);

      // Formatar telefone: (00) 00000-0000
      if (formattedValue.length > 6) {
        formattedValue = `(${formattedValue.substring(0, 2)}) ${formattedValue.substring(2, 7)}-${formattedValue.substring(7)}`;
      } else if (formattedValue.length > 2) {
        formattedValue = `(${formattedValue.substring(0, 2)}) ${formattedValue.substring(2)}`;
      }

      setPersonalInfo(prev => ({ ...prev, [name]: formattedValue }));
    }
    else {
      setPersonalInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manipular mudanças no formulário de alteração de senha
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Submeter formulário de informações pessoais
  const handleSubmitPersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!personalInfo.name || !personalInfo.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e e-mail são campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    updateProfileMutation.mutate(personalInfo);
  };

  // Submeter formulário de alteração de senha
  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Todos os campos são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive'
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  // Manipular salvamento do endereço
  const handleAddressSave = () => {
    toast({
      title: 'Endereço salvo',
      description: 'Seu endereço foi salvo com sucesso.',
      variant: 'default'
    });
    refetchAddress();
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>
            Você precisa estar logado para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="personal">
            <User className="mr-2 h-4 w-4" />
            Informações Pessoais
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="mr-2 h-4 w-4" />
            Endereço
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais. Estes dados serão usados para entrega e faturamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPersonalInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={personalInfo.name}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="(00) 00000-0000"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={personalInfo.cpf}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Data de nascimento</Label>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      value={personalInfo.birthdate}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
              <CardDescription>
                Atualize seu endereço de entrega. Este endereço será usado para calcular o frete e entregar seus pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addressLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Carregando endereço...</span>
                </div>
              ) : (
                <AddressForm
                  initialAddress={addressData}
                  onSave={handleAddressSave}
                  showCard={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Atualize sua senha para manter sua conta segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

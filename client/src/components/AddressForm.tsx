import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Save, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FrenetAddressResponse, getAddressByCEP } from '@/lib/frenetService';
import { formatPostalCode } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAddress, UserAddress } from '@/hooks/use-user-data';

interface AddressFormProps {
  initialAddress?: FrenetAddressResponse;
  postalCode?: string;
  onSave?: (address: any) => void;
  onCancel?: () => void;
  showCard?: boolean;
  showSaveButton?: boolean;
}

export default function AddressForm({
  initialAddress,
  postalCode,
  onSave,
  onCancel,
  showCard = true,
  showSaveButton = true
}: AddressFormProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Estado do formulário
  const [formData, setFormData] = useState({
    postalCode: postalCode || initialAddress?.CEP || '',
    street: initialAddress?.Street || '',
    number: '',
    complement: '',
    district: initialAddress?.District || '',
    city: initialAddress?.City || '',
    state: initialAddress?.UF || '',
    country: 'Brasil'
  });

  // Atualizar o formulário quando o endereço inicial mudar
  useEffect(() => {
    if (initialAddress) {
      setFormData(prev => ({
        ...prev,
        postalCode: initialAddress.CEP || prev.postalCode,
        street: initialAddress.Street || prev.street,
        district: initialAddress.District || prev.district,
        city: initialAddress.City || prev.city,
        state: initialAddress.UF || prev.state
      }));
    }
  }, [initialAddress]);

  // Usar o hook personalizado para buscar o endereço do usuário
  const { address: userAddress, isLoading: isAddressLoading } = useUserAddress();

  // Usar o endereço do usuário quando estiver disponível
  useEffect(() => {
    if (userAddress && isAuthenticated) {
      // Verificar se já temos um endereço carregado
      if (formData.street && formData.city && formData.state) {
        return;
      }

      console.log('Endereço do usuário carregado do Supabase:', userAddress);

      setFormData(prev => ({
        ...prev,
        postalCode: userAddress.postalCode || prev.postalCode,
        street: userAddress.street || prev.street,
        number: userAddress.number || prev.number,
        complement: userAddress.complement || prev.complement,
        district: userAddress.district || prev.district,
        city: userAddress.city || prev.city,
        state: userAddress.state || prev.state,
        country: userAddress.country || prev.country
      }));

      // Se temos um callback onSave, notificar que temos um endereço
      if (onSave) {
        onSave(userAddress);
      }
    }
  }, [userAddress, isAuthenticated, onSave, formData.street, formData.city, formData.state]);

  // Atualizar o CEP quando ele mudar
  useEffect(() => {
    if (postalCode) {
      setFormData(prev => ({
        ...prev,
        postalCode
      }));

      // Buscar endereço automaticamente se o CEP tiver 8 dígitos
      if (postalCode.replace(/\D/g, '').length === 8) {
        lookupAddress(postalCode);
      }
    }
  }, [postalCode]);

  // Buscar endereço automaticamente quando o componente for montado
  useEffect(() => {
    // Se já temos um CEP válido no formulário, buscar o endereço
    const cep = formData.postalCode;
    if (cep && cep.replace(/\D/g, '').length === 8) {
      lookupAddress(cep);
    }
  }, []);

  // Não precisamos mais buscar o perfil do usuário aqui, pois já estamos usando o hook useUserAddress
  // que fornece os dados de endereço do usuário

  // Usar o hook personalizado para atualizar o endereço
  const { updateAddress } = useUserAddress();

  // Mutation para salvar o endereço
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      if (isAuthenticated && user?.id) {
        // Converter os dados do formulário para o formato esperado pela API
        const addressToSave: UserAddress = {
          postalCode: addressData.postalCode,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          district: addressData.district,
          city: addressData.city,
          state: addressData.state,
          country: addressData.country || 'Brasil'
        };

        console.log('Enviando dados de endereço para atualização:', addressToSave);

        // Usar a função do hook para salvar o endereço
        return updateAddress(addressToSave);
      } else {
        // Simular salvamento para usuário não autenticado
        return addressData;
      }
    },
    onSuccess: (data) => {
      console.log('Endereço salvo com sucesso:', data);
      toast({
        title: 'Endereço salvo',
        description: 'O endereço foi salvo com sucesso.',
        variant: 'default'
      });

      if (onSave) {
        onSave(data);
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: 'Erro ao salvar endereço',
        description: error.message || 'Não foi possível salvar o endereço.',
        variant: 'destructive'
      });
    }
  });

  // Mutation para buscar endereço por CEP
  const addressLookupMutation = useMutation({
    mutationFn: getAddressByCEP,
    onSuccess: (data) => {
      console.log("Resposta da busca de CEP:", data);

      if (data.Success) {
        // Atualizar o formulário com os dados do endereço
        setFormData(prev => ({
          ...prev,
          postalCode: data.CEP || prev.postalCode,
          street: data.Street || prev.street,
          district: data.District || prev.district,
          city: data.City || prev.city,
          state: data.UF || prev.state
        }));

        // Notificar silenciosamente (sem toast) que o endereço foi encontrado
        console.log('Endereço encontrado e preenchido automaticamente');

        // Não salvamos automaticamente nem disparamos o cálculo de frete aqui
        // O usuário precisará clicar no botão de salvar para isso
      } else {
        // CEP não encontrado ou erro na API - log silencioso
        console.warn('CEP não encontrado:', data.Msg);
      }
    },
    onError: (error: Error) => {
      // Erro silencioso (sem toast)
      console.error('Erro na busca de CEP:', error.message);
    }
  });

  // Consultar CEP automaticamente
  const lookupAddress = (cep: string) => {
    // Remover caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      console.log('Consultando CEP automaticamente:', cep);
      addressLookupMutation.mutate(cep);

      // Não disparamos o evento onSave aqui para evitar requisições desnecessárias
      // O usuário precisará clicar no botão de salvar para disparar o cálculo de frete
    }
  };

  // Manipular mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'postalCode') {
      // Formatar CEP
      let formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
      const formattedCep = formatPostalCode(formattedValue);

      setFormData(prev => ({
        ...prev,
        [name]: formattedCep
      }));

      // Se o CEP tiver 8 dígitos, buscar automaticamente
      if (formattedValue.length === 8) {
        lookupAddress(formattedCep);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Salvar endereço
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Não validamos campos obrigatórios para permitir checkout sem endereço completo
    saveAddressMutation.mutate(formData);
  };

  const content = (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">CEP</Label>
          <div className="flex space-x-2">
            <Input
              id="postalCode"
              name="postalCode"
              placeholder="00000-000"
              value={formData.postalCode}
              onChange={handleChange}
              maxLength={9}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => lookupAddress(formData.postalCode)}
              disabled={addressLookupMutation.isPending || formData.postalCode.replace(/\D/g, '').length !== 8}
            >
              {addressLookupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {addressLookupMutation.isPending && (
            <div className="text-xs text-muted-foreground mt-1">
              Buscando endereço...
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Rua/Avenida</Label>
          <Input
            id="street"
            name="street"
            placeholder="Nome da rua"
            value={formData.street}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            name="number"
            placeholder="123"
            value={formData.number}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            placeholder="Apto, Bloco, etc."
            value={formData.complement}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">Bairro</Label>
          <Input
            id="district"
            name="district"
            placeholder="Bairro"
            value={formData.district}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            placeholder="Cidade"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            placeholder="UF"
            value={formData.state}
            onChange={handleChange}
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            name="country"
            placeholder="País"
            value={formData.country}
            onChange={handleChange}
            disabled
          />
        </div>
      </div>

      {saveAddressMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {saveAddressMutation.error instanceof Error
              ? saveAddressMutation.error.message
              : 'Erro ao salvar endereço'}
          </AlertDescription>
        </Alert>
      )}

      {showSaveButton && (
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}

          <Button type="submit" disabled={saveAddressMutation.isPending}>
            {saveAddressMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Endereço
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );

  return showCard ? (
    <Card>
      <CardContent className="pt-6">{content}</CardContent>
      {!showSaveButton && onSave && (
        <CardFooter>
          <Button onClick={() => onSave(formData)} className="w-full">
            Continuar
          </Button>
        </CardFooter>
      )}
    </Card>
  ) : content;
}

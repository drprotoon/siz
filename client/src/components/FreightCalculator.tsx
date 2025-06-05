import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, AlertCircle, MapPin, LogIn, Clock } from 'lucide-react';
import { formatPostalCode, isValidPostalCode, formatCurrency } from '@/lib/utils';
import PostalCodeLookup from '@/components/PostalCodeLookup';
import AddressForm from '@/components/AddressForm';
import AuthForm from '@/components/AuthForm';
// Frenet integrado ao freight-client
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces para o cálculo de frete
interface FreightOption {
  name: string;
  price: number;
  estimatedDays: string;
}

interface FreightCalculationResponse {
  options: FreightOption[];
  postalCode: string;
}

interface FreightCalculatorProps {
  productWeight: number;
  onSelect?: (option: { name: string; price: number }) => void;
}

export default function FreightCalculator({ productWeight, onSelect }: FreightCalculatorProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foundAddress, setFoundAddress] = useState<FrenetAddressResponse | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<FreightOption[]>([]);
  const [postalCode, setPostalCode] = useState<string>('');
  const [formattedPostalCode, setFormattedPostalCode] = useState<string>('');

  // Mutation para calcular o frete (mantida para compatibilidade com o código existente)
  const calculateFreightMutation = useMutation<
    FreightCalculationResponse,
    Error,
    { postalCode: string; weight: number }
  >({
    mutationFn: async (data: { postalCode: string; weight: number }) => {
      try {
        const response = await apiRequest("POST", "/api/freight/calculate", data);
        const result = await response.json();
        console.log("Resposta do cálculo de frete:", result);
        return result;
      } catch (error) {
        console.error("Erro ao calcular frete:", error);
        throw new Error("Não foi possível calcular o frete. Por favor, tente novamente mais tarde.");
      }
    },
    onSuccess: (data) => {
      console.log("Cálculo de frete bem-sucedido:", data);
      if (data.options.length === 0) {
        setError("Não foi possível encontrar opções de entrega para este CEP. Verifique se o CEP está correto.");
      } else {
        // Armazenar as opções de frete
        setShippingOptions(data.options);
      }
    },
    onError: (error) => {
      console.error("Erro na mutação de cálculo de frete:", error);
      setError(error.message);
    }
  });

  // Função para lidar com o endereço encontrado pelo componente PostalCodeLookup
  const handleAddressFound = (address: FrenetAddressResponse) => {
    if (address.Success && address.CEP) {
      const cep = address.CEP.replace(/\D/g, '');
      setPostalCode(cep);
      setFormattedPostalCode(formatPostalCode(cep));
      setFoundAddress(address);

      // Mostrar formulário de endereço se o usuário estiver logado
      if (isAuthenticated) {
        setShowAddressForm(true);
        toast({
          title: "Endereço encontrado",
          description: "Confirme ou edite os dados do endereço para continuar.",
          variant: "default"
        });
      } else {
        // Mostrar formulário de autenticação se o usuário não estiver logado
        setShowAuthForm(true);
        toast({
          title: "Faça login ou cadastre-se",
          description: "Para salvar seu endereço, faça login ou crie uma conta.",
          variant: "default"
        });
      }

      // Calcular o frete automaticamente quando o endereço for encontrado
      calculateFreightMutation.mutate({
        postalCode: cep,
        weight: productWeight
      });
    }
  };

  // Função para lidar com o salvamento do endereço
  const handleAddressSave = (addressData: any) => {
    toast({
      title: "Endereço salvo",
      description: "O endereço foi salvo com sucesso.",
      variant: "default"
    });

    setShowAddressForm(false);
  };

  // Função para lidar com o sucesso da autenticação
  const handleAuthSuccess = () => {
    setShowAuthForm(false);
    setShowAddressForm(true);

    toast({
      title: "Autenticação realizada",
      description: "Agora você pode salvar seu endereço.",
      variant: "default"
    });
  };

  const handleOptionSelect = (optionName: string) => {
    setSelectedOption(optionName);

    if (calculateFreightMutation.data && onSelect) {
      const option = calculateFreightMutation.data.options.find(
        (opt: FreightOption) => opt.name === optionName
      );

      if (option) {
        onSelect(option);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center"><Truck className="mr-2" size={20} /> Cálculo de Frete</CardTitle>
        <CardDescription>Informe seu CEP para calcular o frete</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!showAddressForm && !showAuthForm ? (
            <PostalCodeLookup
              onAddressFound={handleAddressFound}
              onError={(error) => setError(error.message)}
              showCard={false}
              productWeight={productWeight}
              sellerCEP="74591-990"
              onShippingOptionSelect={(option) => {
                // Criar uma opção de frete no formato esperado pelo componente
                const freightOption: FreightOption = {
                  name: `${option.Carrier} - ${option.ServiceDescription}`,
                  price: option.ShippingPrice,
                  estimatedDays: `Entrega em até ${option.DeliveryTime} dias úteis`
                };

                // Selecionar a opção
                handleOptionSelect(freightOption.name);

                // Adicionar a opção ao estado de opções de frete se não existir
                if (!shippingOptions.some(opt => opt.name === freightOption.name)) {
                  setShippingOptions(prev => [...prev, freightOption]);
                }
              }}
            />
          ) : showAddressForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  <h3 className="text-lg font-medium">Confirme seu endereço</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressForm(false)}
                >
                  Voltar
                </Button>
              </div>
              <AddressForm
                initialAddress={foundAddress || undefined}
                postalCode={formattedPostalCode}
                onSave={handleAddressSave}
                showCard={false}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LogIn className="h-5 w-5 text-primary mr-2" />
                  <h3 className="text-lg font-medium">Acesse sua conta</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthForm(false)}
                >
                  Voltar
                </Button>
              </div>
              <AuthForm
                onSuccess={handleAuthSuccess}
                showCard={false}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Exibir opções de frete do calculateFreightMutation (compatibilidade com código existente) */}
          {calculateFreightMutation.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Calculando opções de frete...</span>
            </div>
          )}

          {calculateFreightMutation.isSuccess && calculateFreightMutation.data && calculateFreightMutation.data.options && calculateFreightMutation.data.options.length > 0 && (
            <div className="mt-4">
              <Label>Opções de Entrega</Label>
              <RadioGroup value={selectedOption || ''} onValueChange={handleOptionSelect} className="mt-2">
                {calculateFreightMutation.data.options.map((option: FreightOption, index: number) => (
                  <div key={index} className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={option.name} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-muted-foreground">{option.estimatedDays}</div>
                      </Label>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(option.price)}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Valores calculados via API dos Correios. Prazo estimado a partir da data de postagem.
      </CardFooter>
    </Card>
  );
}
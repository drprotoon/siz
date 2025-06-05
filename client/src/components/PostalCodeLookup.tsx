import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Truck, Clock, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Frenet integrado ao freight-client
import AddressDisplay from '@/components/AddressDisplay';
import ShippingOptionsModal from '@/components/ShippingOptionsModal';
import { formatPostalCode, formatCurrency } from '@/lib/utils';

interface PostalCodeLookupProps {
  onAddressFound?: (address: FrenetAddressResponse) => void;
  onError?: (error: Error) => void;
  showCard?: boolean;
  productWeight?: number;
  sellerCEP?: string;
  onShippingOptionSelect?: (option: FrenetShippingService) => void;
}

export default function PostalCodeLookup({
  onAddressFound,
  onError,
  showCard = true,
  productWeight = 0.5, // Default weight in kg
  sellerCEP = "74591-990", // Default seller CEP
  onShippingOptionSelect
}: PostalCodeLookupProps) {
  const { toast } = useToast();
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState<FrenetAddressResponse | null>(null);
  const [shippingOptions, setShippingOptions] = useState<FrenetShippingService[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShippingOption, setSelectedShippingOption] = useState<string | null>(null);

  // Mutation para calcular o frete
  const shippingQuoteMutation = useMutation({
    mutationFn: async (cep: string) => {
      try {
        console.log("Calculando frete para CEP:", cep);
        setIsCalculatingShipping(true);

        // Preparar os itens para a cotação
        // Converter o peso de gramas para quilogramas para a API da Frenet
        const weightInKg = productWeight / 1000;
        console.log("Convertendo peso de", productWeight, "g para", weightInKg, "kg");

        const shippingItems = [{
          Height: 10,
          Length: 15,
          Width: 15,
          Weight: weightInKg, // Peso em kg
          Quantity: 1,
          SKU: "product-1"
        }];

        // Preparar a requisição para a API da Frenet
        const request: FrenetQuoteRequest = {
          SellerCEP: sellerCEP.replace(/\D/g, ''),
          RecipientCEP: cep.replace(/\D/g, ''),
          ShipmentInvoiceValue: 100, // Valor padrão para exemplo
          ShippingServiceCode: null,
          ShippingItemArray: shippingItems,
          RecipientCountry: "BR"
        };

        console.log("Requisição de frete preparada:", request);

        // Chamar a função que faz a requisição para o servidor
        const response = await getShippingQuote(request);
        console.log("Resposta da cotação de frete:", response);

        return response;
      } catch (error) {
        console.error("Erro ao calcular frete:", error);
        throw error;
      } finally {
        setIsCalculatingShipping(false);
      }
    },
    onSuccess: (data) => {
      console.log("Cotação de frete bem-sucedida:", data);

      // Verificar se temos serviços disponíveis no novo formato
      if (data.ShippingSeviceAvailableArray && data.ShippingSeviceAvailableArray.length > 0) {
        const services = data.ShippingSeviceAvailableArray;
        console.log("Serviços de frete disponíveis:", services.length);

        // Adaptar os serviços para o formato esperado pelo componente
        const adaptedServices = services.map(service => ({
          Carrier: service.Carrier,
          ServiceDescription: service.ServiceDescription,
          ServiceCode: service.ServiceCode,
          CarrierCode: service.CarrierCode,
          ShippingPrice: service.ShippingPrice,
          DeliveryTime: service.DeliveryTime,
          Error: false
        }));

        toast({
          title: "Frete calculado com sucesso",
          description: `${services.length} opções de entrega encontradas.`,
          variant: "default",
        });
        setShippingOptions(adaptedServices);
      }
      // Verificar o formato antigo para compatibilidade
      else if (data.ShippingSevicesArray && data.ShippingSevicesArray.length > 0) {
        // Filtrar serviços com erro
        const validServices = data.ShippingSevicesArray.filter(
          service => !service.Error && service.ShippingPrice > 0
        );

        console.log("Serviços de frete válidos (formato antigo):", validServices.length);

        if (validServices.length > 0) {
          toast({
            title: "Frete calculado com sucesso",
            description: `${validServices.length} opções de entrega encontradas.`,
            variant: "default",
          });
          setShippingOptions(validServices);
        } else {
          toast({
            title: "Nenhuma opção de frete disponível",
            description: "Não foi possível encontrar opções de frete para este CEP.",
            variant: "destructive",
          });
          setShippingOptions([]);
        }
      }
      // Nenhum serviço disponível
      else {
        toast({
          title: "Nenhuma opção de frete disponível",
          description: data.Message || data.Msg || "Não foi possível calcular o frete para este CEP.",
          variant: "destructive",
        });
        setShippingOptions([]);
      }
    },
    onError: (error: any) => {
      console.error("Erro na mutação de cálculo de frete:", error);
      toast({
        title: "Erro no cálculo de frete",
        description: error.message || "Não foi possível calcular o frete. Tente novamente mais tarde.",
        variant: "destructive",
      });
      setShippingOptions([]);
    },
  });

  // Função para calcular o frete
  const calculateShipping = (cep: string) => {
    if (cep.replace(/\D/g, '').length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Por favor, digite um CEP válido com 8 dígitos.",
        variant: "destructive",
      });
      return;
    }

    shippingQuoteMutation.mutate(cep);
  };

  // Função para lidar com a seleção de opção de frete
  const handleShippingOptionSelect = (option: FrenetShippingService) => {
    setSelectedShippingOption(option.ServiceCode);

    if (onShippingOptionSelect) {
      onShippingOptionSelect(option);
    }

    toast({
      title: "Opção de entrega selecionada",
      description: `${option.Carrier} - ${option.ServiceDescription} por ${formatCurrency(option.ShippingPrice)}`,
      variant: "default",
    });

    setIsModalOpen(false);
  };

  // Mutation para buscar endereço por CEP
  const addressLookupMutation = useMutation({
    mutationFn: getAddressByCEP,
    onSuccess: (data) => {
      console.log("Resposta da busca de CEP:", data);

      // Verificar se temos pelo menos a cidade e o estado, mesmo que não tenha rua e bairro
      const hasCityAndState = data && data.City && data.UF;

      // Considerar como sucesso se tiver pelo menos cidade e estado
      if (hasCityAndState) {
        // Forçar o campo Success como true para CEPs que retornam apenas cidade e estado
        data.Success = true;

        // Atualizar o estado do endereço
        setAddress(data);

        // Preparar a descrição do endereço
        let addressDescription = '';
        if (data.Street) {
          addressDescription += `${data.Street}`;
          if (data.District) addressDescription += `, ${data.District}`;
        }

        if (addressDescription) {
          addressDescription += `, ${data.City} - ${data.UF}`;
        } else {
          addressDescription = `${data.City} - ${data.UF}`;
        }

        // Endereço encontrado com sucesso
        toast({
          title: 'Endereço encontrado',
          description: addressDescription,
          variant: 'default',
        });

        if (onAddressFound) {
          onAddressFound(data);
        }

        // Calcular frete quando o endereço for encontrado
        calculateShipping(data.CEP);
      } else {
        // CEP realmente não encontrado ou erro na API
        const errorMsg = data?.Msg || 'CEP não encontrado';
        console.log("Erro na busca de CEP:", errorMsg);

        toast({
          title: 'CEP não encontrado',
          description: errorMsg,
          variant: 'destructive',
        });

        // Limpar o endereço em caso de erro
        setAddress(null);
        // Limpar opções de frete
        setShippingOptions([]);

        if (onError) {
          onError(new Error(errorMsg));
        }
      }
    },
    onError: (error: Error) => {
      console.error("Erro na requisição de busca de CEP:", error);

      // Limpar o endereço em caso de erro
      setAddress(null);
      // Limpar opções de frete
      setShippingOptions([]);

      toast({
        title: 'Erro na busca de CEP',
        description: error.message || 'Não foi possível buscar o endereço para este CEP.',
        variant: 'destructive',
      });

      if (onError) {
        onError(error);
      }
    },
  });

  // Formatar o CEP enquanto o usuário digita
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    setPostalCode(formatPostalCode(value));
  };

  // Buscar endereço
  const handleLookupAddress = () => {
    if (postalCode.replace(/\D/g, '').length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, digite um CEP válido com 8 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    addressLookupMutation.mutate(postalCode);
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="postalCode">CEP</Label>
        <div className="flex space-x-2">
          <Input
            id="postalCode"
            placeholder="00000-000"
            value={postalCode}
            onChange={handlePostalCodeChange}
            maxLength={9}
          />
          <Button
            onClick={handleLookupAddress}
            disabled={addressLookupMutation.isPending}
          >
            {addressLookupMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar'
            )}
          </Button>
        </div>
      </div>

      {addressLookupMutation.isPending && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm">Buscando endereço...</span>
        </div>
      )}

      {!addressLookupMutation.isPending && addressLookupMutation.isError && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {addressLookupMutation.error instanceof Error
              ? addressLookupMutation.error.message
              : 'Erro ao buscar endereço'}
          </AlertDescription>
        </Alert>
      )}

      {!addressLookupMutation.isPending && !addressLookupMutation.isError && address === null && postalCode.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            CEP não encontrado. Verifique se o CEP está correto.
          </AlertDescription>
        </Alert>
      )}

      {address && address.Success && (
        <div className="mt-2">
          <AddressDisplay address={address} showCard={false} />
        </div>
      )}

      {/* Exibir informações de frete quando disponíveis */}
      {shippingOptions.length > 0 && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Opções de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {shippingOptions.slice(0, 2).map((option, index) => (
                  <div
                    key={index}
                    className="border p-3 rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => handleShippingOptionSelect(option)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{option.Carrier} - {option.ServiceDescription}</p>
                        <p className="text-sm flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Entrega em até {option.DeliveryTime} dias úteis
                        </p>
                      </div>
                      <p className="font-bold text-lg">{formatCurrency(option.ShippingPrice)}</p>
                    </div>
                  </div>
                ))}

                {shippingOptions.length > 2 && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Ver todas as {shippingOptions.length} opções
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para exibir todas as opções de frete */}
      <ShippingOptionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        options={shippingOptions}
        selectedOption={selectedShippingOption}
        onSelect={handleShippingOptionSelect}
      />

      {/* Exibir loader enquanto calcula o frete */}
      {isCalculatingShipping && (
        <div className="mt-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span>Calculando opções de frete...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return showCard ? <Card><CardContent className="pt-6">{content}</CardContent></Card> : content;
}

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { getShippingQuote, type FrenetQuoteRequest, type FrenetShippingService } from "@/lib/frenetService";
import { Truck, Package, Clock } from "lucide-react";
import { useShipping } from "@/contexts/ShippingContext";
import { useCart } from "@/contexts/CartContext";

interface ShippingCalculatorProps {
  onSelectShipping: (shipping: FrenetShippingService) => void;
  sellerCEP: string;
}

export default function ShippingCalculator({
  onSelectShipping,
  sellerCEP
}: ShippingCalculatorProps) {
  // Usar o contexto do carrinho
  const { cartItems } = useCart();
  const { toast } = useToast();
  const [cep, setCep] = useState("");
  const { selectedShipping, setSelectedShipping, setShippingOptions } = useShipping();

  // Mutation para calcular o frete
  const shippingQuoteMutation = useMutation({
    mutationFn: async (cep: string) => {
      try {
        console.log("Calculando frete para CEP:", cep);

        // Preparar os itens para a cotação
        const shippingItems = cartItems.map(item => {
          // Converter o peso para número e garantir que seja um valor válido
          let weight = 0.5; // valor padrão
          if (item.product.weight) {
            // Se o peso for uma string, converter para número
            if (typeof item.product.weight === 'string') {
              weight = parseFloat(item.product.weight.replace(/[^\d.-]/g, ''));
            } else {
              weight = item.product.weight;
            }
            // Garantir que o peso seja um número válido
            if (isNaN(weight) || weight <= 0) {
              weight = 0.5; // valor padrão se inválido
            }
          }

          return {
            Height: item.product.height || 10,
            Length: item.product.length || 15,
            Width: item.product.width || 15,
            Weight: weight,
            Quantity: item.quantity,
            SKU: item.product.sku || item.product.id.toString()
          };
        });

        // Calcular o valor total do pedido
        const invoiceValue = cartItems.reduce(
          (sum, item) => sum + (parseFloat(item.product.price) * item.quantity),
          0
        );

        // Preparar a requisição para a API da Frenet
        const request: FrenetQuoteRequest = {
          SellerCEP: sellerCEP.replace(/\D/g, ''),
          RecipientCEP: cep.replace(/\D/g, ''),
          ShipmentInvoiceValue: invoiceValue,
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
      }
    },
    onSuccess: (data) => {
      console.log("Cotação de frete bem-sucedida:", data);

      if (data.ShippingSevicesArray && data.ShippingSevicesArray.length > 0) {
        // Filtrar serviços com erro
        const validServices = data.ShippingSevicesArray.filter(
          service => !service.Error && service.ShippingPrice > 0
        );

        // Salvar as opções de frete no contexto
        setShippingOptions(validServices);

        console.log("Serviços de frete válidos:", validServices.length);

        if (validServices.length === 0) {
          toast({
            title: "Nenhuma opção de frete disponível",
            description: "Não foi possível encontrar opções de frete para este CEP.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Frete calculado com sucesso",
            description: `${validServices.length} opções de entrega encontradas.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Erro no cálculo de frete",
          description: data.Msg || "Não foi possível calcular o frete. Verifique o CEP e tente novamente.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Erro na mutação de cálculo de frete:", error);
      toast({
        title: "Erro no cálculo de frete",
        description: error.message || "Não foi possível calcular o frete. Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Formatar o CEP enquanto o usuário digita
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5);
    setCep(value);
  };

  // Calcular o frete
  const handleCalculateShipping = () => {
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

  // Selecionar uma opção de frete
  const handleSelectShipping = (shipping: FrenetShippingService) => {
    // Salvar a opção de frete selecionada no contexto
    setSelectedShipping(shipping);
    console.log('Opção de frete salva no contexto:', shipping);

    // Chamar o callback para notificar o componente pai
    onSelectShipping(shipping);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-medium mb-3">Calcular Frete</h3>

      <div className="flex space-x-2 mb-4">
        <div className="flex-1">
          <Label htmlFor="cep" className="sr-only">CEP</Label>
          <Input
            id="cep"
            placeholder="Digite seu CEP"
            value={cep}
            onChange={handleCepChange}
            maxLength={9}
          />
        </div>
        <Button
          onClick={handleCalculateShipping}
          disabled={shippingQuoteMutation.isPending}
        >
          {shippingQuoteMutation.isPending ? "Calculando..." : "Calcular"}
        </Button>
      </div>

      {shippingQuoteMutation.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {shippingQuoteMutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
          <span>Calculando opções de frete...</span>
        </div>
      )}

      {shippingQuoteMutation.isError && (
        <div className="text-center p-4 border border-red-200 bg-red-50 rounded-md">
          <p className="text-red-700">
            Ocorreu um erro ao calcular o frete. Por favor, tente novamente.
          </p>
        </div>
      )}

      {shippingQuoteMutation.isSuccess && shippingQuoteMutation.data && (
        <div className="mt-2">
          {shippingQuoteMutation.data.ShippingSevicesArray &&
           shippingQuoteMutation.data.ShippingSevicesArray.filter(service => !service.Error && service.ShippingPrice > 0).length > 0 ? (
            <RadioGroup value={selectedShipping?.ServiceCode || ""}>
              {shippingQuoteMutation.data.ShippingSevicesArray
                .filter(service => !service.Error && service.ShippingPrice > 0)
                .map((service) => (
                  <div
                    key={service.ServiceCode}
                    className={`border p-3 rounded-md mb-2 cursor-pointer hover:border-primary ${
                      selectedShipping?.ServiceCode === service.ServiceCode ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectShipping(service)}
                  >
                    <div className="flex items-center">
                      <RadioGroupItem
                        value={service.ServiceCode}
                        id={service.ServiceCode}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <Label htmlFor={service.ServiceCode} className="font-medium cursor-pointer">
                            {service.Carrier} - {service.ServiceDescription}
                          </Label>
                          <span className="font-bold">{formatCurrency(service.ShippingPrice)}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock size={14} className="mr-1" />
                          <span>Entrega em até {service.DeliveryTime} dias úteis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </RadioGroup>
          ) : (
            <div className="text-center p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <p className="text-yellow-700">
                {shippingQuoteMutation.data.Msg || "Não encontramos opções de frete para este CEP."}
                <br />
                Verifique se o CEP está correto ou entre em contato conosco.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        <p>Não sabe seu CEP? <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Consulte aqui</a></p>
      </div>
    </div>
  );
}

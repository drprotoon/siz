import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { trackShipment, FrenetTrackingRequest, FrenetTrackingEvent } from "@/lib/frenetService";
import { Package, Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface OrderTrackingProps {
  initialTrackingNumber?: string;
  initialShippingServiceCode?: string;
}

export default function OrderTracking({
  initialTrackingNumber = "",
  initialShippingServiceCode = ""
}: OrderTrackingProps) {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [shippingServiceCode, setShippingServiceCode] = useState(initialShippingServiceCode);
  const [trackingEvents, setTrackingEvents] = useState<FrenetTrackingEvent[]>([]);

  // Mutation para rastrear o pedido
  const trackingMutation = useMutation({
    mutationFn: async () => {
      const request: FrenetTrackingRequest = {
        TrackingNumber: trackingNumber,
        ShippingServiceCode: shippingServiceCode
      };
      return trackShipment(request);
    },
    onSuccess: (data) => {
      if (data.Success && data.TrackingEvents && data.TrackingEvents.length > 0) {
        setTrackingEvents(data.TrackingEvents);
      } else {
        toast({
          title: "Informações de rastreamento não encontradas",
          description: data.Msg || "Não foi possível encontrar informações de rastreamento para este código.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro no rastreamento",
        description: error.message || "Não foi possível rastrear o pedido. Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Rastrear o pedido
  const handleTrackOrder = () => {
    if (!trackingNumber) {
      toast({
        title: "Código de rastreamento necessário",
        description: "Por favor, digite o código de rastreamento do pedido.",
        variant: "destructive",
      });
      return;
    }

    trackingMutation.mutate();
  };

  // Formatar data e hora
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateTimeStr;
    }
  };

  // Determinar o status atual do pedido
  const getOrderStatus = () => {
    if (!trackingEvents || trackingEvents.length === 0) return "Aguardando informações";
    
    const lastEvent = trackingEvents[0];
    const description = lastEvent.EventDescription.toLowerCase();
    
    if (description.includes("entregue")) return "Entregue";
    if (description.includes("saiu para entrega")) return "Saiu para entrega";
    if (description.includes("em trânsito")) return "Em trânsito";
    if (description.includes("postado")) return "Postado";
    
    return "Em processamento";
  };

  // Ícone para o status do pedido
  const getStatusIcon = () => {
    const status = getOrderStatus();
    
    switch (status) {
      case "Entregue":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "Saiu para entrega":
        return <Truck className="h-6 w-6 text-blue-500" />;
      case "Em trânsito":
        return <Truck className="h-6 w-6 text-yellow-500" />;
      case "Postado":
        return <Package className="h-6 w-6 text-purple-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Rastreamento de Pedido
        </CardTitle>
        <CardDescription>
          Acompanhe o status de entrega do seu pedido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackingNumber">Código de Rastreamento</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ex: BR1234567890"
              />
            </div>
            <div>
              <Label htmlFor="shippingServiceCode">Código do Serviço (opcional)</Label>
              <Input
                id="shippingServiceCode"
                value={shippingServiceCode}
                onChange={(e) => setShippingServiceCode(e.target.value)}
                placeholder="Ex: 04014"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleTrackOrder}
            disabled={trackingMutation.isPending}
            className="w-full"
          >
            {trackingMutation.isPending ? "Rastreando..." : "Rastrear Pedido"}
          </Button>

          {trackingMutation.isPending && (
            <div className="space-y-4 mt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {trackingEvents.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Status atual</h3>
                  <p className="text-lg font-bold">{getOrderStatus()}</p>
                </div>
                {getStatusIcon()}
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Histórico de rastreamento</h3>
                <div className="space-y-4">
                  {trackingEvents.map((event, index) => (
                    <div key={index} className="relative pl-6 pb-4">
                      {index < trackingEvents.length - 1 && (
                        <div className="absolute top-2 left-[9px] bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="absolute top-2 left-0 w-[18px] h-[18px] rounded-full bg-primary"></div>
                      <div className="ml-4">
                        <p className="font-medium">{event.EventDescription}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(event.EventDateTime)} • {event.EventLocation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

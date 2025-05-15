import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Truck, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ShippingOption {
  ServiceCode: string;
  ServiceDescription: string;
  Carrier: string;
  CarrierCode?: string;
  ShippingPrice: number;
  DeliveryTime: number | string;
}

interface ShippingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ShippingOption[];
  selectedOption: string | null;
  onSelect: (option: ShippingOption) => void;
}

export default function ShippingOptionsModal({
  isOpen,
  onClose,
  options,
  selectedOption,
  onSelect
}: ShippingOptionsModalProps) {
  const handleSelect = (serviceCode: string) => {
    const option = options.find(opt => opt.ServiceCode === serviceCode);
    if (option) {
      onSelect(option);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Opções de Entrega
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {options.length > 0 ? (
            <RadioGroup 
              value={selectedOption || ''} 
              onValueChange={handleSelect}
              className="space-y-3"
            >
              {options.map((option, index) => (
                <div key={index} className="border p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.ServiceCode} 
                        id={`shipping-option-${index}`} 
                      />
                      <Label 
                        htmlFor={`shipping-option-${index}`} 
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">{option.Carrier} - {option.ServiceDescription}</div>
                        <div className="text-sm flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Entrega em até {option.DeliveryTime} dias úteis
                        </div>
                      </Label>
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(option.ShippingPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma opção de entrega disponível para este CEP.
            </p>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={onClose} 
            disabled={!selectedOption || options.length === 0}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

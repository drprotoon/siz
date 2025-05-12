import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, AlertCircle } from 'lucide-react';
import { formatPostalCode, isValidPostalCode } from '../lib/freightService';

interface FreightCalculatorProps {
  productWeight: number;
  onSelect?: (option: { name: string; price: number }) => void;
}

interface FreightOption {
  name: string;
  price: number;
  estimatedDays: string;
}

export default function FreightCalculator({ productWeight, onSelect }: FreightCalculatorProps) {
  const [postalCode, setPostalCode] = useState<string>('');
  const [formattedPostalCode, setFormattedPostalCode] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateFreightMutation = useMutation<
    { options: FreightOption[] },
    Error,
    { postalCode: string; weight: number }
  >({
    mutationFn: async (data: { postalCode: string; weight: number }) => {
      const response = await apiRequest('/api/freight/calculate', 'POST', data);
      return response.json();
    },
  });

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPostalCode(value);
    
    // Format for display
    const formatted = formatPostalCode(value);
    setFormattedPostalCode(formatted);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!postalCode) {
      setError('Por favor, insira um CEP.');
      return;
    }
    
    if (!isValidPostalCode(postalCode)) {
      setError('CEP inválido. O formato correto é 00000-000.');
      return;
    }
    
    calculateFreightMutation.mutate({
      postalCode: postalCode,
      weight: productWeight
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
        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="postalCode">CEP</Label>
            <div className="flex space-x-2">
              <Input
                id="postalCode"
                placeholder="00000-000"
                value={formattedPostalCode}
                onChange={handlePostalCodeChange}
                className="flex-1"
                maxLength={9}
              />
              <Button 
                type="submit" 
                disabled={calculateFreightMutation.isPending}
                className="whitespace-nowrap"
              >
                {calculateFreightMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando</>
                ) : 'Calcular'}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {calculateFreightMutation.isSuccess && calculateFreightMutation.data.options.length > 0 && (
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
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Prazo estimado a partir da data de postagem.
      </CardFooter>
    </Card>
  );
}
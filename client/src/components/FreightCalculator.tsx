import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

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
  const [postalCode, setPostalCode] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateFreightMutation = useMutation({
    mutationFn: async (postalCode: string) => {
      const response = await apiRequest("POST", "/api/freight/calculate", {
        postalCode,
        weight: productWeight
      });
      return response.json();
    },
    onError: (error) => {
      toast({
        title: "Error calculating freight",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleCalculate = () => {
    if (!postalCode || postalCode.length < 5) {
      toast({
        title: "Invalid postal code",
        description: "Please enter a valid postal code.",
        variant: "destructive",
      });
      return;
    }

    calculateFreightMutation.mutate(postalCode);
  };

  const handleSelectOption = (optionName: string) => {
    setSelectedOption(optionName);
    
    if (onSelect && calculateFreightMutation.data) {
      const option = calculateFreightMutation.data.options.find(
        (opt: FreightOption) => opt.name === optionName
      );
      if (option) {
        onSelect(option);
      }
    }
  };

  return (
    <Card className="border border-gray-200 rounded-lg">
      <CardContent className="p-4 bg-gray-50">
        <h3 className="font-medium mb-3">Calculate Shipping</h3>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter postal code"
            className="flex-1"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
          <Button
            onClick={handleCalculate}
            disabled={calculateFreightMutation.isPending}
            className="bg-primary hover:bg-pink-600 text-white"
          >
            {calculateFreightMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Calculate"
            )}
          </Button>
        </div>

        {calculateFreightMutation.isSuccess && calculateFreightMutation.data && (
          <div className="mt-3">
            <RadioGroup
              value={selectedOption || ''}
              onValueChange={handleSelectOption}
              className="space-y-2"
            >
              {calculateFreightMutation.data.options.map((option: FreightOption, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <RadioGroupItem 
                      value={option.name} 
                      id={`shipping-${index}`} 
                      className="mr-2" 
                    />
                    <Label htmlFor={`shipping-${index}`} className="flex flex-col">
                      <span>{option.name}</span>
                      <span className="text-sm text-gray-500">({option.estimatedDays})</span>
                    </Label>
                  </div>
                  <span className="font-medium">{formatCurrency(option.price)}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

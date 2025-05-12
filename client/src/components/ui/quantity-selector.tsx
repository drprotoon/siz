import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

export function QuantitySelector({
  initialValue = 1,
  min = 1,
  max = 99,
  onChange
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialValue);

  const increment = () => {
    if (quantity < max) {
      const newValue = quantity + 1;
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const decrement = () => {
    if (quantity > min) {
      const newValue = quantity - 1;
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      setQuantity(value);
      onChange?.(value);
    }
  };

  return (
    <div className="flex border border-gray-300 rounded-md">
      <Button 
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-l-md text-gray-600 hover:text-primary hover:bg-transparent"
        onClick={decrement}
        disabled={quantity <= min}
      >
        <Minus size={16} />
      </Button>
      <Input
        type="text"
        value={quantity}
        onChange={handleChange}
        className="w-12 h-10 text-center border-x border-gray-300 rounded-none focus-visible:ring-0"
      />
      <Button 
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-r-md text-gray-600 hover:text-primary hover:bg-transparent"
        onClick={increment}
        disabled={quantity >= max}
      >
        <Plus size={16} />
      </Button>
    </div>
  );
}

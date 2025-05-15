import { FrenetAddressResponse } from '@/lib/frenetService';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';

interface AddressDisplayProps {
  address: FrenetAddressResponse;
  showCard?: boolean;
  className?: string;
}

export default function AddressDisplay({
  address,
  showCard = true,
  className = ''
}: AddressDisplayProps) {
  if (!address || !address.Success) {
    return null;
  }

  const content = (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center text-primary font-medium">
        <MapPin className="h-4 w-4 mr-1" />
        <span>Endereço encontrado</span>
      </div>
      <div className="flex items-start">
        <Home className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground" />
        <div className="text-sm">
          {address.Street && <p><strong>{address.Street}</strong></p>}
          <p>
            {address.District ? `${address.District}, ` : ''}
            {address.City} - {address.UF}
          </p>
          <p>CEP: {address.CEP}</p>
        </div>
      </div>
    </div>
  );

  return showCard ? (
    <Card>
      <CardContent className="pt-4">
        {content}
      </CardContent>
    </Card>
  ) : content;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostalCodeLookup from "@/components/PostalCodeLookup";

export default function FreightTest() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Cálculo de Frete</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Buscar CEP e Calcular Frete</CardTitle>
          </CardHeader>
          <CardContent>
            <PostalCodeLookup 
              productWeight={0.5} 
              sellerCEP="74591-990"
              showCard={false}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

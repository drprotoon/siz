import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getShippingInfo, FrenetShippingInfo } from '@/lib/frenetService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Componente para exibir informações da conta Frenet
 */
export default function FrenetInfoPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery<FrenetShippingInfo>({
    queryKey: ['frenet-info'],
    queryFn: getShippingInfo,
    retry: 1,
    refetchOnWindowFocus: false
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Info className="mr-2" size={20} /> Informações da Frenet
        </CardTitle>
        <CardDescription>Status da integração com a API de frete</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando informações...</span>
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível obter informações da Frenet. 
              {error instanceof Error ? ` ${error.message}` : ''}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Status:</span>
              <span className="ml-2">{data?.Success ? 'Conectado' : 'Desconectado'}</span>
            </div>
            
            {data?.CompanyName && (
              <div className="flex items-start">
                <span className="font-medium w-32">Empresa:</span>
                <span>{data.CompanyName}</span>
              </div>
            )}
            
            {data?.CompanyDocument && (
              <div className="flex items-start">
                <span className="font-medium w-32">CNPJ:</span>
                <span>{data.CompanyDocument}</span>
              </div>
            )}
            
            {data?.Token && (
              <div className="flex items-start">
                <span className="font-medium w-32">Token:</span>
                <span className="break-all">{data.Token.substring(0, 10)}...</span>
              </div>
            )}
            
            {data?.TokenDueDate && (
              <div className="flex items-start">
                <span className="font-medium w-32">Validade:</span>
                <span>{new Date(data.TokenDueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {data?.Message && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Mensagem</AlertTitle>
                <AlertDescription>{data.Message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            'Atualizar'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

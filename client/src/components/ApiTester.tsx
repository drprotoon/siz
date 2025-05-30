import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApiTester() {
  const { toast } = useToast();
  const [result, setResult] = useState<any>(null);

  // Mutation to test the API health endpoint
  const testApiMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'API Connection Successful',
        description: 'The API is working correctly.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'API Connection Failed',
        description: error.message || 'Could not connect to the API.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to test the API test endpoint with POST
  const testPostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'POST Request Successful',
        description: 'The API POST endpoint is working correctly.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'POST Request Failed',
        description: error.message || 'Could not send POST request to the API.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Connection Tester</CardTitle>
        <CardDescription>
          Test the connection to the backend API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={() => testApiMutation.mutate()}
              disabled={testApiMutation.isPending}
            >
              {testApiMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test API Health'
              )}
            </Button>
            
            <Button
              onClick={() => testPostMutation.mutate()}
              disabled={testPostMutation.isPending}
              variant="outline"
            >
              {testPostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing POST...
                </>
              ) : (
                'Test POST Request'
              )}
            </Button>
          </div>

          {(testApiMutation.isPending || testPostMutation.isPending) && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Testing API connection...</span>
            </div>
          )}

          {(testApiMutation.isError || testPostMutation.isError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {testApiMutation.error instanceof Error
                  ? testApiMutation.error.message
                  : testPostMutation.error instanceof Error
                  ? testPostMutation.error.message
                  : 'Error connecting to the API'}
              </AlertDescription>
            </Alert>
          )}

          {(testApiMutation.isSuccess || testPostMutation.isSuccess) && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                API connection successful.
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">API Response:</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        <p>
          This test sends requests to the API endpoints to verify connectivity.
          If successful, it means your frontend can communicate with the backend.
        </p>
      </CardFooter>
    </Card>
  );
}

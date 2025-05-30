import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthTester() {
  const { toast } = useToast();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [result, setResult] = useState<any>(null);

  // Mutation to test the auth status endpoint
  const testAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Auth Status Retrieved',
        description: 'Successfully retrieved authentication status.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Auth Status Failed',
        description: error.message || 'Could not retrieve authentication status.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to test the protected endpoint
  const testProtectedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/protected', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Protected Route Access',
        description: 'Successfully accessed protected route.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Protected Route Failed',
        description: error.message || 'Could not access protected route.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to test the admin-only endpoint
  const testAdminMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/admin-only', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Admin Route Access',
        description: 'Successfully accessed admin route.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Admin Route Failed',
        description: error.message || 'Could not access admin route.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Tester</CardTitle>
        <CardDescription>
          Test your authentication status and route access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="text-sm font-medium mb-2">Current Auth Status:</h3>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
            {user && (
              <div className="mt-2">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => testAuthMutation.mutate()}
              disabled={testAuthMutation.isPending}
            >
              {testAuthMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Auth Status'
              )}
            </Button>
            
            <Button
              onClick={() => testProtectedMutation.mutate()}
              disabled={testProtectedMutation.isPending}
              variant="outline"
            >
              {testProtectedMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Protected Route'
              )}
            </Button>
            
            <Button
              onClick={() => testAdminMutation.mutate()}
              disabled={testAdminMutation.isPending}
              variant="secondary"
            >
              {testAdminMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Admin Route'
              )}
            </Button>
          </div>

          {(testAuthMutation.isError || testProtectedMutation.isError || testAdminMutation.isError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {testAuthMutation.error instanceof Error
                  ? testAuthMutation.error.message
                  : testProtectedMutation.error instanceof Error
                  ? testProtectedMutation.error.message
                  : testAdminMutation.error instanceof Error
                  ? testAdminMutation.error.message
                  : 'Error testing authentication'}
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
          Use these tests to verify your authentication status and access to protected routes.
        </p>
      </CardFooter>
    </Card>
  );
}

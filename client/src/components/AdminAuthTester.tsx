import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '../hooks/use-toast';

export function AdminAuthTester() {
  const { user, isAdmin, isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Testing login with consolidated auth endpoint...');

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        // Store the token and user data
        if (data.session?.access_token) {
          localStorage.setItem('auth-token', data.session.access_token);
        }
        
        login(data.user, data.session?.access_token);
        
        toast({
          title: 'Login Successful',
          description: `Logged in as ${data.user.username} (${data.user.role})`,
          variant: 'default',
        });

        setTestResults(data);
      } else {
        toast({
          title: 'Login Failed',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
        setTestResults(data);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'Network or server error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminCheck = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({
          title: 'No Token',
          description: 'Please login first',
          variant: 'destructive',
        });
        return;
      }

      console.log('Testing admin check...');
      
      const response = await fetch('/api/auth/admin-check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Admin check response:', data);

      setTestResults(data);

      if (response.ok && data.isAdmin) {
        toast({
          title: 'Admin Access Confirmed',
          description: 'You have admin privileges',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Admin Access Denied',
          description: data.error || 'Not an admin user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Admin check error:', error);
      toast({
        title: 'Admin Check Error',
        description: 'Network or server error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDebugEndpoint = async () => {
    setIsLoading(true);
    try {
      console.log('Testing debug endpoint...');
      
      const response = await fetch('/api/auth/debug', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Debug response:', data);
      setTestResults(data);

      toast({
        title: 'Debug Info Retrieved',
        description: 'Check console for details',
        variant: 'default',
      });
    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: 'Debug Error',
        description: 'Network or server error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Authentication Tester</CardTitle>
        <CardDescription>
          Test admin login and access for debugging purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={testLogin} disabled={isLoading}>
            Test JWT Login
          </Button>
          <Button onClick={testAdminCheck} disabled={isLoading} variant="outline">
            Test Admin Check
          </Button>
          <Button onClick={testDebugEndpoint} disabled={isLoading} variant="outline">
            Test Debug Info
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h4 className="font-medium mb-2">Current Auth State:</h4>
          <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
          <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? `${user.username} (${user.role})` : 'None'}</p>
          <p><strong>Token:</strong> {localStorage.getItem('auth-token') ? 'Present' : 'None'}</p>
        </div>

        {testResults && (
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Last Test Results:</h4>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { AdminAuthTester } from '../components/AdminAuthTester';

export default function AuthTest() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Testing</h1>
        <AdminAuthTester />
      </div>
    </div>
  );
}

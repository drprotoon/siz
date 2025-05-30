/**
 * Simple JavaScript router for compatibility with the built JavaScript files
 * This file provides a basic router implementation that can be used in production
 * when the TypeScript files are compiled to JavaScript.
 */

import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { useBrowserLocation } from 'wouter/use-browser-location';

// Helper function to create a router
export function createRouter(routes, NotFoundComponent) {
  return function RouterComponent() {
    return (
      <Router hook={useBrowserLocation}>
        <Switch>
          {routes.map((route, index) => (
            <Route 
              key={index} 
              path={route.path} 
              component={route.component} 
            />
          ))}
          <Route component={NotFoundComponent} />
        </Switch>
      </Router>
    );
  };
}

// Helper function to create a protected route
export function createProtectedRoute(component, isAuthenticated, fallbackComponent) {
  return function ProtectedRouteComponent() {
    return isAuthenticated ? React.createElement(component) : React.createElement(fallbackComponent);
  };
}

// Helper function to create an admin route
export function createAdminRoute(component, isAdmin, NotFoundComponent) {
  return function AdminRouteComponent() {
    return isAdmin ? React.createElement(component) : React.createElement(NotFoundComponent);
  };
}

export default {
  createRouter,
  createProtectedRoute,
  createAdminRoute
};

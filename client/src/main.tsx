import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { useBrowserLocation } from "wouter/use-browser-location";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router hook={useBrowserLocation}>
        <App />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);

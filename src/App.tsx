import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex-client";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import LabRecorder from "./pages/LabRecorder";
import NotFound from "./pages/NotFound";
import { ThemeEngine } from "./components/ThemeEngine";
import { ConvexErrorBoundary } from "./components/ConvexErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  // Suppress unhandled Convex errors that bypass error boundaries
  React.useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('CONVEX')) {
        event.preventDefault();
        console.warn('Suppressed Convex rejection:', event.reason.message?.slice(0, 80));
      }
    };
    const errorHandler = (event: ErrorEvent) => {
      if (event.message?.includes('CONVEX')) {
        event.preventDefault();
        console.warn('Suppressed Convex error:', event.message?.slice(0, 80));
      }
    };
    window.addEventListener('unhandledrejection', handler);
    window.addEventListener('error', errorHandler);
    return () => {
      window.removeEventListener('unhandledrejection', handler);
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ConvexErrorBoundary fallback={<></>}>
            <ThemeEngine />
          </ConvexErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/recorder" element={<LabRecorder />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

export default App;

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
              <Route path="/admin" element={
                <ConvexErrorBoundary fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center space-y-4"><h1 className="text-2xl font-bold text-foreground">Admin Panel</h1><p className="text-muted-foreground">Convex backend is unavailable. Please deploy your functions first.</p><p className="text-sm text-muted-foreground font-mono">npx convex deploy</p><a href="/" className="text-primary underline block mt-4">← Back to site</a></div></div>}>
                  <Admin />
                </ConvexErrorBoundary>
              } />
              <Route path="/admin/recorder" element={
                <ConvexErrorBoundary fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Convex unavailable. <a href="/" className="text-primary underline">Go home</a></p></div>}>
                  <LabRecorder />
                </ConvexErrorBoundary>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ConvexProvider>
  );
};

export default App;

import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const Home = lazy(() => import("@/pages/home"));
const ImpactAnalysis = lazy(() => import("@/pages/impact-analysis"));
const TechLeadCV = lazy(() => import("@/pages/tech-lead-cv"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/impact-analysis" component={ImpactAnalysis} />
      <Route path="/tech-lead-cv" component={TechLeadCV} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-2xl font-semibold">Loading...</div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<Loading />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

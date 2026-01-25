import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SelectGlacier from "@/pages/SelectGlacier";
import Simulation from "@/pages/Simulation";
import Results from "@/pages/Results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex-1 w-full flex flex-col">
      <Switch>
        <Route path="/" component={SelectGlacier} />
        <Route path="/simulate/:id" component={Simulation} />
        <Route path="/results" component={Results} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="w-full min-h-screen bg-[#020617] text-slate-200 flex flex-col overflow-x-hidden">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

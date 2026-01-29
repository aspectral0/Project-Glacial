import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { BrainCircuit, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AIForecastProps {
  glacierName: string;
  stats: {
    thickness: number;
    stability: number;
    volume: number;
  };
  environment: {
    globalTemp: number;
    snowfall: number;
    emissions: number;
    oceanTemp: number;
  };
}

export function AIForecast({ glacierName, stats, environment }: AIForecastProps) {
  const [lastPrediction, setLastPrediction] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.ai.predict.path, {
        glacierName,
        stats,
        environment
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastPrediction(data.prediction);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      mutation.mutate();
    }, 2000);
    return () => clearTimeout(timer);
  }, [environment]);

  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-blue-500/60 mb-2 border-b border-white/5 pb-2 flex items-center gap-2">
        <BrainCircuit className="w-3 h-3" />
        AI Analysis
        {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
      </h3>
      
      <div className="stat-card rounded-lg p-4 relative overflow-hidden">
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-purple-400/50" />
        </div>
        
        {mutation.isError ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Analysis unavailable</span>
          </div>
        ) : lastPrediction ? (
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-slate-300 font-medium">
              "{lastPrediction}"
            </p>
            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              AI GLACIOLOGIST // LIVE
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-mono">Analyzing environmental vectors...</span>
          </div>
        )}
      </div>
    </section>
  );
}

import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2 } from "lucide-react";
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

  // Debounced effect for AI calls
  useEffect(() => {
    const timer = setTimeout(() => {
      mutation.mutate();
    }, 2000);
    return () => clearTimeout(timer);
  }, [environment]);

  return (
    <Card className="bg-slate-900/50 border-blue-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-mono text-blue-400 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4" />
          AI GLACIOLOGIST FORECAST
        </CardTitle>
        {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
      </CardHeader>
      <CardContent>
        {lastPrediction ? (
          <p className="text-xs leading-relaxed text-slate-300 italic">
            "{lastPrediction}"
          </p>
        ) : (
          <p className="text-xs text-slate-500">Analyzing environmental vectors...</p>
        )}
      </CardContent>
    </Card>
  );
}

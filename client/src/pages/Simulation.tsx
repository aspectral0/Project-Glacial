import { useParams, useLocation } from "wouter";
import { useGlacier } from "@/hooks/use-glaciers";
import { useSimulation } from "@/hooks/use-simulation";
import { GlacierCanvas } from "@/components/GlacierCanvas";
import { EnvironmentalControls } from "@/components/EnvironmentalControls";
import { AIForecast } from "@/components/AIForecast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, RefreshCw, Play, Pause, Activity, Gauge, Layers, Mountain } from "lucide-react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function Simulation() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { data: glacier, isLoading, error } = useGlacier(Number(id));
  const { toast } = useToast();
  
  const { 
    state, 
    startSimulation, 
    pauseSimulation, 
    setEnvironmentFactor 
  } = useSimulation(glacier);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Glacier",
        description: "Failed to load glacier data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const unlockedGlaciers = JSON.parse(localStorage.getItem('unlocked_glaciers') || '{}');
    if (!isLoading && id && !unlockedGlaciers[id]) {
      setLocation("/");
    }
  }, [id, isLoading, setLocation]);

  useEffect(() => {
    if (state?.isGameOver) {
      setTimeout(() => {
        const queryParams = new URLSearchParams({
          outcome: state.gameResult || 'lost',
          year: String(state.year),
          glacier: glacier?.name || 'Unknown',
          volume: String(state.glacierStats.volume),
          stability: String(state.glacierStats.stability),
          thickness: String(state.glacierStats.thickness)
        });
        setLocation(`/results?${queryParams.toString()}`);
      }, 2000);
    }
  }, [state?.isGameOver, state?.gameResult, state?.year, state?.glacierStats, glacier?.name, setLocation]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] grid-bg flex flex-col items-center justify-center gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-12 text-center max-w-lg space-y-6"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-red-400">Failed to Load Glacier Data</h2>
            <p className="text-slate-400 text-sm">
              Unable to retrieve glacier information. This may be due to a network issue.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-600" data-testid="button-retry-simulation">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-500" data-testid="button-back-home">
              Back to Selection
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading || !state) {
    return (
      <div className="min-h-screen bg-[#020617] grid-bg flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Mountain className="w-8 h-8 text-blue-400 absolute inset-0 m-auto" />
        </div>
        <div className="text-center space-y-2">
          <div className="text-blue-400 font-mono tracking-widest uppercase text-sm">
            Initializing Glacial Environment
          </div>
          <div className="text-slate-500 text-xs font-mono">Loading simulation parameters...</div>
        </div>
      </div>
    );
  }

  const healthColor = state.health > 70 ? 'text-green-400' : state.health > 40 ? 'text-yellow-400' : 'text-red-400';
  const healthBg = state.health > 70 ? 'bg-green-500' : state.health > 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col text-slate-200 overflow-hidden">
      <header className="h-16 border-b border-white/5 glass-panel-dark flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/')} 
            className="hover:bg-white/10 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Button>
          <div>
            <h1 className="font-bold text-white text-sm uppercase tracking-tight flex items-center gap-2">
              <Mountain className="w-4 h-4 text-blue-400" />
              {glacier?.name}
            </h1>
            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-pulse" />
              SIMULATION UPLINK ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 font-mono">Year</div>
            <div className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {state.year}
            </div>
          </div>

          <div className="w-56">
            <div className="flex justify-between text-[9px] mb-2 uppercase tracking-wider font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                System Health
              </span>
              <span className={healthColor}>{state.health.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${healthBg} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${state.health}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <Button 
            onClick={state.isRunning ? pauseSimulation : startSimulation} 
            className={`font-mono font-bold uppercase tracking-wider px-6 btn-glow ${
              state.isRunning 
                ? 'bg-amber-600 hover:bg-amber-500' 
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
            }`}
            data-testid="button-toggle-simulation"
          >
            {state.isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                PAUSE
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                EXECUTE
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-slate-950/40 p-5">
          <GlacierCanvas stats={state.glacierStats} environment={state.environmentalFactors} />
          
          <AnimatePresence>
            {state.isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto" />
                  <h2 className="text-3xl font-bold text-white tracking-tight">SIMULATION TERMINATED</h2>
                  <p className="text-slate-400 font-mono text-sm">CALCULATING ENVIRONMENTAL IMPACT...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[340px] border-l border-white/5 glass-panel-dark flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="px-5 py-6 space-y-6 pb-12">
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-blue-400/70 mb-4 flex items-center gap-2">
                  <Gauge className="w-3 h-3" />
                  Environmental Vectors
                </h3>
                <EnvironmentalControls 
                  factors={state.environmentalFactors} 
                  onChange={setEnvironmentFactor}
                />
              </section>

              <AIForecast 
                glacierName={glacier?.name || ""}
                stats={state.glacierStats}
                environment={state.environmentalFactors}
              />

              <section className="space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-blue-400/70 flex items-center gap-2">
                  <Layers className="w-3 h-3" />
                  Telemetry Output
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatBox 
                    label="THICKNESS" 
                    value={state.glacierStats.thickness.toFixed(0)} 
                    unit="m" 
                    trend={state.environmentalFactors.globalTemp < 0 ? 'up' : 'down'}
                  />
                  <StatBox 
                    label="AREA" 
                    value={state.glacierStats.area.toFixed(0)} 
                    unit="km²" 
                    trend={state.glacierStats.area > (glacier?.surfaceArea || 0) * 0.9 ? 'stable' : 'down'}
                  />
                  <StatBox 
                    label="STABILITY" 
                    value={state.glacierStats.stability.toFixed(0)} 
                    unit="%" 
                    trend={state.glacierStats.stability > 70 ? 'up' : state.glacierStats.stability > 40 ? 'stable' : 'down'}
                    highlight={state.glacierStats.stability < 40}
                  />
                  <StatBox 
                    label="VOLUME" 
                    value={(state.glacierStats.volume / 1000).toFixed(1)} 
                    unit="k km³" 
                  />
                </div>
              </section>

              <section className="stat-card rounded-lg p-4">
                <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-2">Research Target</div>
                <div className="text-base font-semibold text-white flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-blue-400" />
                  {glacier?.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Sensitivity: {glacier?.tempSensitivity}/10
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  highlight?: boolean;
}

function StatBox({ label, value, unit, trend, highlight }: StatBoxProps) {
  return (
    <div className={`stat-card rounded-lg p-3 ${highlight ? 'border-red-500/30 bg-red-500/5' : ''}`}>
      <div className="text-[9px] text-slate-500 font-mono mb-1 tracking-widest uppercase flex items-center justify-between">
        {label}
        {trend && (
          <span className={`text-[10px] ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="text-lg font-mono font-bold text-white">
        {value}<span className="text-[10px] text-slate-500 ml-1 font-normal">{unit}</span>
      </div>
    </div>
  );
}

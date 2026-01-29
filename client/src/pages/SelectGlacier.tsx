import { useGlaciers, useRefreshGlaciers } from "@/hooks/use-glaciers";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IceDrillShooter } from "@/components/IceDrillShooter";
import { ArrowRight, Mountain, RefreshCw, AlertCircle, WifiOff, Satellite, Radar, Lock, Unlock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SelectGlacier() {
  const { data: glaciers, isLoading, error, refetch } = useGlaciers();
  const refreshMutation = useRefreshGlaciers();
  const { toast } = useToast();
  const [revealedStates, setRevealedStates] = useState<Record<number, boolean>>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('unlocked_glaciers') || '{}');
    }
    return {};
  });

  useEffect(() => {
    if (refreshMutation.isError) {
      toast({
        title: "Scan Failed",
        description: "Unable to discover new glaciers. The AI satellite uplink may be experiencing issues.",
        variant: "destructive",
      });
    }
    if (refreshMutation.isSuccess) {
      toast({
        title: "Scan Complete",
        description: "New glacier targets discovered and catalogued.",
      });
    }
  }, [refreshMutation.isError, refreshMutation.isSuccess, toast]);
  
  const handleRefresh = () => {
    setRevealedStates({});
    localStorage.removeItem('unlocked_glaciers');
    refreshMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] grid-bg noise-overlay p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[480px] w-full rounded-xl bg-slate-900/50 shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] grid-bg flex flex-col items-center justify-center text-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-12 text-center space-y-6 max-w-lg"
        >
          <div className="relative inline-block">
            <WifiOff className="w-20 h-20 text-red-500" />
            <AlertCircle className="w-8 h-8 text-red-400 absolute -bottom-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-red-400">SATELLITE UPLINK FAILED</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Unable to establish connection with the glacier monitoring network. 
            This could be due to network issues or server maintenance.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              className="border-slate-600 btn-glow"
              data-testid="button-retry-connection"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-500 btn-glow"
              data-testid="button-reload-page"
            >
              Reload Page
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const glacierList = glaciers || [];

  if (glacierList.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] grid-bg flex flex-col items-center justify-center text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-12 text-center space-y-6 max-w-lg"
        >
          <div className="relative">
            <Satellite className="w-20 h-20 text-blue-500 mx-auto float" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border border-blue-500/20 rounded-full radar-sweep" 
                   style={{ background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.1), transparent)' }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-blue-400 glow-text-blue">NO TARGETS DETECTED</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The satellite network has not catalogued any glaciers yet. 
            Initialize a scan to discover glacier targets in the monitoring zone.
          </p>
          <Button 
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 btn-glow px-8 py-6"
            data-testid="button-initial-scan"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            {refreshMutation.isPending ? 'SCANNING...' : 'INITIATE SCAN'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center py-12 relative overflow-y-auto overflow-x-hidden grid-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-[#020617] to-[#020617] z-0 pointer-events-none" />
      <div className="absolute inset-0 noise-overlay z-0 pointer-events-none" />
      
      <div className="relative z-20 container mx-auto px-4 max-w-7xl w-full page-transition">
        <header className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-2 mb-6"
          >
            <Radar className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase">
              Project Glacial // Sat-Sync v2.0
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase mb-4"
          >
            Select <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Target</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-mono text-xs mb-8 flex items-center justify-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-pulse" />
            LIVE SATELLITE TELEMETRY ACTIVE
          </motion.p>
          
          <Button 
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            className="glass-panel hover:bg-white/5 text-white font-mono text-xs tracking-widest uppercase btn-glow"
            data-testid="button-refresh-glaciers"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            {refreshMutation.isPending ? 'SCANNING...' : 'SCAN NEW GLACIERS'}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-12">
          {glacierList.map((glacier, index) => {
            const isUnlocked = revealedStates[glacier.id];
            return (
              <motion.div
                key={glacier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              >
                <Card className={`glass-panel rounded-xl p-6 flex flex-col h-full hover-lift transition-all duration-300 ${isUnlocked ? 'border-green-500/30' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-2.5 rounded-lg ${isUnlocked ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'} border`}>
                      <Mountain className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500 uppercase font-mono tracking-wider mb-1">Stability Index</div>
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-mono font-bold ${glacier.stability > 70 ? 'text-green-400' : glacier.stability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {glacier.stability}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">{glacier.name}</h2>
                  <p className="text-xs text-slate-400 mb-5 flex-grow leading-relaxed line-clamp-2">{glacier.description}</p>

                  <div className="stat-card rounded-lg p-4 mb-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Ice Thickness</span>
                      <span className="text-sm font-mono font-semibold text-white">{glacier.iceThickness}<span className="text-slate-500 text-[10px] ml-0.5">m</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Surface Area</span>
                      <span className="text-sm font-mono font-semibold text-white">{glacier.surfaceArea}<span className="text-slate-500 text-[10px] ml-0.5">km²</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">Thermal Sensitivity</span>
                      <div className="flex gap-0.5">
                        {[...Array(10)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-3 rounded-sm transition-all ${i < glacier.tempSensitivity ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]' : 'bg-slate-800'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <IceDrillShooter 
                      glacier={glacier} 
                      onComplete={() => {
                        setRevealedStates(prev => ({ ...prev, [glacier.id]: true }));
                        const unlocked = JSON.parse(localStorage.getItem('unlocked_glaciers') || '{}');
                        unlocked[glacier.id] = true;
                        localStorage.setItem('unlocked_glaciers', JSON.stringify(unlocked));
                      }}
                    />
                    
                    <Link href={`/simulate/${glacier.id}`}>
                      <Button 
                        className={`w-full h-11 font-semibold font-mono tracking-wide uppercase transition-all ${
                          isUnlocked 
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white btn-glow' 
                            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                        }`}
                        disabled={!isUnlocked}
                        data-testid={`button-simulate-${glacier.id}`}
                      >
                        {isUnlocked ? (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Launch Simulation
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Data Encrypted
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        <footer className="text-center py-8 border-t border-white/5">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
            Glacier Simulation Research Platform // Environmental Analysis Division
          </p>
        </footer>
      </div>
    </div>
  );
}

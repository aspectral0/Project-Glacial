import { useGlaciers } from "@/hooks/use-glaciers";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DrillMinigame } from "@/components/DrillMinigame";
import { ArrowRight, Mountain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useState } from "react";

export default function SelectGlacier() {
  const { data: glaciers, isLoading, error } = useGlaciers();
  const [revealedStates, setRevealedStates] = useState<Record<number, any>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px] w-full rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-mono text-red-500 mb-4">CONNECTION ERROR</h1>
        <Button onClick={() => window.location.reload()} className="bg-blue-600">RETRY SYNC</Button>
      </div>
    );
  }

  const glacierList = glaciers || [];

  if (glacierList.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-mono text-blue-500 mb-4">NO GLACIERS FOUND</h1>
        <p className="text-slate-400 mb-4">The satellite network returned no data.</p>
        <Button onClick={() => window.location.reload()} className="bg-blue-600">REFRESH</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center py-12 relative overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] z-0 pointer-events-none" />
      
      <div className="relative z-20 container mx-auto px-4 max-w-7xl w-full">
        <header className="text-center mb-16">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block mb-4">
            <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono tracking-widest uppercase">
              Project Glacial // Sat-Sync v1.0
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase mb-4">Select Target</h1>
          <p className="text-slate-400 font-mono text-xs">DECRYPTING REAL-TIME SATELLITE TELEMETRY...</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full pb-12">
          {glacierList.map((glacier, index) => (
            <motion.div
              key={glacier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 flex flex-col h-full hover:border-blue-500/40 transition-all shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Mountain className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Stability</div>
                    <div className="text-2xl font-mono font-bold text-white">{glacier.stability}%</div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">{glacier.name}</h2>
                <p className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed line-clamp-3 font-mono opacity-80">{glacier.description}</p>

                <div className="space-y-3 mb-8 bg-black/40 p-4 rounded border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 uppercase tracking-widest">Ice Thickness</span>
                    <span className="text-white font-bold">{glacier.iceThickness}m</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 uppercase tracking-widest">Sensitivity</span>
                    <div className="flex gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`w-1 h-3 rounded-sm ${i < glacier.tempSensitivity ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-slate-800'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <DrillMinigame 
                    glacier={glacier} 
                    onComplete={(revealed) => setRevealedStates(prev => ({ ...prev, [glacier.id]: true }))}
                  />
                  
                  <Link href={`/simulate/${glacier.id}`}>
                    <Button 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono tracking-widest uppercase transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                      disabled={!revealedStates[glacier.id]}
                    >
                      {revealedStates[glacier.id] ? 'INITIALIZE SIM' : 'DATA ENCRYPTED'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

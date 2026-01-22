import { useGlaciers } from "@/hooks/use-glaciers";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DrillAnalysis } from "@/components/DrillAnalysis";
import { ArrowRight, Mountain, ShieldAlert, Snowflake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function SelectGlacier() {
  const { data: glaciers, isLoading } = useGlaciers();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px] w-full rounded-2xl bg-card/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800 via-background to-background opacity-50 z-0" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col min-h-screen justify-center">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono tracking-widest uppercase">
              Project Glacial // v1.0
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white"
          >
            Select Target
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Analyze initial stability data and ice core samples. Select a glacier to manage its environmental conditions.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {glaciers?.map((glacier, index) => (
            <motion.div
              key={glacier.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="h-full bg-card/50 backdrop-blur border-white/10 p-6 flex flex-col hover:border-primary/50 hover:bg-card/80 transition-all duration-300 group shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                    <Mountain className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Stability</div>
                    <div className={`text-2xl font-bold font-mono ${
                      glacier.stability > 70 ? 'text-green-400' : glacier.stability > 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {glacier.stability}%
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {glacier.name}
                </h2>
                <p className="text-muted-foreground mb-8 flex-grow">
                  {glacier.description}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-slate-300"><Snowflake className="w-4 h-4 text-cyan-400" /> Ice Thickness</span>
                    <span className="font-mono text-white">{glacier.iceThickness}m</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-slate-300"><ShieldAlert className="w-4 h-4 text-red-400" /> Sensitivity</span>
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1 h-3 rounded-sm ${i < glacier.tempSensitivity ? 'bg-red-500' : 'bg-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <DrillAnalysis glacier={glacier} />
                  
                  <Link href={`/simulate/${glacier.id}`} className="block w-full">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 text-lg shadow-lg shadow-primary/20">
                      Initialize Simulation
                      <ArrowRight className="w-5 h-5 ml-2" />
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Glacier } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Pickaxe } from "lucide-react";

interface DrillAnalysisProps {
  glacier: Glacier;
}

export function DrillAnalysis({ glacier }: DrillAnalysisProps) {
  const { drillData } = glacier;

  // Format data for Recharts
  const chartData = drillData.historicalTemp.map((temp, i) => ({
    depth: i * 10,
    temp,
    co2: drillData.co2Levels[i],
    strength: drillData.layerStrength[i]
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 hover:text-primary gap-2">
          <Pickaxe className="w-4 h-4" />
          Drill Core Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 rounded bg-primary/20 text-primary"><Pickaxe className="w-6 h-6" /></span>
            Ice Core Analysis: {glacier.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          {/* Visual Core Representation */}
          <div className="space-y-2">
            <h4 className="text-sm font-mono uppercase text-muted-foreground">Core Sample Visual</h4>
            <div className="h-[400px] w-16 mx-auto rounded-full overflow-hidden border-2 border-slate-600 relative flex flex-col">
              {drillData.layerStrength.map((strength, i) => (
                <div 
                  key={i}
                  className="flex-1 w-full transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: `hsla(200, 80%, ${95 - (strength * 5)}%, ${0.6 + (strength * 0.04)})`,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  title={`Depth: ${i*10}m, Strength: ${strength}/10`}
                />
              ))}
              
              {/* Depth Markers */}
              <div className="absolute -right-12 top-0 h-full flex flex-col justify-between text-[10px] text-slate-500 font-mono py-1">
                <span>0m</span>
                <span>{(drillData.layerStrength.length * 10 / 2).toFixed(0)}m</span>
                <span>{drillData.layerStrength.length * 10}m</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="col-span-2 space-y-8">
            <div className="h-[180px]">
              <h4 className="text-sm font-mono uppercase text-muted-foreground mb-2">Historical Temperature (°C)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="depth" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[180px]">
              <h4 className="text-sm font-mono uppercase text-muted-foreground mb-2">Trapped CO₂ (ppm)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="depth" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="co2" stroke="#64748b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Thermometer, Snowflake, Factory, Waves } from "lucide-react";
import { SimulationState } from "@/hooks/use-simulation";

interface ControlsProps {
  factors: SimulationState['environmentalFactors'];
  onChange: (key: keyof SimulationState['environmentalFactors'], value: number) => void;
  disabled?: boolean;
}

export function EnvironmentalControls({ factors, onChange, disabled }: ControlsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Environmental Factors</h3>
      
      <ControlGroup
        icon={<Thermometer className="w-5 h-5 text-red-400" />}
        label="Global Temperature"
        value={factors.globalTemp}
        min={-5}
        max={5}
        step={0.1}
        format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°C`}
        onChange={(v) => onChange('globalTemp', v)}
        disabled={disabled}
      />

      <ControlGroup
        icon={<SnowfallIcon className="w-5 h-5 text-cyan-200" />}
        label="Snowfall Rate"
        value={factors.snowfall}
        min={0}
        max={2}
        step={0.1}
        format={(v) => `${(v * 100).toFixed(0)}%`}
        onChange={(v) => onChange('snowfall', v)}
        disabled={disabled}
      />

      <ControlGroup
        icon={<Factory className="w-5 h-5 text-gray-400" />}
        label="CO₂ Emissions"
        value={factors.emissions}
        min={0}
        max={2}
        step={0.1}
        format={(v) => `${(v * 100).toFixed(0)}%`}
        onChange={(v) => onChange('emissions', v)}
        disabled={disabled}
      />

      <ControlGroup
        icon={<Waves className="w-5 h-5 text-blue-500" />}
        label="Ocean Temperature"
        value={factors.oceanTemp}
        min={-2}
        max={2}
        step={0.1}
        format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°C`}
        onChange={(v) => onChange('oceanTemp', v)}
        disabled={disabled}
      />
    </div>
  );
}

function ControlGroup({ icon, label, value, min, max, step, format, onChange, disabled }: any) {
  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <Label className="font-medium text-slate-200">{label}</Label>
        </div>
        <span className="font-mono text-sm text-primary">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className="py-2"
      />
    </div>
  );
}

// Custom Snowfall Icon since lucide might not have exactly "Snowfall"
function SnowfallIcon({ className }: { className?: string }) {
  return <Snowflake className={className} />;
}

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Thermometer, Snowflake, Factory, Waves } from "lucide-react";
import { SimulationState } from "@/hooks/use-simulation";

interface ControlsProps {
  factors: SimulationState['environmentalFactors'];
  onChange: (key: keyof SimulationState['environmentalFactors'], value: number) => void;
  disabled?: boolean;
}

interface ControlGroupProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
  color: 'red' | 'cyan' | 'gray' | 'blue';
}

export function EnvironmentalControls({ factors, onChange, disabled }: ControlsProps) {
  return (
    <div className="space-y-4">
      <ControlGroup
        icon={<Thermometer className="w-4 h-4" />}
        label="Global Temperature"
        value={factors.globalTemp}
        min={-5}
        max={5}
        step={0.1}
        format={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°C`}
        onChange={(v: number) => onChange('globalTemp', v)}
        disabled={disabled}
        color="red"
      />

      <ControlGroup
        icon={<Snowflake className="w-4 h-4" />}
        label="Snowfall Rate"
        value={factors.snowfall}
        min={0}
        max={2}
        step={0.1}
        format={(v: number) => `${(v * 100).toFixed(0)}%`}
        onChange={(v: number) => onChange('snowfall', v)}
        disabled={disabled}
        color="cyan"
      />

      <ControlGroup
        icon={<Factory className="w-4 h-4" />}
        label="CO₂ Emissions"
        value={factors.emissions}
        min={0}
        max={2}
        step={0.1}
        format={(v: number) => `${(v * 100).toFixed(0)}%`}
        onChange={(v: number) => onChange('emissions', v)}
        disabled={disabled}
        color="gray"
      />

      <ControlGroup
        icon={<Waves className="w-4 h-4" />}
        label="Ocean Temperature"
        value={factors.oceanTemp}
        min={-2}
        max={2}
        step={0.1}
        format={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°C`}
        onChange={(v: number) => onChange('oceanTemp', v)}
        disabled={disabled}
        color="blue"
      />
    </div>
  );
}

function ControlGroup({ icon, label, value, min, max, step, format, onChange, disabled, color }: ControlGroupProps) {
  const colorClasses = {
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    gray: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  };

  const valueColorClasses = {
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    gray: 'text-slate-300',
    blue: 'text-blue-400'
  };

  return (
    <div className="stat-card rounded-lg p-4 transition-all duration-300 hover:border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-md border ${colorClasses[color]}`}>
            {icon}
          </div>
          <Label className="font-medium text-sm text-slate-300">{label}</Label>
        </div>
        <span className={`font-mono text-sm font-semibold ${valueColorClasses[color]}`}>
          {format(value)}
        </span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          disabled={disabled}
          className="py-1"
        />
        <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-1">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      </div>
    </div>
  );
}

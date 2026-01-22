import { useState, useEffect, useRef, useCallback } from "react";
import { Glacier } from "@shared/schema";

export interface SimulationState {
  year: number;
  isRunning: boolean;
  isGameOver: boolean;
  gameResult: "melted" | "survived" | null; // null if playing
  health: number;
  glacierStats: {
    thickness: number; // meters
    area: number; // sq km
    stability: number; // 0-100%
    volume: number; // calculated
  };
  environmentalFactors: {
    globalTemp: number; // offset C
    snowfall: number; // multiplier
    emissions: number; // multiplier
    oceanTemp: number; // offset C
  };
  history: {
    year: number;
    thickness: number;
    temp: number;
  }[];
}

const DEFAULT_ENV = {
  globalTemp: 0,
  snowfall: 1,
  emissions: 1,
  oceanTemp: 0,
};

export function useSimulation(initialGlacier: Glacier | undefined) {
  const [state, setState] = useState<SimulationState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state when glacier loads
  useEffect(() => {
    if (initialGlacier && !state) {
      setState({
        year: 2024,
        isRunning: false,
        isGameOver: false,
        gameResult: null,
        health: 100,
        glacierStats: {
          thickness: initialGlacier.iceThickness,
          area: initialGlacier.surfaceArea,
          stability: initialGlacier.stability,
          volume: initialGlacier.iceThickness * initialGlacier.surfaceArea,
        },
        environmentalFactors: { ...DEFAULT_ENV },
        history: [{
          year: 2024,
          thickness: initialGlacier.iceThickness,
          temp: 0
        }],
      });
    }
  }, [initialGlacier, state]);

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev || !prev.isRunning || prev.isGameOver) return prev;
      if (!initialGlacier) return prev;

      const { environmentalFactors: env, glacierStats: stats, year } = prev;

      // --- SIMULATION PHYSICS (Simplified) ---
      
      // 1. Calculate base temperature impact
      // Emissions increase global temp accumulation slightly each year if high
      const emissionImpact = (env.emissions - 1) * 0.1; 
      const effectiveGlobalTemp = env.globalTemp + emissionImpact;

      // 2. Melt Rate Calculation
      // Base melt + temp multiplier + ocean temp impact + sensitivity
      // Sensitivity is 1-10. 
      const sensitivityFactor = initialGlacier.tempSensitivity / 5; // normalize around 1-2
      const meltRate = Math.max(0, (effectiveGlobalTemp + (env.oceanTemp * 0.8) + 2) * sensitivityFactor);

      // 3. Accumulation Calculation
      // Snowfall increases mass, but high temps reduce snowfall effectiveness (turning to rain)
      const tempInhibition = Math.max(0.1, 1 - (effectiveGlobalTemp * 0.1));
      const accumulation = env.snowfall * 5 * tempInhibition; // Base accumulation of 5m/year at normal snowfall

      // 4. Net Change
      const thicknessChange = accumulation - meltRate;
      let newThickness = stats.thickness + thicknessChange;

      // 5. Area Change (area shrinks if thickness drops significantly)
      let newArea = stats.area;
      if (newThickness < initialGlacier.iceThickness * 0.5) {
        newArea = stats.area * 0.99; // Shrink 1% per year if thin
      }

      // 6. Stability Change
      // Drops if melting > accumulation for too long, or if ocean temp is high
      let stabilityChange = 0;
      if (meltRate > accumulation) stabilityChange -= 2;
      if (env.oceanTemp > 1) stabilityChange -= 1;
      if (accumulation > meltRate) stabilityChange += 1;

      const newStability = Math.min(100, Math.max(0, stats.stability + stabilityChange));
      
      // Check Game Over Conditions
      const isMelted = newThickness <= 0 || newArea <= 0;
      const isCollapsed = newStability <= 0;
      const isGameOver = isMelted || isCollapsed;
      
      // Calculate Health Score (Visual mostly)
      // Weighted average of Stability and Mass retention
      const massRatio = (newThickness * newArea) / (initialGlacier.iceThickness * initialGlacier.surfaceArea);
      const health = Math.min(100, Math.max(0, (newStability * 0.4) + (massRatio * 100 * 0.6)));

      return {
        ...prev,
        year: year + 1,
        isGameOver,
        gameResult: isGameOver ? "melted" : null,
        health,
        glacierStats: {
          thickness: Math.max(0, newThickness),
          area: Math.max(0, newArea),
          stability: newStability,
          volume: Math.max(0, newThickness * newArea),
        },
        history: [
          ...prev.history,
          { year: year + 1, thickness: Math.max(0, newThickness), temp: effectiveGlobalTemp }
        ].slice(-50), // Keep last 50 points for charts
      };
    });
  }, [initialGlacier]);

  useEffect(() => {
    if (state?.isRunning && !state.isGameOver) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state?.isRunning, state?.isGameOver, tick]);

  const startSimulation = () => setState(prev => prev ? { ...prev, isRunning: true } : null);
  const pauseSimulation = () => setState(prev => prev ? { ...prev, isRunning: false } : null);
  
  const setEnvironmentFactor = (key: keyof SimulationState['environmentalFactors'], value: number) => {
    setState(prev => prev ? {
      ...prev,
      environmentalFactors: {
        ...prev.environmentalFactors,
        [key]: value
      }
    } : null);
  };

  return {
    state,
    startSimulation,
    pauseSimulation,
    setEnvironmentFactor,
  };
}

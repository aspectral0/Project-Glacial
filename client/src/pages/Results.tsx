import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useSubmitScore } from "@/hooks/use-glaciers";
import { useEffect, useState } from "react";

export default function Results() {
  const [_, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('outcome');
  const year = Number(params.get('year'));
  const glacierName = params.get('glacier') || 'Unknown Glacier';
  const finalVolume = Number(params.get('volume') || 0);
  const finalStability = Number(params.get('stability') || 0);
  const finalThickness = Number(params.get('thickness') || 0);
  
  const yearsSurvived = year - 2024;
  
  // New weighted scoring logic
  // (years * 10) + (finalVolume / 100) + (finalStability * 5) + (finalThickness / 10)
  const score = Math.max(0, Math.floor(
    (yearsSurvived * 10) + 
    (finalVolume / 100) + 
    (finalStability * 5) + 
    (finalThickness / 10)
  ));

  const submitScore = useSubmitScore();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted && outcome && glacierName) {
      submitScore.mutate({
        glacierName,
        yearsSurvived,
        finalIceVolume: Math.floor(finalVolume),
        finalStability: Math.floor(finalStability),
        finalThickness: Math.floor(finalThickness),
        score,
      });
      setSubmitted(true);
    }
  }, [submitted, outcome, glacierName, yearsSurvived, score, submitScore, finalVolume, finalStability, finalThickness]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 z-0" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 max-w-lg w-full"
      >
        <Card className="bg-slate-900/90 backdrop-blur-xl border-white/10 p-8 text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 mb-6 border border-white/10">
            {outcome === 'survived' ? (
              <Trophy className="w-10 h-10 text-yellow-400" />
            ) : (
              <div className="text-4xl">🧊</div>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            {outcome === 'survived' ? 'Mission Complete' : 'Glacier Lost'}
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            You managed to sustain the <span className="text-primary font-bold">{glacierName}</span> until year <span className="text-white font-mono font-bold">{year}</span>.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 text-left">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Duration</div>
              <div className="text-xl font-mono font-bold text-white">{yearsSurvived} <span className="text-xs">yrs</span></div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Score</div>
              <div className="text-xl font-mono font-bold text-primary">{score}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Final Mass</div>
              <div className="text-xl font-mono font-bold text-blue-400">{(finalVolume/1000).toFixed(1)} <span className="text-xs">km³</span></div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Final Health</div>
              <div className="text-xl font-mono font-bold text-green-400">{finalStability.toFixed(0)}%</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menu
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={() => {
                // Clear any local state if needed and redirect
                setLocation('/');
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

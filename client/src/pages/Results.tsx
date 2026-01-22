import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { useSubmitScore } from "@/hooks/use-glaciers";
import { useEffect, useState } from "react";

export default function Results() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('outcome');
  const year = Number(params.get('year'));
  const glacierName = params.get('glacier') || 'Unknown Glacier';
  
  const yearsSurvived = year - 2024;
  const score = yearsSurvived * 100;

  const submitScore = useSubmitScore();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted && outcome && glacierName) {
      submitScore.mutate({
        glacierName,
        yearsSurvived,
        finalIceVolume: 0, // Simplified for now
        score,
        playedAt: new Date().toISOString(),
      });
      setSubmitted(true);
    }
  }, [submitted, outcome, glacierName, yearsSurvived, score, submitScore]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://pixabay.com/get/g3b381a017165a2c4af450876c4aaa553b8694950117c4434fc4e9c3a7e7bff6ace1a1e068d772f60e297de5891dbfc85876b545d33242eb2f4eac8d1d9a590cc_1280.jpg')] opacity-10 bg-cover bg-center" />
      
      {/* Photo by USGS on Unsplash - Glacier Texture */}

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

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Duration</div>
              <div className="text-3xl font-mono font-bold text-white">{yearsSurvived} <span className="text-sm">years</span></div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Final Score</div>
              <div className="text-3xl font-mono font-bold text-primary">{score}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Menu
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

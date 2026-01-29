import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, Mountain, Activity, Gauge, Timer, Star, TrendingDown } from "lucide-react";
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
  
  const score = Math.max(0, Math.floor(
    (yearsSurvived * 10) + 
    (finalVolume / 100) + 
    (finalStability * 5) + 
    (finalThickness / 10)
  ));

  const submitScore = useSubmitScore();
  const [submitted, setSubmitted] = useState(false);

  const getGrade = (score: number) => {
    if (score >= 500) return { grade: 'S', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    if (score >= 300) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
    if (score >= 200) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (score >= 100) return { grade: 'C', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    return { grade: 'D', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' };
  };

  const gradeInfo = getGrade(score);

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

  const isSurvived = outcome === 'survived';

  return (
    <div className="min-h-screen bg-[#020617] grid-bg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent z-0 pointer-events-none" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="relative z-10 max-w-xl w-full page-transition"
      >
        <Card className="glass-panel rounded-2xl p-8 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            {isSurvived ? (
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 to-transparent" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent" />
            )}
          </div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${isSurvived ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border-2 mb-6 mx-auto`}
          >
            {isSurvived ? (
              <Trophy className="w-12 h-12 text-yellow-400" />
            ) : (
              <TrendingDown className="w-12 h-12 text-red-400" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isSurvived ? 'Mission Complete' : 'Glacier Lost'}
            </h1>
            
            <p className="text-slate-400 text-sm mb-8">
              You sustained <span className="text-white font-semibold">{glacierName}</span> until year <span className="text-blue-400 font-mono font-bold">{year}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-6 mb-8"
          >
            <div className={`px-6 py-4 rounded-xl border ${gradeInfo.bg}`}>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-mono">Grade</div>
              <div className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</div>
            </div>
            <div className="px-6 py-4 rounded-xl border bg-blue-500/10 border-blue-500/30">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-mono flex items-center gap-1">
                <Star className="w-3 h-3" />
                Score
              </div>
              <div className="text-4xl font-bold font-mono text-blue-400">{score}</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3 mb-8"
          >
            <StatCard 
              icon={<Timer className="w-4 h-4" />}
              label="Duration"
              value={yearsSurvived}
              unit="years"
              color="text-cyan-400"
            />
            <StatCard 
              icon={<Mountain className="w-4 h-4" />}
              label="Final Mass"
              value={(finalVolume/1000).toFixed(1)}
              unit="k km³"
              color="text-blue-400"
            />
            <StatCard 
              icon={<Activity className="w-4 h-4" />}
              label="Stability"
              value={finalStability.toFixed(0)}
              unit="%"
              color={finalStability > 50 ? "text-green-400" : "text-red-400"}
            />
            <StatCard 
              icon={<Gauge className="w-4 h-4" />}
              label="Thickness"
              value={finalThickness.toFixed(0)}
              unit="m"
              color="text-purple-400"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <Button 
              variant="outline" 
              className="flex-1 h-12 border-slate-700 hover:bg-white/5" 
              onClick={() => setLocation('/')}
              data-testid="button-back-menu"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Main Menu
            </Button>
            <Button 
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 btn-glow" 
              onClick={() => setLocation('/')}
              data-testid="button-play-again"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 pt-6 border-t border-white/5"
          >
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
              Score submitted to global leaderboard
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

function StatCard({ icon, label, value, unit, color }: StatCardProps) {
  return (
    <div className="stat-card p-4 rounded-xl text-left">
      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${color}`}>
        {value}
        <span className="text-xs text-slate-500 ml-1 font-normal">{unit}</span>
      </div>
    </div>
  );
}

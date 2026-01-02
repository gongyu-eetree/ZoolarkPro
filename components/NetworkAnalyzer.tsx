
import React, { useState, useEffect, useRef } from 'react';
import { NetworkConfig } from '../types';
import { Share2, Play, Square, Activity } from 'lucide-react';

interface NetworkAnalyzerProps {
  state: NetworkConfig;
  onUpdate: (val: Partial<NetworkConfig>) => void;
}

const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ state, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!state.running) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onUpdate({ running: false });
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [state.running]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      const y = (i / 10) * height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (progress > 0) {
      // Gain Plot (dB)
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      for (let x = 0; x < (progress / 100) * width; x++) {
        // Simulated low-pass filter response
        const normalizedX = x / width;
        const gain = normalizedX < 0.4 ? 0.2 : 0.2 + (normalizedX - 0.4) * 0.8;
        const y = (height * 0.2) + (gain * height * 0.6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Phase Plot (Deg) - dotted
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      for (let x = 0; x < (progress / 100) * width; x++) {
         const normalizedX = x / width;
         const phase = normalizedX < 0.3 ? 0.3 : normalizedX * 0.9;
         const y = (height * 0.1) + (phase * height * 0.8);
         if (x === 0) ctx.moveTo(x, y);
         else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [progress]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <Share2 size={16} className="text-blue-500" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Network Analysis (Bode)</h3>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onUpdate({ running: !state.running })}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.running ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-50'}`}
          >
            {state.running ? <Square size={14} /> : <Play size={14} />}
            {state.running ? 'STOP SWEEP' : 'START SWEEP'}
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex-1 relative bg-black/40 rounded-xl border border-slate-800 overflow-hidden min-h-[300px]">
           <canvas ref={canvasRef} width={1000} height={500} className="w-full h-full object-fill" />
           
           {/* Progress Bar */}
           <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-75" style={{ width: `${progress}%` }} />
           
           {/* Legends */}
           <div className="absolute top-4 right-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <div className="w-3 h-1 bg-blue-500" /> <span className="text-blue-400">GAIN (dB)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <div className="w-3 h-1 bg-amber-500" /> <span className="text-amber-400">PHASE (°)</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <SweepParam label="Start Frequency" value={state.startFreq} unit="Hz" onUpdate={v => onUpdate({ startFreq: v })} />
          <SweepParam label="Stop Frequency" value={state.stopFreq} unit="Hz" onUpdate={v => onUpdate({ stopFreq: v })} />
          <SweepParam label="Points" value={state.points} unit="pts" onUpdate={v => onUpdate({ points: v })} />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Sweep Status</span>
            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 ${state.running ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              <Activity size={12} className={state.running ? 'animate-pulse' : ''} />
              {state.running ? `Sweeping... ${progress}%` : 'Ready to Sweep'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SweepParam: React.FC<{ label: string; value: number; unit: string; onUpdate: (v: number) => void }> = ({ label, value, unit, onUpdate }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</label>
    <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex items-center justify-between">
      <input 
        type="number" 
        value={value} 
        onChange={e => onUpdate(parseInt(e.target.value))}
        className="bg-transparent w-full text-xs font-mono text-white focus:outline-none"
      />
      <span className="text-[10px] text-slate-500 font-bold">{unit}</span>
    </div>
  </div>
);

export default NetworkAnalyzer;

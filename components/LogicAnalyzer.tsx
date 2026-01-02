
import React, { useRef, useEffect, useState } from 'react';
import { InstrumentState } from '../types';
import { Play, Square, Activity } from 'lucide-react';

interface LogicAnalyzerProps {
  state: InstrumentState;
  isRunning: boolean;
  onUpdate: (val: Partial<InstrumentState['logicAnalyzer']>) => void;
}

const LogicAnalyzer: React.FC<LogicAnalyzerProps> = ({ state, isRunning, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const channels = 16;
  const { triggerMode, isArmed } = state.logicAnalyzer;
  const [hasCaptured, setHasCaptured] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isRunning) return;
    if (triggerMode === 'SINGLE' && !isArmed && hasCaptured) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    let frameId: number;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const chHeight = height / channels;
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= channels; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * chHeight); ctx.lineTo(width, i * chHeight); ctx.stroke();
      }

      for (let i = 0; i < channels; i++) {
        const yBase = (i + 0.8) * chHeight;
        const amplitude = chHeight * 0.6;
        ctx.beginPath();
        ctx.strokeStyle = i % 2 === 0 ? '#10b981' : '#3b82f6';
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x++) {
          const freq = (i + 1) * 0.05;
          // Trigger sync logic for simulation
          const stableOffset = triggerMode === 'AUTO' ? 0 : offset;
          const val = Math.sin((x * 0.02 + stableOffset) * freq) > 0 ? 1 : 0;
          const y = yBase - (val * amplitude);
          if (x === 0) ctx.moveTo(x, y);
          else {
            const prevVal = Math.sin(((x - 1) * 0.02 + stableOffset) * freq) > 0 ? 1 : 0;
            if (prevVal !== val) ctx.lineTo(x, yBase - (prevVal * amplitude));
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`CH${i.toString().padStart(2, '0')}`, 10, yBase - amplitude - 5);
      }

      if (triggerMode === 'SINGLE' && isArmed) {
        onUpdate({ isArmed: false });
        setHasCaptured(true);
        return;
      }

      offset += 0.2;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, triggerMode, isArmed]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="h-12 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logic Stream</span>
           <div className="flex gap-1">
             <button 
                onClick={() => onUpdate({ triggerMode: 'AUTO' })}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${triggerMode === 'AUTO' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}
             >
                AUTO
             </button>
             <button 
                onClick={() => {
                   setHasCaptured(false);
                   onUpdate({ triggerMode: 'SINGLE', isArmed: true });
                }}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${triggerMode === 'SINGLE' ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-slate-500'}`}
             >
                SINGLE
             </button>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {isArmed && <div className="text-[10px] text-red-400 animate-pulse font-bold uppercase tracking-tighter flex items-center gap-1"><Activity size={10}/> Trigger Armed</div>}
          {!isArmed && hasCaptured && <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Capture Complete</div>}
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-20 border-r border-slate-800 flex flex-col py-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center px-4">
              <span className="text-[9px] font-mono font-bold text-slate-600">L{i}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 relative overflow-hidden bg-slate-950/20">
          <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-fill opacity-90" />
        </div>
      </div>
    </div>
  );
};

export default LogicAnalyzer;

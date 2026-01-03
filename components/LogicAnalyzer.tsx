
import React, { useRef, useEffect, useState } from 'react';
import { InstrumentState } from '../types';
import { Activity, Maximize2, Minimize2, Info } from 'lucide-react';

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
  const [isFullView, setIsFullView] = useState(false);

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
      
      // Background and Grid
      ctx.fillStyle = '#0f172a'; // Deep dark background
      ctx.fillRect(0, 0, width, height);
      
      const chHeight = height / channels;
      
      // Draw Horizontal Channel Dividers
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= channels; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * chHeight);
        ctx.lineTo(width, i * chHeight);
        ctx.stroke();
      }

      // Draw 10-Cycle Vertical Grid (The 'bins')
      // These are the 10 clock cycles requested
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([5, 10]);
      for (let i = 1; i < 10; i++) {
        const x = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Signal Rendering
      // Using a slightly offset pixel position (0.5) to ensure crisp 1px lines if needed,
      // though here we use thicker lines for visibility.
      const basePeriod = width / 10; // Exactly 10 cycles of the reference clock

      for (let i = 0; i < channels; i++) {
        const yHigh = (i * chHeight) + (chHeight * 0.2);
        const yLow = (i * chHeight) + (chHeight * 0.8);
        
        ctx.beginPath();
        // Alternate colors for better distinguishability
        const hue = (i * 137.5) % 360; // Golden angle for distributed colors
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        
        // Add subtle glow to active signals
        ctx.shadowBlur = 4;
        ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.4)`;

        for (let x = 0; x < width; x++) {
          // Channel-specific frequency scaling to make them distinguishable
          // Ch0 is 1x, Ch1 is 2x, etc., or some variation
          const cycleMultiplier = (i % 4) + 1;
          const channelPeriod = basePeriod / cycleMultiplier;
          
          const stableOffset = triggerMode === 'AUTO' ? offset : 0;
          
          // Logic: High for first half of period
          const currentPos = (x + stableOffset) % channelPeriod;
          const val = currentPos < (channelPeriod / 2) ? 1 : 0;
          const y = val === 1 ? yHigh : yLow;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevPos = (x - 1 + stableOffset) % channelPeriod;
            const prevVal = prevPos < (channelPeriod / 2) ? 1 : 0;
            
            if (prevVal !== val) {
              // Draw the crisp transition (edge)
              ctx.lineTo(x, val === 1 ? yLow : yHigh);
            }
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Channel Label Overlay (Left Side)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, i * chHeight + 2, 35, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`D${i}`, 17, i * chHeight + 12);
      }

      // 10-Cycle Header labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      for (let i = 0; i < 10; i++) {
        ctx.fillText(`T${i}`, (i + 0.5) * (width / 10), 15);
      }

      if (triggerMode === 'SINGLE' && isArmed) {
        // Simple mock trigger catch
        onUpdate({ isArmed: false });
        setHasCaptured(true);
        return;
      }
      
      // Scrolling speed
      offset += 2; 
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, triggerMode, isArmed, channels, hasCaptured]);

  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      <div className="h-12 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Activity size={16} className="text-emerald-500" />
             <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Logic Analyzer</span>
           </div>
           <div className="h-4 w-[1px] bg-slate-800" />
           <div className="flex gap-1.5">
             <button 
                onClick={() => {
                  setHasCaptured(false);
                  onUpdate({ triggerMode: 'AUTO' });
                }}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${triggerMode === 'AUTO' ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
             >
                FREE RUN
             </button>
             <button 
                onClick={() => {
                   setHasCaptured(false);
                   onUpdate({ triggerMode: 'SINGLE', isArmed: true });
                }}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${triggerMode === 'SINGLE' ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
             >
                {hasCaptured ? 'RE-CAPTURE' : 'SINGLE'}
             </button>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> 16 CH</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> 1GHz SR</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">10-CYCLE WINDOW</span>
          </div>
          {isArmed && <div className="text-[10px] text-red-500 animate-pulse font-black uppercase flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">ARMED</div>}
          {hasCaptured && triggerMode === 'SINGLE' && <div className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">STOPPED</div>}
          <button 
            onClick={() => setIsFullView(!isFullView)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isFullView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden bg-black">
          <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-fill cursor-crosshair" />
          
          {/* Legend/Info Overlay */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 border border-slate-800 p-3 rounded-xl backdrop-blur-md pointer-events-none">
             <div className="flex items-center gap-2 mb-2">
                <Info size={12} className="text-blue-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Display Metadata</span>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between gap-6 text-[9px] font-mono">
                   <span className="text-slate-600">TIME/DIV:</span>
                   <span className="text-slate-300">100ns</span>
                </div>
                <div className="flex justify-between gap-6 text-[9px] font-mono">
                   <span className="text-slate-600">OFFSET:</span>
                   <span className="text-slate-300">0.00s</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicAnalyzer;

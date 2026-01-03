
import React, { useEffect, useRef, useState } from 'react';
import { InstrumentState, ScopeChannelConfig } from '../types';
import { Sliders, Maximize2, Minimize2, Activity, Zap } from 'lucide-react';

interface OscilloscopeProps {
  state: InstrumentState;
  isRunning: boolean;
  onUpdate: (val: Partial<InstrumentState['scope']>) => void;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ state, isRunning, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ch1, ch2, timebase, triggerLevel, triggerMode, isArmed } = state.scope;
  const [isFullView, setIsFullView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [frozenPhase, setFrozenPhase] = useState(0);

  // Reference to keep track of phase without re-triggering effect too often
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || !isRunning) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    
    const draw = () => {
      const { width, height } = canvas;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const divsX = 10;
      const divsY = 8;
      for (let i = 0; i <= divsX; i++) {
        const x = (i / divsX) * width;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let i = 0; i <= divsY; i++) {
        const y = (i / divsY) * height;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Simulation Logic
      const getVal = (t: number, config: ScopeChannelConfig, phase: number = 0) => {
        // Simple 1kHz sine simulation
        return Math.sin((t + phase) * 2000 * Math.PI) * 2;
      };

      // Determine active phase
      let currentDrawPhase = 0;
      
      if (triggerMode === 'SINGLE') {
        if (isArmed) {
          // In "Wait" mode, we simulate a trigger happening
          // For UX, we'll let it run briefly then "catch" it
          phaseRef.current += 0.0002; 
          
          // Simplified auto-trigger logic: if current phase reaches a point, freeze it
          if (phaseRef.current > 0.005) { // Simulate finding a trigger
            setFrozenPhase(phaseRef.current);
            setHasTriggered(true);
            onUpdate({ isArmed: false });
          }
          currentDrawPhase = phaseRef.current;
        } else if (hasTriggered) {
          // Show frozen data
          currentDrawPhase = frozenPhase;
        }
      } else {
        // AUTO mode: Locked to signal center
        const targetVal = triggerLevel / 2;
        if (Math.abs(targetVal) <= 1) {
          currentDrawPhase = Math.asin(targetVal) / (2000 * Math.PI);
        }
        setHasTriggered(false);
        phaseRef.current = 0;
      }

      const drawChannel = (config: ScopeChannelConfig, color: string, phaseShift: number) => {
        if (!config.enabled) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        for (let x = 0; x < width; x++) {
          const t = (x / width) * timebase * 10;
          const val = getVal(t, config, currentDrawPhase + phaseShift);
          const y = height / 2 - (val / config.scale) * (height / 8) + config.offset;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawChannel(ch1, '#0ea5e9', 0);
      drawChannel(ch2, '#f59e0b', Math.PI / 4000);

      // Trigger Level Line with Pulse Animation
      const time = Date.now() / 1000;
      const pulseOpacity = isArmed ? (Math.sin(time * 10) * 0.3 + 0.5) : 0.2;
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
      ctx.lineWidth = 1.5;
      const trigY = height / 2 - (triggerLevel / ch1.scale) * (height / 8);
      ctx.beginPath(); ctx.moveTo(0, trigY); ctx.lineTo(width, trigY); ctx.stroke();
      ctx.setLineDash([]);

      // Trigger Handle Marker
      ctx.fillStyle = isArmed ? '#ef4444' : (hasTriggered ? '#10b981' : '#ffffff44');
      ctx.beginPath();
      ctx.moveTo(width - 10, trigY);
      ctx.lineTo(width, trigY - 6);
      ctx.lineTo(width, trigY + 6);
      ctx.fill();

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, ch1, ch2, timebase, triggerLevel, triggerMode, isArmed, hasTriggered, frozenPhase, onUpdate]);

  const handleScanClick = () => {
    setHasTriggered(false);
    phaseRef.current = 0;
    onUpdate({ triggerMode: 'SINGLE', isArmed: true });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className={`relative flex-1 m-2 md:m-3 rounded-xl bg-[#0f172a] overflow-hidden shadow-inner group transition-all duration-300 ${isFullView ? 'mb-3' : ''} ${hasTriggered ? 'ring-2 ring-emerald-500/50' : (isArmed ? 'ring-2 ring-red-500/50 animate-pulse' : '')}`}>
        <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-fill opacity-90" />
        
        {/* Status Overlays */}
        <div className="absolute top-4 left-4 flex gap-3 pointer-events-none">
          {ch1.enabled && (
            <div className="bg-[#0ea5e91a] backdrop-blur-md border border-[#0ea5e94d] px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-tighter block opacity-60">CH1</span>
              <span className="text-xs font-mono font-bold text-[#7dd3fc]">1.00kHz | Trig: {triggerLevel.toFixed(1)}V</span>
            </div>
          )}
          
          {triggerMode === 'SINGLE' && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all ${isArmed ? 'bg-red-500/20 border-red-500 text-red-400' : (hasTriggered ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-500/20 border-slate-500 text-slate-400')}`}>
               <Zap size={14} className={isArmed ? 'animate-bounce' : ''} />
               <span className="text-[10px] font-black uppercase tracking-widest">
                 {isArmed ? 'WAITING FOR TRIGGER' : (hasTriggered ? 'TRIGGERED / CAPTURED' : 'SINGLE MODE')}
               </span>
            </div>
          )}
        </div>

        {hasTriggered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-600/10 border-2 border-emerald-500/50 px-10 py-4 rounded-2xl backdrop-blur-sm animate-in zoom-in-95 duration-300">
               <h3 className="text-emerald-400 font-black text-2xl tracking-[0.3em] flex items-center gap-3">
                 <Activity className="animate-pulse" /> TRIGGERED
               </h3>
               <p className="text-emerald-500/70 text-[10px] font-bold text-center uppercase mt-1">Acquisition Complete</p>
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsFullView(!isFullView)}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
        >
          {isFullView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {!isFullView && (
        <div className="h-44 bg-white border-t border-slate-100 p-4 md:px-8 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 h-full gap-8">
            <ControlSection icon={<Sliders size={12}/>} label="TIMEBASE">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[11px] font-bold text-slate-400">SCALE</span>
                  <span className="text-xs font-mono font-bold text-blue-600">{(timebase * 1000).toFixed(1)}ms/div</span>
                </div>
                <input 
                  type="range" min="0.0001" max="0.02" step="0.0001" 
                  value={timebase} 
                  onChange={(e) => onUpdate({ timebase: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600" 
                />
              </div>
            </ControlSection>

            <ControlSection icon={<Activity size={12}/>} label="TRIGGER">
              <div className="space-y-3">
                <div className="flex p-0.5 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => {
                      setHasTriggered(false);
                      onUpdate({ triggerMode: 'AUTO', isArmed: false });
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${triggerMode === 'AUTO' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    STABLE
                  </button>
                  <button 
                    onClick={handleScanClick}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${triggerMode === 'SINGLE' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {hasTriggered ? 'RE-SCAN' : 'SCAN'}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>LEVEL</span> <span>{triggerLevel.toFixed(1)}V</span>
                  </div>
                  <input type="range" min="-5" max="5" step="0.1" value={triggerLevel} onChange={(e) => onUpdate({ triggerLevel: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
                </div>
              </div>
            </ControlSection>

            <ChannelSection channel="CH1" color="text-sky-500" config={ch1} onUpdate={(val) => onUpdate({ ch1: { ...ch1, ...val } })} />
            <ChannelSection channel="CH2" color="text-amber-500" config={ch2} onUpdate={(val) => onUpdate({ ch2: { ...ch2, ...val } })} />
          </div>
        </div>
      )}
    </div>
  );
};

const ControlSection: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex flex-col gap-3 border-l border-slate-50 pl-6 first:border-l-0">
    <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
      {icon} {label}
    </h4>
    {children}
  </div>
);

const ChannelSection: React.FC<{ channel: string; color: string; config: ScopeChannelConfig; onUpdate: (val: Partial<ScopeChannelConfig>) => void }> = ({ channel, color, config, onUpdate }) => (
  <div className="flex flex-col gap-3 border-l border-slate-50 pl-6">
    <div className="flex justify-between items-center">
      <h4 className={`text-[10px] font-black ${color} tracking-[0.2em]`}>{channel} CONTROL</h4>
      <input 
        type="checkbox" checked={config.enabled} 
        onChange={(e) => onUpdate({ enabled: e.target.checked })}
        className="w-4 h-4 rounded border-slate-200"
      />
    </div>
    <div className="grid grid-cols-1 gap-2">
       <div className="space-y-1">
         <span className="text-[9px] font-bold text-slate-400">SCALE</span>
         <select 
          value={config.scale} onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
          className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg outline-none"
         >
            <option value="1">1.0V / div</option>
            <option value="2">2.0V / div</option>
            <option value="5">5.0V / div</option>
         </select>
       </div>
    </div>
  </div>
);

export default Oscilloscope;

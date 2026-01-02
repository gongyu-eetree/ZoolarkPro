
import React, { useEffect, useRef, useState } from 'react';
import { InstrumentState, ScopeChannelConfig } from '../types';
import { Sliders, Zap, Crosshair } from 'lucide-react';

interface OscilloscopeProps {
  state: InstrumentState;
  isRunning: boolean;
  onUpdate: (val: Partial<InstrumentState['scope']>) => void;
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ state, isRunning, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ch1, ch2, timebase, triggerLevel, triggerMode, isArmed } = state.scope;
  const [capturedData, setCapturedData] = useState<any[] | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isRunning) return;
    if (triggerMode === 'SINGLE' && !isArmed && capturedData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let offset = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

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

      // Continuous mode offset is stable (sync logic)
      const effectiveOffset = triggerMode === 'AUTO' ? 0 : offset;

      const drawChannel = (config: ScopeChannelConfig, freqOffset: number) => {
        if (!config.enabled) return;
        ctx.beginPath();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = config.color;

        for (let x = 0; x < width; x++) {
          const t = (x / width) * timebase * 10;
          // Simulated input with stable triggering logic
          const val = Math.sin((t + effectiveOffset + freqOffset) * 2000 * Math.PI) * 2;
          const y = height / 2 - (val / config.scale) * (height / 8) + config.offset;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawChannel(ch1, 0);
      drawChannel(ch2, Math.PI / 2);

      if (triggerMode === 'SINGLE' && isArmed) {
        onUpdate({ isArmed: false });
        setCapturedData([1]); // Simulate capture
        return;
      }

      offset += 0.0001;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, ch1, ch2, timebase, triggerMode, isArmed]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 relative m-4 rounded-lg bg-black/40 border border-slate-800 overflow-hidden">
        <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-fill opacity-90" />
        <div className="absolute top-4 left-4 flex gap-4 text-[10px] font-mono pointer-events-none">
          {ch1.enabled && <div className="bg-slate-950/80 border border-cyan-500/30 text-cyan-400 p-2 rounded">CH1: 2.5Vrms / 1.00kHz</div>}
          {ch2.enabled && <div className="bg-slate-950/80 border border-amber-500/30 text-amber-400 p-2 rounded">CH2: 3.2Vrms / 1.25kHz</div>}
        </div>
      </div>

      <div className="h-48 bg-slate-900 border-t border-slate-800 p-6 flex gap-8">
        <div className="flex-1 grid grid-cols-4 gap-6">
          <ControlGroup label="Timebase">
             <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 flex justify-between">
                  <span>SCALE</span> <span className="text-blue-400">1.0ms/div</span>
                </label>
                <input type="range" min="0.0001" max="1" step="0.0001" value={timebase} onChange={(e) => onUpdate({ timebase: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
             </div>
          </ControlGroup>

          <ControlGroup label="Trigger">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                <button 
                  onClick={() => onUpdate({ triggerMode: 'AUTO' })}
                  className={`flex-1 text-[10px] font-bold py-1 rounded border ${triggerMode === 'AUTO' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  AUTO
                </button>
                <button 
                  onClick={() => {
                    setCapturedData(null);
                    onUpdate({ triggerMode: 'SINGLE', isArmed: true });
                  }}
                  className={`flex-1 text-[10px] font-bold py-1 rounded border ${triggerMode === 'SINGLE' ? 'bg-red-600 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  SINGLE
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase flex justify-between">Level <span>{triggerLevel}V</span></span>
                <input type="range" className="w-full accent-blue-500" min="-5" max="5" step="0.1" value={triggerLevel} onChange={(e) => onUpdate({ triggerLevel: parseFloat(e.target.value) })} />
              </div>
            </div>
          </ControlGroup>

          <ControlGroup label="CH1 Control">
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <input type="checkbox" checked={ch1.enabled} onChange={(e) => onUpdate({ ch1: { ...ch1, enabled: e.target.checked } })} />
                 <span className="text-xs font-bold text-cyan-400">CH1 ON</span>
               </div>
               <select value={ch1.scale} onChange={(e) => onUpdate({ ch1: { ...ch1, scale: parseFloat(e.target.value) } })} className="bg-slate-800 border border-slate-700 text-xs p-1.5 rounded">
                  <option value="1">1V/div</option>
                  <option value="2">2V/div</option>
                  <option value="5">5V/div</option>
               </select>
             </div>
          </ControlGroup>

          <ControlGroup label="CH2 Control">
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <input type="checkbox" checked={ch2.enabled} onChange={(e) => onUpdate({ ch2: { ...ch2, enabled: e.target.checked } })} />
                 <span className="text-xs font-bold text-amber-400">CH2 ON</span>
               </div>
               <select value={ch2.scale} onChange={(e) => onUpdate({ ch2: { ...ch2, scale: parseFloat(e.target.value) } })} className="bg-slate-800 border border-slate-700 text-xs p-1.5 rounded">
                  <option value="1">1V/div</option>
                  <option value="2">2V/div</option>
                  <option value="5">5V/div</option>
               </select>
             </div>
          </ControlGroup>
        </div>
      </div>
    </div>
  );
};

const ControlGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-3 border-l border-slate-800 pl-4 first:border-l-0">
    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
      <Sliders size={10} /> {label}
    </h3>
    {children}
  </div>
);

export default Oscilloscope;

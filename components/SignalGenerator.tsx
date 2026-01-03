
import React, { useRef, useEffect } from 'react';
import { GeneratorConfig, WaveformType } from '../types';
import { Zap, Activity, ChevronRight } from 'lucide-react';

interface GeneratorProps {
  state: GeneratorConfig;
  onUpdate: (val: Partial<GeneratorConfig>) => void;
}

const SignalGenerator: React.FC<GeneratorProps> = ({ state, onUpdate }) => {
  const types: WaveformType[] = ['SINE', 'SQUARE', 'TRIANGLE', 'SAWTOOTH'];
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Draw Preview - No animation, just static redraw on parameter change
    const drawPreview = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw sub-grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for(let i=0; i<10; i++) {
        const x = (i/10)*width;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        const y = (i/10)*height;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';

      // We use a fixed phase (0) to keep the waveform static
      const phase = 0;

      for (let x = 0; x < width; x++) {
        // We show 2 periods across the preview width
        const t = (x / width) * 4 * Math.PI; 
        let val = 0;

        switch (state.type) {
          case 'SINE':
            val = Math.sin(t + phase);
            break;
          case 'SQUARE':
            val = Math.sin(t + phase) >= 0 ? 1 : -1;
            break;
          case 'TRIANGLE':
            val = (Math.asin(Math.sin(t + phase)) * 2) / Math.PI;
            break;
          case 'SAWTOOTH':
            // Simple sawtooth approximation
            val = 2 * ( (t + phase) / (2 * Math.PI) - Math.floor(0.5 + (t + phase) / (2 * Math.PI)) );
            break;
        }

        // Apply amplitude and offset
        // Scale: Height/2 is 0V. Max amplitude is 10Vpp (+5V to -5V)
        // Amplitude is in Vpp, so we multiply normalized signal by amp/10 (percentage of full scale)
        const verticalScale = (state.amplitude / 10) * (height * 0.4);
        const verticalOffset = state.offset * (height / 10);
        const y = (height / 2) - (val * verticalScale) - verticalOffset;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawPreview();
  }, [state.type, state.amplitude, state.offset]);

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
              <Activity size={14} className="text-blue-600" /> Waveform
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdate({ type })}
                  className={`py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${state.type === type ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                >
                  <WaveformIcon type={type} />
                  <span className="text-[9px] font-bold">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-4">Signal Preview</h3>
            <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
               <canvas ref={previewRef} width={400} height={200} className="w-full h-full" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Output Power</span>
            <button 
              onClick={() => onUpdate({ enabled: !state.enabled })}
              className={`w-12 h-6 rounded-full transition-all relative ${state.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${state.enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Parameters */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
            <Zap size={14} className="text-blue-600" /> Precise Controls
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <ParameterControl label="Frequency" value={state.frequency} unit="Hz" min={1} max={1000000} onUpdate={(v) => onUpdate({ frequency: v })} />
            <ParameterControl label="Amplitude" value={state.amplitude} unit="Vpp" min={0} max={10} step={0.01} onUpdate={(v) => onUpdate({ amplitude: v })} />
            <ParameterControl label="Offset" value={state.offset} unit="V" min={-5} max={5} step={0.01} onUpdate={(v) => onUpdate({ offset: v })} />
          </div>
          
          <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Activity size={16}/></div>
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-widest">
              Synthesizer Core v3.0 - Active. Static preview reflects real-time Amplitude and Offset changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WaveformIcon: React.FC<{ type: WaveformType }> = ({ type }) => {
  switch (type) {
    case 'SINE': return <Activity size={20} />;
    case 'SQUARE': return <Zap size={20} />;
    case 'TRIANGLE': return <ChevronRight size={20} className="-rotate-90" />;
    case 'SAWTOOTH': return <ChevronRight size={20} className="-rotate-[30deg]" />;
  }
};

const ParameterControl: React.FC<{ label: string; value: number; unit: string; min: number; max: number; step?: number; onUpdate: (v: number) => void }> = ({ label, value, unit, min, max, step = 1, onUpdate }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{label}</label>
      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <input 
          type="number" value={value} 
          onChange={(e) => onUpdate(parseFloat(e.target.value))}
          className="w-20 bg-transparent text-right font-mono text-sm font-bold text-blue-600 outline-none" 
        />
        <span className="text-[9px] font-bold text-slate-400">{unit}</span>
      </div>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onUpdate(parseFloat(e.target.value))} className="w-full accent-blue-600" />
  </div>
);

export default SignalGenerator;


import React, { useState, useEffect } from 'react';
import { GeneratorConfig, WaveformType } from '../types';
import { Zap, Activity, ChevronRight } from 'lucide-react';

interface GeneratorProps {
  state: GeneratorConfig;
  onUpdate: (val: Partial<GeneratorConfig>) => void;
}

const SignalGenerator: React.FC<GeneratorProps> = ({ state, onUpdate }) => {
  const types: WaveformType[] = ['SINE', 'SQUARE', 'TRIANGLE', 'SAWTOOTH'];

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Mode & Type */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={14} className="text-blue-500" /> Waveform Selection
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdate({ type })}
                    className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group ${
                      state.type === type 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10' 
                      : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <WaveformIcon type={type} />
                    <span className="text-[10px] font-bold tracking-widest">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold text-white block">OUTPUT MASTER</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">10MHz Analog BW</span>
                </div>
                <button 
                  onClick={() => onUpdate({ enabled: !state.enabled })}
                  className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${state.enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all transform ${state.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-800 pt-3 mt-3">
                * Note: Supports up to 10Vpp amplitude. High frequency signals may experience attenuation.
              </p>
            </div>
          </div>

          {/* Right Column - Parameters */}
          <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-10">
            <ParameterControl 
              label="Frequency" 
              value={state.frequency} 
              unit="Hz" 
              min={1} 
              max={10000000} 
              onUpdate={(v) => onUpdate({ frequency: v })} 
            />
            <ParameterControl 
              label="Amplitude" 
              value={state.amplitude} 
              unit="Vpp" 
              min={0} 
              max={10} 
              step={0.01}
              onUpdate={(v) => onUpdate({ amplitude: v })} 
            />
            <ParameterControl 
              label="Offset" 
              value={state.offset} 
              unit="V" 
              min={-5} 
              max={5} 
              step={0.01}
              onUpdate={(v) => onUpdate({ offset: v })} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const WaveformIcon: React.FC<{ type: WaveformType }> = ({ type }) => {
  switch (type) {
    case 'SINE': return <Activity size={24} />;
    case 'SQUARE': return <Zap size={24} />;
    case 'TRIANGLE': return <ChevronRight size={24} className="-rotate-90" />;
    case 'SAWTOOTH': return <ChevronRight size={24} className="-rotate-[30deg]" />;
  }
};

const ParameterControl: React.FC<{ label: string; value: number; unit: string; min: number; max: number; step?: number; onUpdate: (v: number) => void }> = ({ 
  label, value, unit, min, max, step = 1, onUpdate 
}) => {
  const [localText, setLocalText] = useState(value.toString());

  // Handle updates from parent (e.g. state change from slider or external source)
  useEffect(() => {
    // Only update localText if it's not currently being edited or if it's substantially different
    // This allows the user to type decimal points or partial numbers without jumping
    if (parseFloat(localText) !== value) {
      setLocalText(value.toString());
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalText(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onUpdate(parsed);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    onUpdate(newVal);
    // Explicitly sync text on slider move
    setLocalText(newVal.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</label>
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700">
          <input 
            type="text" 
            value={localText}
            onChange={handleTextChange}
            className="w-24 bg-transparent text-right font-mono text-lg font-bold text-blue-400 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500 font-bold">{unit}</span>
        </div>
      </div>
      <div className="relative h-2.5 flex items-center group">
        <div className="absolute inset-0 bg-slate-800 rounded-full" />
        <div 
          className="absolute left-0 h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)]" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }} 
        />
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default SignalGenerator;

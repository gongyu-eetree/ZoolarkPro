
import React, { useState, useEffect } from 'react';
import { PWMConfig } from '../types';
import { Tally4, Activity, Info } from 'lucide-react';

interface PWMGeneratorProps {
  state: PWMConfig;
  onUpdate: (val: Partial<PWMConfig>) => void;
}

const PWMGenerator: React.FC<PWMGeneratorProps> = ({ state, onUpdate }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-sm p-10 flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <Tally4 className="text-emerald-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Pulse Width Modulation</h2>
                <p className="text-sm text-slate-400">Digital signal with variable duty cycle and frequency</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
              <button 
                onClick={() => onUpdate({ enabled: !state.enabled })}
                className={`px-8 py-2.5 rounded-full font-bold transition-all shadow-sm ${
                  state.enabled 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {state.enabled ? 'RUNNING' : 'STOPPED'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Duty Cycle Control */}
            <div className="space-y-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <ParameterControl 
                label="Duty Cycle" 
                value={state.dutyCycle} 
                unit="%" 
                min={0} 
                max={100} 
                step={1}
                color="emerald"
                onUpdate={(v) => onUpdate({ dutyCycle: v })} 
              />
              
              <div className="h-32 bg-slate-900 rounded-xl border border-slate-200 flex items-center p-0 overflow-hidden relative shadow-inner">
                <div className="absolute inset-0 opacity-10 pointer-events-none grid grid-cols-10 grid-rows-4">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-white/20 h-full w-full" />
                  ))}
                </div>
                
                <div className="w-full h-full relative px-1 flex items-center">
                  <PWMWaveformPreview dutyCycle={state.dutyCycle} enabled={state.enabled} />
                </div>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/30 tracking-widest uppercase">
                  Visualization: 2 Periods Shown
                </div>
              </div>
            </div>

            {/* Frequency Control */}
            <div className="space-y-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <ParameterControl 
                label="Frequency" 
                value={state.frequency} 
                unit="Hz" 
                min={1} 
                max={1000000} 
                step={1}
                color="emerald"
                onUpdate={(v) => onUpdate({ frequency: v })} 
              />
              
              <div className="grid grid-cols-3 gap-3">
                {[10, 100, 1000, 10000, 100000, 1000000].map(f => (
                  <button 
                    key={f}
                    onClick={() => onUpdate({ frequency: f })}
                    className={`p-3 rounded-xl border text-[11px] font-mono font-bold transition-all ${
                      state.frequency === f 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {f >= 1000000 ? `${f/1000000}MHz` : f >= 1000 ? `${f/1000}kHz` : `${f}Hz`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Info size={16} className="text-blue-600" />
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest">
              High Precision PWM Output Mode. Maximum frequency 1MHz with 1% resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PWMWaveformPreview: React.FC<{ dutyCycle: number, enabled: boolean }> = ({ dutyCycle, enabled }) => {
  const height = 100;
  const width = 1000;
  const padding = 15;
  const periodWidth = width / 2;
  const pulseWidth = (dutyCycle / 100) * periodWidth;

  const getPoints = () => {
    const p1 = `0,${height - padding} 0,${padding} ${pulseWidth},${padding} ${pulseWidth},${height - padding} ${periodWidth},${height - padding}`;
    const p2 = `${periodWidth},${padding} ${periodWidth + pulseWidth},${padding} ${periodWidth + pulseWidth},${height - padding} ${width},${height - padding}`;
    return p1 + " " + p2;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-3/4" preserveAspectRatio="none">
      <polyline
        points={getPoints()}
        fill="none"
        stroke={enabled ? '#10b981' : '#475569'}
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="transition-all duration-300 ease-in-out"
      />
    </svg>
  );
};

const ParameterControl: React.FC<{ 
  label: string; 
  value: number; 
  unit: string; 
  min: number; 
  max: number; 
  step?: number; 
  color?: 'emerald' | 'blue' | 'red';
  onUpdate: (v: number) => void 
}> = ({ 
  label, value, unit, min, max, step = 1, color = 'emerald', onUpdate 
}) => {
  const [localText, setLocalText] = useState(value.toString());

  useEffect(() => {
    setLocalText(value.toString());
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
    setLocalText(newVal.toString());
  };

  const colorStyles = {
    emerald: 'text-emerald-600 bg-emerald-600',
    blue: 'text-blue-600 bg-blue-600',
    red: 'text-red-600 bg-red-600'
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">{label}</label>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <input 
            type="text" 
            value={localText}
            onChange={handleTextChange}
            className={`w-24 bg-transparent text-right font-mono text-xl font-bold ${colorStyles[color].split(' ')[0]} focus:outline-none`}
          />
          <span className="text-xs text-slate-400 font-bold">{unit}</span>
        </div>
      </div>
      <div className="relative h-2 flex items-center group">
        <div className="absolute inset-0 bg-slate-200 rounded-full" />
        <div 
          className={`absolute left-0 h-full rounded-full transition-all duration-75 ${colorStyles[color].split(' ')[1]}`} 
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

export default PWMGenerator;

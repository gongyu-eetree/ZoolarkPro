
import React, { useState, useEffect } from 'react';
import { InstrumentState, DCConfig } from '../types';
import { Battery } from 'lucide-react';

interface PowerSupplyProps {
  state: InstrumentState;
  onUpdateDC: (val: Partial<DCConfig>) => void;
  onUpdatePWM: (val: Partial<any>) => void; 
}

const PowerSupply: React.FC<PowerSupplyProps> = ({ state, onUpdateDC }) => {
  // Voltage -5 to +5 maps to rotation.
  // We want a spread of roughly 280 degrees centered on top.
  // -5V = -140deg, 0V = 0deg, +5V = +140deg
  const rotation = (state.dc.voltage / 5) * 140;

  const [inputValue, setInputValue] = useState(state.dc.voltage.toFixed(2));

  useEffect(() => {
    setInputValue(state.dc.voltage.toFixed(2));
  }, [state.dc.voltage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      const clamped = Math.max(-5, Math.min(5, val));
      onUpdateDC({ voltage: clamped });
      setInputValue(clamped.toFixed(2));
    } else {
      setInputValue(state.dc.voltage.toFixed(2));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-12 gap-8 md:gap-12 overflow-y-auto items-center justify-center">
      <section className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 flex flex-col gap-10 shadow-sm w-full max-w-4xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-50 rounded-3xl border border-red-100">
            <Battery className="text-red-600" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">DC Adjustable Source</h2>
            <p className="text-sm text-slate-400">Precision variable voltage output (-5.0V to +5.0V)</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center justify-between">
          <div className="flex-1 w-full space-y-10">
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status</span>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-600 uppercase">Output Active</span>
                 </div>
               </div>
               <div className="text-right flex flex-col items-end gap-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Set Point (V)</span>
                 <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-2xl font-mono font-bold text-red-600 text-right outline-none focus:border-red-400 transition-all"
                    />
                 </div>
               </div>
            </div>

            <div className="space-y-4">
              <div className="relative h-4 flex items-center group">
                <div className="absolute inset-0 bg-slate-100 rounded-full border border-slate-200" />
                <div 
                  className="absolute left-0 h-full bg-red-600 rounded-full transition-all duration-150" 
                  style={{ width: `${((state.dc.voltage + 5) / 10) * 100}%` }} 
                />
                <input 
                  type="range" min="-5" max="5" step="0.01" 
                  value={state.dc.voltage}
                  onChange={(e) => onUpdateDC({ voltage: parseFloat(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono font-bold">
                <span>-5.0V</span>
                <span>0.0V</span>
                <span>+5.0V</span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-50 pt-6 italic">
              Regulated DC output with short-circuit protection. Use input box for precision adjustment.
            </p>
          </div>

          <div className="w-64 md:w-72 aspect-square bg-slate-50 rounded-full border-[12px] border-white flex items-center justify-center relative shadow-inner shadow-slate-200 outline outline-1 outline-slate-100 overflow-hidden">
            {/* Gauge Ticks Overlay */}
            <div className="absolute inset-0 p-8 pointer-events-none opacity-20">
               <div className="w-full h-full border-2 border-dashed border-slate-400 rounded-full" />
            </div>

            {/* Scale Markings (Visual Only Labels) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between py-6">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Analog Dial</div>
              <div className="flex justify-between w-full px-8 mb-4">
                <span className="text-[9px] font-bold text-slate-300">-5V</span>
                <span className="text-[9px] font-bold text-slate-300">+5V</span>
              </div>
            </div>

            {/* Needle - Correctly Anchored to Center Pivot */}
            <div 
              className="absolute w-1.5 h-28 bg-red-600 rounded-full transition-transform duration-300 ease-out z-10"
              style={{ 
                left: '50%',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${rotation}deg)`
              }}
            />

            {/* Central Pivot Cap - Covers the base of the needle */}
            <div className="absolute w-6 h-6 bg-slate-800 rounded-full border-2 border-white shadow-lg z-20" />
            
            {/* Visual background element to give some texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default PowerSupply;

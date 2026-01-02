
import React from 'react';
import { InstrumentState, DCConfig } from '../types';
import { Battery } from 'lucide-react';

interface PowerSupplyProps {
  state: InstrumentState;
  onUpdateDC: (val: Partial<DCConfig>) => void;
  onUpdatePWM: (val: Partial<any>) => void; // Unused now but kept for compatibility
}

const PowerSupply: React.FC<PowerSupplyProps> = ({ state, onUpdateDC }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 p-12 gap-12 overflow-y-auto items-center justify-center">
      {/* DC Voltage Adjustment */}
      <section className="bg-slate-900 rounded-[40px] p-12 border border-slate-800 flex flex-col gap-10 shadow-2xl w-full max-w-4xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-500/10 rounded-3xl shadow-inner border border-red-500/20">
            <Battery className="text-red-500" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">DC Adjustable Source</h2>
            <p className="text-sm text-slate-500">Precision variable voltage output from -5.0V to +5.0V DC</p>
          </div>
        </div>

        <div className="flex gap-20 items-center justify-between">
          <div className="flex-1 space-y-10">
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</span>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-xs font-bold text-red-500 uppercase">Active Output</span>
                 </div>
               </div>
               <div className="text-right">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Current Setting</span>
                 <span className="text-3xl font-mono font-bold text-red-500 tracking-tighter">{state.dc.voltage.toFixed(2)} Volts</span>
               </div>
            </div>

            <div className="space-y-4">
              <div className="relative h-4 flex items-center group">
                <div className="absolute inset-0 bg-slate-950 rounded-full border border-slate-800" />
                <div 
                  className="absolute left-0 h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)]" 
                  style={{ width: `${((state.dc.voltage + 5) / 10) * 100}%` }} 
                />
                <input 
                  type="range" min="-5" max="5" step="0.01" 
                  value={state.dc.voltage}
                  onChange={(e) => onUpdateDC({ voltage: parseFloat(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 font-mono font-bold px-1">
                <span>-5.00V</span>
                <span>0.00V</span>
                <span>+5.00V</span>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg border-t border-slate-800 pt-6 italic">
              * Note: Continuous adjustment supported. The output is regulated and short-circuit protected. 
              Always verify polarity before connecting sensitive components.
            </p>
          </div>

          <div className="w-64 aspect-square bg-slate-950 rounded-full border-[12px] border-slate-900 flex items-center justify-center relative shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] outline outline-1 outline-slate-800">
            <div className="text-5xl font-mono font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              {state.dc.voltage.toFixed(2)}V
            </div>
            {/* Knob Tick Animation */}
            <div 
              className="absolute w-2 h-10 bg-red-500/80 top-3 rounded-full transform origin-bottom transition-transform duration-100"
              style={{ transform: `rotate(${(state.dc.voltage / 5) * 140}deg) translateY(-25px)` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default PowerSupply;

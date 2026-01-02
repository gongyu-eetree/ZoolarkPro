
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Settings, 
  Cpu, 
  Play, 
  Square, 
  Waves,
  Share2,
  Battery,
  Tally4,
  Usb,
  Link,
  Loader2
} from 'lucide-react';
import { InstrumentState, ConnectionStatus } from './types';
import Oscilloscope from './components/Oscilloscope';
import SignalGenerator from './components/SignalGenerator';
import LogicAnalyzer from './components/LogicAnalyzer';
import PowerSupply from './components/PowerSupply';
import SpectrumAnalyzer from './components/SpectrumAnalyzer';
import NetworkAnalyzer from './components/NetworkAnalyzer';
import PWMGenerator from './components/PWMGenerator';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GEN' | 'SCOPE' | 'SPECTRUM' | 'NETWORK' | 'LOGIC' | 'DC' | 'PWM'>('GEN');
  const [isRunning, setIsRunning] = useState(true);
  const [state, setState] = useState<InstrumentState>({
    connectionStatus: 'DISCONNECTED',
    scope: {
      ch1: { enabled: true, scale: 1, offset: 0, color: '#06b6d4' },
      ch2: { enabled: true, scale: 2, offset: 0, color: '#fbbf24' },
      timebase: 0.001,
      triggerMode: 'AUTO',
      triggerLevel: 0,
      isArmed: false,
    },
    generator: {
      enabled: false,
      type: 'SINE',
      frequency: 1000,
      amplitude: 5,
      offset: 0,
    },
    pwm: {
      enabled: false,
      frequency: 10000,
      dutyCycle: 50,
    },
    dc: {
      voltage: 0,
    },
    logicAnalyzer: {
      enabled: true,
      channels: Array(16).fill(true),
      sampleRate: 1000000,
      triggerMode: 'AUTO',
      isArmed: false,
    },
    spectrum: {
      enabled: true,
      range: 20000,
      window: 'HANNING'
    },
    network: {
      startFreq: 10,
      stopFreq: 100000,
      points: 100,
      running: false
    }
  });

  const updateState = <K extends keyof InstrumentState>(key: K, value: Partial<InstrumentState[K]>) => {
    setState(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value }
    }));
  };

  const handleUSBConnect = () => {
    updateState('connectionStatus', 'CONNECTING' as any);
    setTimeout(() => {
      updateState('connectionStatus', 'CONNECTED' as any);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden select-none font-sans">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 mb-2">
          <Activity className="w-8 h-8 text-white" />
        </div>
        
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
          <NavButton active={activeTab === 'GEN'} onClick={() => setActiveTab('GEN')} icon={<Zap size={20} />} label="Gen" />
          <NavButton active={activeTab === 'SCOPE'} onClick={() => setActiveTab('SCOPE')} icon={<Activity size={20} />} label="Scope" />
          <NavButton active={activeTab === 'SPECTRUM'} onClick={() => setActiveTab('SPECTRUM')} icon={<Waves size={20} />} label="Spec" />
          <NavButton active={activeTab === 'NETWORK'} onClick={() => setActiveTab('NETWORK')} icon={<Share2 size={20} />} label="Net" />
          <NavButton active={activeTab === 'PWM'} onClick={() => setActiveTab('PWM')} icon={<Tally4 size={20} />} label="PWM" />
          <NavButton active={activeTab === 'LOGIC'} onClick={() => setActiveTab('LOGIC')} icon={<Cpu size={20} />} label="Logic" />
          <NavButton active={activeTab === 'DC'} onClick={() => setActiveTab('DC')} icon={<Battery size={20} />} label="DC" />
        </div>

        <button className="p-3 hover:bg-slate-800 rounded-xl transition-colors text-slate-500 mt-2">
          <Settings size={22} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              VirtualLab <span className="text-blue-500 text-sm font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">Pro v3.2</span>
            </h1>
            <div className="h-4 w-[1px] bg-slate-700 mx-2" />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {isRunning ? 'SYSTEM RUNNING' : 'SYSTEM IDLE'}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {state.connectionStatus === 'DISCONNECTED' && (
                <button 
                  onClick={handleUSBConnect}
                  className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all"
                >
                  <Usb size={14} /> Connect USB Instrument
                </button>
              )}
              {state.connectionStatus === 'CONNECTING' && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-400">
                  <Loader2 size={14} className="animate-spin" /> Enumerating USB...
                </div>
              )}
              {state.connectionStatus === 'CONNECTED' && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs font-bold text-green-500">
                  <Link size={14} /> Pocket Instrument v2.0
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all shadow-lg ${
                isRunning 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white' 
                : 'bg-green-500 text-white shadow-green-500/20 hover:scale-105 active:scale-95'
              }`}
            >
              {isRunning ? <Square size={16} /> : <Play size={16} />}
              {isRunning ? 'STOP' : 'START'}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 flex gap-6 min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col overflow-hidden relative group shadow-2xl">
            {activeTab === 'GEN' && <SignalGenerator state={state.generator} onUpdate={(val) => updateState('generator', val)} />}
            {activeTab === 'SCOPE' && <Oscilloscope state={state} isRunning={isRunning} onUpdate={(val) => updateState('scope', val)} />}
            {activeTab === 'SPECTRUM' && <SpectrumAnalyzer state={state} isRunning={isRunning} />}
            {activeTab === 'NETWORK' && <NetworkAnalyzer state={state.network} onUpdate={(val) => updateState('network', val)} />}
            {activeTab === 'LOGIC' && <LogicAnalyzer state={state} isRunning={isRunning} onUpdate={(val) => updateState('logicAnalyzer', val)} />}
            {activeTab === 'PWM' && <PWMGenerator state={state.pwm} onUpdate={(val) => updateState('pwm', val)} />}
            {activeTab === 'DC' && <PowerSupply state={state} onUpdateDC={(val) => updateState('dc', val)} onUpdatePWM={(val) => updateState('pwm', val)} />}
          </div>
          <AIAssistant state={state} />
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 group relative w-full ${
      active 
      ? 'bg-blue-600/15 text-blue-500 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' 
      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
    }`}
  >
    {icon}
    <span className="text-[8px] font-bold uppercase tracking-wider">{label}</span>
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50" />}
  </button>
);

export default App;

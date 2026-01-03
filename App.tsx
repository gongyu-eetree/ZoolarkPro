
import React, { useState } from 'react';
import { 
  Activity, Zap, Settings, Cpu, Play, Square, 
  Waves, Share2, Battery, Tally4, MessageSquare
} from 'lucide-react';
import { InstrumentState } from './types';
import Oscilloscope from './components/Oscilloscope';
import SignalGenerator from './components/SignalGenerator';
import LogicAnalyzer from './components/LogicAnalyzer';
import PowerSupply from './components/PowerSupply';
import SpectrumAnalyzer from './components/SpectrumAnalyzer';
import NetworkAnalyzer from './components/NetworkAnalyzer';
import PWMGenerator from './components/PWMGenerator';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GEN' | 'SCOPE' | 'SPECTRUM' | 'NETWORK' | 'LOGIC' | 'DC' | 'PWM'>('SCOPE');
  const [isRunning, setIsRunning] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  const [state, setState] = useState<InstrumentState>({
    connectionStatus: 'DISCONNECTED',
    scope: {
      ch1: { enabled: true, scale: 1, offset: 0, color: '#3b82f6' },
      ch2: { enabled: true, scale: 2, offset: 0, color: '#f59e0b' },
      timebase: 0.001,
      triggerMode: 'AUTO',
      triggerLevel: 0,
      isArmed: false,
    },
    generator: { enabled: false, type: 'SINE', frequency: 1000, amplitude: 5, offset: 0 },
    pwm: { enabled: false, frequency: 10000, dutyCycle: 50 },
    dc: { voltage: 0 },
    logicAnalyzer: { enabled: true, channels: Array(16).fill(true), sampleRate: 1000000, triggerMode: 'AUTO', isArmed: false },
    spectrum: { enabled: true, range: 20000, window: 'HANNING' },
    network: { startFreq: 10, stopFreq: 100000, points: 100, running: false }
  });

  const updateState = <K extends keyof InstrumentState>(key: K, value: Partial<InstrumentState[K]>) => {
    setState(prev => ({ ...prev, [key]: { ...prev[key], ...value } }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-[#1e293b] overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <nav className="h-14 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-2 shadow-sm z-50">
        <div className="flex items-center gap-3 mr-4">
          <div className="p-1.5 bg-blue-600 rounded-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex h-full gap-1 overflow-x-auto no-scrollbar">
          <NavTab active={activeTab === 'GEN'} onClick={() => setActiveTab('GEN')} icon={<Zap size={18} />} label="GEN" />
          <NavTab active={activeTab === 'SCOPE'} onClick={() => setActiveTab('SCOPE')} icon={<Activity size={18} />} label="SCOPE" />
          <NavTab active={activeTab === 'SPECTRUM'} onClick={() => setActiveTab('SPECTRUM')} icon={<Waves size={18} />} label="SPEC" />
          <NavTab active={activeTab === 'NETWORK'} onClick={() => setActiveTab('NETWORK')} icon={<Share2 size={18} />} label="NET" />
          <NavTab active={activeTab === 'PWM'} onClick={() => setActiveTab('PWM')} icon={<Tally4 size={18} />} label="PWM" />
          <NavTab active={activeTab === 'LOGIC'} onClick={() => setActiveTab('LOGIC')} icon={<Cpu size={18} />} label="LOGIC" />
          <NavTab active={activeTab === 'DC'} onClick={() => setActiveTab('DC')} icon={<Battery size={18} />} label="DC" />
        </div>
      </nav>

      {/* Status Header */}
      <div className="h-14 bg-white/60 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">VirtualLab</span>
          <span className="text-blue-600 text-[11px] font-mono px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">Pro v3.3</span>
          <div className="w-[1px] h-4 bg-slate-200 mx-2" />
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-400'}`} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAIOpen(!isAIOpen)}
            className={`p-2 rounded-xl transition-all ${isAIOpen ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
          >
            <MessageSquare size={18} />
          </button>
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-xl border transition-all shadow-sm ${isRunning ? 'bg-white border-red-200 text-red-500 hover:bg-red-50' : 'bg-green-600 border-green-600 text-white'}`}
          >
            {isRunning ? <Square size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>

      {/* Workspace */}
      <main className="flex-1 p-3 md:p-4 overflow-hidden relative">
        <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {activeTab === 'GEN' && <SignalGenerator state={state.generator} onUpdate={(val) => updateState('generator', val)} />}
          {activeTab === 'SCOPE' && <Oscilloscope state={state} isRunning={isRunning} onUpdate={(val) => updateState('scope', val)} />}
          {activeTab === 'SPECTRUM' && <SpectrumAnalyzer state={state} isRunning={isRunning} />}
          {activeTab === 'NETWORK' && <NetworkAnalyzer state={state.network} onUpdate={(val) => updateState('network', val)} />}
          {activeTab === 'LOGIC' && <LogicAnalyzer state={state} isRunning={isRunning} onUpdate={(val) => updateState('logicAnalyzer', val)} />}
          {activeTab === 'PWM' && <PWMGenerator state={state.pwm} onUpdate={(val) => updateState('pwm', val)} />}
          {activeTab === 'DC' && <PowerSupply state={state} onUpdateDC={(val) => updateState('dc', val)} onUpdatePWM={(val) => updateState('pwm', val)} />}
        </div>

        {/* Floating AI Assistant */}
        {isAIOpen && (
          <div className="fixed right-6 bottom-6 w-80 h-[500px] z-[60] shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <AIAssistant state={state} onClose={() => setIsAIOpen(false)} />
          </div>
        )}
      </main>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`h-full px-4 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${active ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
  >
    {icon}
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

export default App;

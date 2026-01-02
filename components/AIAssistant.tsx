
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { InstrumentState } from '../types';

interface AIAssistantProps {
  state: InstrumentState;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ state }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your Virtual Lab Assistant. I can help you analyze waveforms, suggest instrument configurations, or explain electronic principles. How can I help today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = `Current Lab State:
      Oscilloscope: CH1=${state.scope.ch1.enabled ? 'ON' : 'OFF'} @ ${state.scope.ch1.scale}V/div, CH2=${state.scope.ch2.enabled ? 'ON' : 'OFF'} @ ${state.scope.ch2.scale}V/div, Timebase: ${state.scope.timebase}s/div.
      Gen: ${state.generator.enabled ? 'RUNNING' : 'STOPPED'} (${state.generator.type}, ${state.generator.frequency}Hz, ${state.generator.amplitude}Vpp).
      DC: ${state.dc.voltage}V.
      PWM: ${state.pwm.enabled ? 'ACTIVE' : 'IDLE'} (${state.pwm.dutyCycle}% Duty, ${state.pwm.frequency}Hz).
      Logic Analyzer: ON (16 channels).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${context}\n\nUser Question: ${userMsg}`,
        config: {
          systemInstruction: "You are an expert electrical engineer and lab assistant for the Web-Logic Virtual Instrument suite. Provide technical advice, troubleshooting, and explanations based on the current instrument state. Keep responses concise and professional."
        }
      });

      const reply = response.text || "I'm sorry, I couldn't process that signal analysis.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to the AI engineering hub lost. Please check your network." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-80 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <BrainCircuit className="text-blue-500" size={18} />
          </div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Lab Assistant</span>
        </div>
        <Sparkles size={14} className="text-blue-500 animate-pulse" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-bl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-3 rounded-2xl animate-pulse flex gap-1">
              <div className="w-1 h-1 bg-slate-500 rounded-full" />
              <div className="w-1 h-1 bg-slate-500 rounded-full" />
              <div className="w-1 h-1 bg-slate-500 rounded-full" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask lab assistant..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 pr-10 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-400"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

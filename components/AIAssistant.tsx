
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, BrainCircuit, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { InstrumentState } from '../types';

interface AIAssistantProps {
  state: InstrumentState;
  onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ state, onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your Virtual Lab Assistant. I can help you analyze waveforms or suggest configurations. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `State: Scope=${state.scope.ch1.enabled}, Gen=${state.generator.frequency}Hz. User: ${userMsg}`,
        config: { systemInstruction: "Expert electronics lab assistant. Concise technical replies." }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "No response." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden ring-1 ring-black/5">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <BrainCircuit size={16} />
          </div>
          <span className="text-xs font-black text-slate-800 tracking-widest uppercase">Assistant</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[10px] text-slate-400 italic animate-pulse">Thinking...</div>}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="relative">
          <input 
            type="text" placeholder="Type a message..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all shadow-sm"
          />
          <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-500 p-1">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

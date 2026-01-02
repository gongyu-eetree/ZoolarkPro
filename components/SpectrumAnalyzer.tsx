
import React, { useEffect, useRef } from 'react';
import { InstrumentState } from '../types';

interface SpectrumAnalyzerProps {
  state: InstrumentState;
  isRunning: boolean;
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ state, isRunning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !isRunning) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let frame = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      const xLogLines = 10;
      for (let i = 1; i <= xLogLines; i++) {
        const x = (i / xLogLines) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const y = (i / 8) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Noise and Signal
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      
      const freq = state.generator.enabled ? state.generator.frequency : 0;
      const amplitude = state.generator.enabled ? state.generator.amplitude * 10 : 0;
      
      for (let x = 0; x < width; x++) {
        // Simulated noise floor
        let magnitude = (Math.random() * 5) + (height * 0.85);
        
        // Main peak
        if (freq > 0) {
          const peakX = (freq / 20000) * width; // Mapping freq to width
          const dist = Math.abs(x - peakX);
          if (dist < 20) {
            magnitude -= (amplitude * 5 * (1 - dist/20)) + (Math.sin(frame * 0.1) * 2);
          }
          // Harmonics (simplified)
          const harmonicX = (freq * 2 / 20000) * width;
          const hDist = Math.abs(x - harmonicX);
          if (hDist < 10) {
             magnitude -= (amplitude * 1.5 * (1 - hDist/10));
          }
        }

        if (x === 0) ctx.moveTo(x, magnitude);
        else ctx.lineTo(x, magnitude);
      }
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#64748b';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('0Hz', 5, height - 5);
      ctx.fillText('10kHz', width / 2 - 15, height - 5);
      ctx.fillText('20kHz', width - 35, height - 5);
      ctx.fillText('0dB', 5, 12);
      ctx.fillText('-40dB', 5, height / 2);
      ctx.fillText('-80dB', 5, height - 15);

      frame++;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, state.generator]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/30">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spectrum (FFT Mode)</h3>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="text-emerald-500">SPAN: 20kHz</span>
          <span className="text-blue-500">RBW: 10Hz</span>
          <span className="text-slate-500">WINDOW: HANNING</span>
        </div>
      </div>
      <div className="flex-1 p-4 relative">
        <canvas ref={canvasRef} width={1000} height={600} className="w-full h-full bg-black rounded border border-slate-800" />
        <div className="absolute top-8 right-8 bg-slate-900/80 border border-slate-700 p-3 rounded-lg text-[10px] font-mono shadow-xl">
           <div className="text-emerald-400 mb-1">Peak: {state.generator.frequency}Hz</div>
           <div className="text-slate-400">Level: -12.4dBm</div>
           <div className="text-slate-500">THD: 0.045%</div>
        </div>
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;

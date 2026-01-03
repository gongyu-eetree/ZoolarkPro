
import React, { useEffect, useRef, useState } from 'react';
import { InstrumentState } from '../types';

interface Marker {
  id: number;
  freq: number;
  color: string;
}

interface SpectrumAnalyzerProps {
  state: InstrumentState;
  isRunning: boolean;
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({ state, isRunning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [markers, setMarkers] = useState<Marker[]>([
    { id: 1, freq: 100000, color: '#ef4444' }, // Red marker
    { id: 2, freq: 500000, color: '#f59e0b' }, // Amber marker
  ]);
  const [draggingMarkerId, setDraggingMarkerId] = useState<number | null>(null);

  const MAX_FREQ = 1000000; // 1MHz span

  // Shared math logic for generating the spectrum curve
  const getMagnitudeAtX = (x: number, width: number, height: number, genFreq: number, genAmp: number) => {
    // Base noise floor (stable part for markers, slightly jittery for drawing)
    let magnitude = height * 0.9;
    
    if (genFreq > 0) {
      const peakX = (genFreq / MAX_FREQ) * width;
      
      // Fundamental
      const dist = Math.abs(x - peakX);
      if (dist < 30) {
        const peakHeight = (genAmp / 10) * (height * 0.7);
        magnitude -= peakHeight * Math.exp(-(dist * dist) / 15);
      }
      
      // 2nd Harmonic
      const h2X = (genFreq * 2 / MAX_FREQ) * width;
      const h2Dist = Math.abs(x - h2X);
      if (h2Dist < 20) {
        magnitude -= (genAmp / 10) * (height * 0.15) * Math.exp(-(h2Dist * h2Dist) / 10);
      }

      // 3rd Harmonic
      const h3X = (genFreq * 3 / MAX_FREQ) * width;
      const h3Dist = Math.abs(x - h3X);
      if (h3Dist < 15) {
        magnitude -= (genAmp / 10) * (height * 0.05) * Math.exp(-(h3Dist * h3Dist) / 8);
      }
    }
    return magnitude;
  };

  useEffect(() => {
    if (!canvasRef.current || !isRunning) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const draw = () => {
      const { width, height } = canvas;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 10; i++) {
        const x = (i / 10) * width;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        const y = (i / 8) * height;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      const genFreq = state.generator.enabled ? state.generator.frequency : 0;
      const genAmp = state.generator.enabled ? state.generator.amplitude : 0;

      // Plot the curve
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981';
      
      for (let x = 0; x < width; x++) {
        let magnitude = getMagnitudeAtX(x, width, height, genFreq, genAmp);
        // Add visual jitter for realism
        magnitude += (Math.random() * 2);

        if (x === 0) ctx.moveTo(x, magnitude);
        else ctx.lineTo(x, magnitude);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Markers
      markers.forEach((m, idx) => {
        const x = (m.freq / MAX_FREQ) * width;
        const mag = getMagnitudeAtX(x, width, height, genFreq, genAmp);
        
        // Vertical line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = m.color;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        ctx.setLineDash([]);

        // Intersection point
        ctx.fillStyle = m.color;
        ctx.beginPath(); ctx.arc(x, mag, 4, 0, Math.PI * 2); ctx.fill();

        // Marker label
        const labelText = `M${m.id}: ${(m.freq / 1000).toFixed(1)}kHz | ${((height - mag) / height * -100).toFixed(1)}dB`;
        ctx.font = 'bold 11px JetBrains Mono';
        const textMetrics = ctx.measureText(labelText);
        const labelW = textMetrics.width + 10;
        const labelH = 20;
        
        // Background for label
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(x - labelW / 2, 20 + idx * 25, labelW, labelH);
        ctx.strokeStyle = m.color;
        ctx.strokeRect(x - labelW / 2, 20 + idx * 25, labelW, labelH);
        
        ctx.fillStyle = m.color;
        ctx.textAlign = 'center';
        ctx.fillText(labelText, x, 34 + idx * 25);
      });

      // Axis labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText('0Hz', 5, height - 10);
      ctx.fillText('500kHz', width / 2 - 20, height - 10);
      ctx.fillText('1MHz', width - 40, height - 10);
      ctx.fillText('0dB', 5, 15);
      ctx.fillText('-100dB', 5, height - 25);

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, state.generator, markers]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const freq = (x / canvasRef.current.width) * MAX_FREQ;

    // Find closest marker to click
    const threshold = MAX_FREQ * 0.02; // 2% of span
    const closest = markers.reduce((prev, curr) => {
      return (Math.abs(curr.freq - freq) < Math.abs(prev.freq - freq)) ? curr : prev;
    });

    if (Math.abs(closest.freq - freq) < threshold) {
      setDraggingMarkerId(closest.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingMarkerId === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const normalizedX = x / rect.width;
    const newFreq = normalizedX * MAX_FREQ;

    setMarkers(prev => prev.map(m => 
      m.id === draggingMarkerId ? { ...m, freq: newFreq } : m
    ));
  };

  const handleMouseUp = () => setDraggingMarkerId(null);

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none">
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/30">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Spectrum Analysis</h3>
          <div className="flex gap-2">
            {markers.map(m => (
              <div key={m.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-700 bg-slate-900/50">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-[10px] font-mono text-slate-300">M{m.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="text-emerald-500">SPAN: 1MHz</span>
          <span className="text-blue-500">RBW: 100Hz</span>
          <span className="text-slate-500">DRAG MARKERS TO MEASURE</span>
        </div>
      </div>
      <div className="flex-1 p-4 relative cursor-crosshair">
        <canvas 
          ref={canvasRef} 
          width={1000} 
          height={600} 
          className="w-full h-full bg-black rounded-lg border border-slate-800"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        <div className="absolute top-8 right-8 bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-[10px] font-mono shadow-2xl backdrop-blur-md pointer-events-none">
           <div className="text-emerald-400 font-bold mb-2">FFT MEASUREMENTS</div>
           <div className="flex justify-between gap-8 mb-1">
             <span className="text-slate-500">PEAK FUND.:</span>
             <span className="text-white">{state.generator.enabled ? state.generator.frequency.toLocaleString() : 0} Hz</span>
           </div>
           <div className="flex justify-between gap-8 mb-1">
             <span className="text-slate-500">PEAK LEVEL:</span>
             <span className="text-white">{(state.generator.amplitude * -2.5).toFixed(1)} dBm</span>
           </div>
           <div className="border-t border-slate-800 my-2 pt-2">
             <div className="text-blue-400 font-bold mb-1">MARKER DELTA (M2-M1)</div>
             <div className="flex justify-between gap-8">
               <span className="text-slate-500">FREQ Δ:</span>
               <span className="text-white">{Math.abs(markers[1].freq - markers[0].freq).toLocaleString()} Hz</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpectrumAnalyzer;

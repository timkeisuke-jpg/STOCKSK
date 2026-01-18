import React, { useRef, useState, useEffect } from 'react';
import { XIcon, CheckIcon, TrashIcon, RefreshIcon } from './Icons';

interface HandwritingInputProps {
  onClose: () => void;
  onComplete: (image: string) => void;
  isLoading: boolean;
}

export const HandwritingInput: React.FC<HandwritingInputProps> = ({ onClose, onComplete, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const setCanvasSize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            // Set actual size in memory (scaled to avoid blur on high DPI screens could be added here, but simple for now)
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // Re-apply styles after resize
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4;
            }
        }
    };

    setCanvasSize();
    // Optional: Add window resize listener if needed, but for modal it's usually fixed once opened.
  }, []);

  const getPoint = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasContent(true);
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleSubmit = () => {
      if(!canvasRef.current) return;
      // Export as PNG
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onComplete(dataUrl);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[60vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span>✏️ Handwriting Input</span>
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><XIcon className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 relative bg-white touch-none cursor-crosshair">
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                />
                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 select-none">
                        Write here...
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-between gap-3 bg-gray-50">
                <button onClick={clear} className="p-3 text-gray-500 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl transition-colors shadow-sm">
                    <TrashIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={!hasContent || isLoading}
                    className="flex-1 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md transition-all active:scale-95"
                >
                    {isLoading ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    <span>Recognize Text</span>
                </button>
            </div>
        </div>
    </div>
  )
}
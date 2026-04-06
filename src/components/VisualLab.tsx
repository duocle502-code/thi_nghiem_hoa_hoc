import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Beaker, FlaskConical, Info, RotateCcw, Zap, Loader2, Pipette } from 'lucide-react';
import { predictReaction } from '../services/geminiService';
import Swal from 'sweetalert2';

interface TestTubeData {
  id: number;
  chemicals: string[];
  color: string;
  bubbles: boolean;
  precipitate: boolean;
  message: string;
  isReacting: boolean;
}

interface VisualLabProps {
  chemicals: any[];
  isHeating?: boolean;
  onHeatingToggle?: () => void;
}

export const VisualLab: React.FC<VisualLabProps> = ({ chemicals, isHeating = false, onHeatingToggle }) => {
  const [testTubes, setTestTubes] = useState<TestTubeData[]>(
    Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      chemicals: [],
      color: '#ffffff',
      bubbles: false,
      precipitate: false,
      message: '',
      isReacting: false
    }))
  );

  const [activeDropper, setActiveDropper] = useState<string | null>(null);
  const [reactionLog, setReactionLog] = useState<string[]>([]);

  useEffect(() => {
    if (isHeating) {
      setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đã bật đèn cồn. Đang đun nóng các ống nghiệm...`, ...prev]);
    } else {
      if (reactionLog.length > 0) {
        setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đã tắt đèn cồn.`, ...prev]);
      }
    }
  }, [isHeating]);

  const pickChemical = (id: string) => {
    setActiveDropper(id);
  };

  const dropIntoTube = async (tubeId: number) => {
    if (!activeDropper) return;

    const tubeIndex = testTubes.findIndex(t => t.id === tubeId);
    const tube = testTubes[tubeIndex];

    if (tube.chemicals.includes(activeDropper)) {
      Swal.fire('Thông báo', 'Hóa chất này đã có trong ống nghiệm!', 'info');
      return;
    }

    const newChemicals = [...tube.chemicals, activeDropper];
    const updatedTubes = [...testTubes];
    updatedTubes[tubeIndex] = { ...tube, chemicals: newChemicals, isReacting: true };
    setTestTubes(updatedTubes);

    setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Thêm ${chemicals.find(c => c.id === activeDropper)?.name} vào Ống ${tubeId}`, ...prev]);

    if (newChemicals.length >= 2) {
      try {
        const chemNames = newChemicals.map(id => chemicals.find(c => c.id === id)?.name || id);
        const result = await predictReaction(chemNames);

        if (result) {
          updatedTubes[tubeIndex] = {
            ...updatedTubes[tubeIndex],
            color: result.color,
            bubbles: result.bubbles,
            precipitate: result.precipitate,
            message: result.message,
            isReacting: false
          };
          setTestTubes([...updatedTubes]);
          setReactionLog(prev => [
            `[${new Date().toLocaleTimeString()}] Ống ${tubeId}: ${result.message}`,
            `[${new Date().toLocaleTimeString()}] Phương trình: ${result.equation}`,
            ...prev
          ]);
        }
      } catch (error) {
        console.error("Reaction prediction failed:", error);
        updatedTubes[tubeIndex].isReacting = false;
        setTestTubes([...updatedTubes]);
      }
    } else {
      // Just update color to the chemical's color if it's the first one
      const chem = chemicals.find(c => c.id === activeDropper);
      updatedTubes[tubeIndex] = {
        ...updatedTubes[tubeIndex],
        color: chem?.color || '#ffffff',
        isReacting: false
      };
      setTestTubes([...updatedTubes]);
    }
  };

  const resetTube = (id: number) => {
    setTestTubes(prev => prev.map(t => t.id === id ? {
      ...t,
      chemicals: [],
      color: '#ffffff',
      bubbles: false,
      precipitate: false,
      message: '',
      isReacting: false
    } : t));
  };

  const resetAll = () => {
    setTestTubes(prev => prev.map(t => ({
      ...t,
      chemicals: [],
      color: '#ffffff',
      bubbles: false,
      precipitate: false,
      message: '',
      isReacting: false
    })));
    setActiveDropper(null);
    setReactionLog([]);
  };

  const activeChem = chemicals.find(c => c.id === activeDropper);

  return (
    <div className="flex flex-col h-full gap-6 p-6 bg-slate-50 rounded-3xl overflow-hidden">
      {/* Status Bar */}
      <div className="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 text-blue-700 font-medium shadow-sm">
        <Info className="w-5 h-5" />
        {activeDropper ? (
          <span>Đang lấy <strong>{activeChem?.name} ({activeChem?.formula})</strong>. Hãy nhỏ vào ống nghiệm.</span>
        ) : (
          <span>Hãy chọn hóa chất từ kệ để bắt đầu thí nghiệm.</span>
        )}
      </div>

      {/* Chemical Shelf */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Kệ hóa chất</div>
        <div className="flex flex-wrap gap-4 justify-center">
          {chemicals.map(chem => (
            <motion.button
              key={chem.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => pickChemical(chem.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                activeDropper === chem.id 
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                  : "border-transparent hover:border-slate-200"
              )}
            >
              <div className="relative w-12 h-16">
                {/* Bottle Shape */}
                <div className="absolute inset-0 bg-slate-100 rounded-lg border-2 border-slate-300" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-3 bg-slate-400 rounded-sm" />
                <div 
                  className="absolute bottom-1 left-1 right-1 rounded-sm transition-all duration-500" 
                  style={{ backgroundColor: chem.color, height: '60%' }} 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-800 bg-white/80 px-1 rounded">{chem.formula}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 max-w-[80px] text-center leading-tight">{chem.name}</span>
              
              {activeDropper === chem.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Pipette className="w-3 h-3" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lab Area */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="relative flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-end overflow-hidden">
          {/* Background Lab Image (Optional) */}
          <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
             <FlaskConical className="w-96 h-96" />
          </div>

          {/* Test Tube Rack */}
          <div className="relative w-full max-w-4xl">
            {/* Rack Frame */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-orange-900/10 border-t-4 border-orange-900/20 rounded-t-xl" />
            <div className="absolute bottom-4 left-0 right-0 h-16 bg-orange-900/20 rounded-lg mx-4" />
            
            {/* Alcohol Lamp (Bunsen Burner) */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="relative cursor-pointer group" onClick={onHeatingToggle}>
                {/* Flame */}
                <AnimatePresence>
                  {isHeating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ 
                        opacity: [0.8, 1, 0.8], 
                        scale: [1, 1.1, 1],
                        y: 0
                      }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full blur-[2px] z-10"
                    />
                  )}
                </AnimatePresence>
                
                {/* Lamp Image */}
                <img 
                  src="https://img.icons8.com/fluency/512/alcohol-lamp.png" 
                  alt="Đèn cồn"
                  className={cn(
                    "w-24 h-24 object-contain transition-all duration-500",
                    isHeating ? "brightness-110 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "grayscale-[0.3] opacity-80"
                  )}
                  referrerPolicy="no-referrer"
                />
                
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded">
                  {isHeating ? "Tắt đèn cồn" : "Bật đèn cồn"}
                </div>
              </div>
            </div>

            {/* Tubes */}
            <div className="relative flex justify-around items-end px-8 gap-4">
              {testTubes.map(tube => (
                <div key={tube.id} className="flex flex-col items-center gap-4 group">
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Ống {tube.id}</div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => dropIntoTube(tube.id)}
                    className={cn(
                      "relative w-12 h-48 cursor-pointer transition-all",
                      activeDropper && "hover:ring-4 ring-primary/20 rounded-full"
                    )}
                  >
                    {/* Glass Tube */}
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm border-2 border-slate-200 rounded-full overflow-hidden">
                      {/* Liquid */}
                      <motion.div 
                        initial={false}
                        animate={{ height: tube.chemicals.length > 0 ? '60%' : '0%' }}
                        className="absolute bottom-0 left-0 right-0 transition-colors duration-1000"
                        style={{ backgroundColor: tube.color, opacity: 0.7 }}
                      >
                        {/* Bubbles Effect (Reaction or Heating) */}
                        {(tube.bubbles || (isHeating && tube.chemicals.length > 0)) && (
                          <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 15 }).map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{ 
                                  y: [-10, -120],
                                  opacity: [0, 1, 0],
                                  x: [Math.random() * 20, Math.random() * 20]
                                }}
                                transition={{ 
                                  duration: 0.8 + Math.random(), 
                                  repeat: Infinity,
                                  delay: Math.random() * 2
                                }}
                                className="absolute bottom-0 w-1.5 h-1.5 bg-white rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Reaction Overlay */}
                    <AnimatePresence>
                      {tube.isReacting && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-full"
                        >
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reset Button (Hidden by default) */}
                    {tube.chemicals.length > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetTube(tube.id); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Console / Log */}
        <div className="h-40 bg-slate-900 rounded-3xl p-6 text-slate-300 font-mono text-xs overflow-y-auto shadow-inner">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-bold uppercase tracking-wider">Nhật ký thí nghiệm</span>
            </div>
            <button 
              onClick={resetAll}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          {reactionLog.length === 0 ? (
            <div className="text-slate-600 italic">Chưa có hoạt động nào...</div>
          ) : (
            reactionLog.map((log, i) => (
              <div key={i} className="mb-1 flex gap-2">
                <span className="text-slate-500 shrink-0">{log.split(']')[0]}]</span>
                <span className={cn(
                  log.includes('Phương trình') ? "text-blue-400" : 
                  log.includes('Ống') ? "text-green-400" : "text-slate-300"
                )}>
                  {log.split(']')[1]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

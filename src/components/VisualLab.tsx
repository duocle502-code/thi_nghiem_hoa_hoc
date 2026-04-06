import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Beaker, FlaskConical, Info, RotateCcw, Zap, Loader2, Pipette, Search, AlertTriangle, Flame, Droplets, X } from 'lucide-react';
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

// Phân loại hóa chất theo nhóm
const getChemicalCategory = (id: string): string => {
  const acids = ['hcl', 'h2so4', 'hno3'];
  const bases = ['naoh', 'koh', 'caoh2'];
  const salts = ['bacl2', 'agno3', 'cuso4', 'fecl3', 'na2co3', 'ki', 'kmno4'];
  const metals = ['fe', 'zn', 'cu', 'al', 'mg'];
  const indicators = ['litmus', 'phenolphthalein', 'methylorange'];

  if (acids.includes(id)) return 'Axit';
  if (bases.includes(id)) return 'Bazơ';
  if (salts.includes(id)) return 'Muối & Oxit';
  if (metals.includes(id)) return 'Kim loại';
  if (indicators.includes(id)) return 'Chỉ thị';
  return 'Khác';
};

const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Axit': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  'Bazơ': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Muối & Oxit': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Kim loại': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' },
  'Chỉ thị': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  'Khác': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Nhóm hóa chất theo danh mục
  const groupedChemicals = useMemo(() => {
    const groups: Record<string, any[]> = {};
    chemicals.forEach(chem => {
      const cat = getChemicalCategory(chem.id);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(chem);
    });
    return groups;
  }, [chemicals]);

  // Lọc hóa chất theo tìm kiếm và danh mục
  const filteredChemicals = useMemo(() => {
    let result = chemicals;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      result = result.filter(c => getChemicalCategory(c.id) === activeCategory);
    }
    return result;
  }, [chemicals, searchQuery, activeCategory]);

  // Nhóm kết quả đã lọc
  const filteredGrouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredChemicals.forEach(chem => {
      const cat = getChemicalCategory(chem.id);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(chem);
    });
    return groups;
  }, [filteredChemicals]);

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
  const categories = Object.keys(groupedChemicals);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* ===== BÊN TRÁI: Khu vực thí nghiệm ===== */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Status Bar */}
        <div className="bg-blue-50 border border-blue-100 px-5 py-2.5 rounded-2xl flex items-center gap-3 text-blue-700 font-medium shadow-sm shrink-0">
          <Info className="w-5 h-5 shrink-0" />
          {activeDropper ? (
            <span className="text-sm">
              Đang cầm <strong className="text-blue-900">{activeChem?.name} ({activeChem?.formula})</strong>
              <span className="text-blue-500 ml-1">— Nhấp vào ống nghiệm để nhỏ vào.</span>
              <button
                onClick={() => setActiveDropper(null)}
                className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-200/60 hover:bg-blue-200 rounded-lg text-xs font-bold text-blue-800 transition-colors"
              >
                <X className="w-3 h-3" /> Bỏ
              </button>
            </span>
          ) : (
            <span className="text-sm">Chọn hóa chất từ danh sách bên phải để bắt đầu thí nghiệm.</span>
          )}
        </div>

        {/* Khu vực ống nghiệm */}
        <div className="relative flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-end overflow-hidden min-h-[400px]">
          {/* Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <FlaskConical className="w-80 h-80" />
          </div>

          {/* Alcohol Lamp */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="relative cursor-pointer group" onClick={onHeatingToggle}>
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

              <img
                src="https://img.icons8.com/fluency/512/alcohol-lamp.png"
                alt="Đèn cồn"
                className={cn(
                  "w-20 h-20 object-contain transition-all duration-500",
                  isHeating ? "brightness-110 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "grayscale-[0.3] opacity-80"
                )}
                referrerPolicy="no-referrer"
              />

              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded">
                {isHeating ? "Tắt đèn cồn" : "Bật đèn cồn"}
              </div>
            </div>
          </div>

          {/* Test Tube Rack */}
          <div className="relative w-full max-w-3xl">
            {/* Rack Frame */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-orange-900/10 border-t-4 border-orange-900/20 rounded-t-xl" />
            <div className="absolute bottom-3 left-0 right-0 h-14 bg-orange-900/20 rounded-lg mx-4" />

            {/* Tubes */}
            <div className="relative flex justify-around items-end px-6 gap-3">
              {testTubes.map(tube => (
                <div key={tube.id} className="flex flex-col items-center gap-3 group">
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Ống {tube.id}</div>

                  {/* Các hóa chất đã thêm */}
                  {tube.chemicals.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-[60px]">
                      {tube.chemicals.map(chemId => (
                        <span key={chemId} className="text-[8px] font-bold px-1 py-0 rounded bg-primary/10 text-primary leading-tight">
                          {chemicals.find(c => c.id === chemId)?.formula}
                        </span>
                      ))}
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => dropIntoTube(tube.id)}
                    className={cn(
                      "relative w-10 h-44 cursor-pointer transition-all",
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
                        {/* Bubbles */}
                        {(tube.bubbles || (isHeating && tube.chemicals.length > 0)) && (
                          <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  y: [-10, -100],
                                  opacity: [0, 1, 0],
                                  x: [Math.random() * 16, Math.random() * 16]
                                }}
                                transition={{
                                  duration: 0.8 + Math.random(),
                                  repeat: Infinity,
                                  delay: Math.random() * 2
                                }}
                                className="absolute bottom-0 w-1 h-1 bg-white rounded-full"
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
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reset Button */}
                    {tube.chemicals.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); resetTube(tube.id); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </motion.div>

                  {/* Kết quả phản ứng */}
                  {tube.message && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] font-medium text-slate-600 text-center max-w-[80px] leading-tight bg-slate-50 px-1.5 py-1 rounded-lg"
                    >
                      {tube.message}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Console / Log */}
        <div className="h-36 bg-slate-900 rounded-2xl p-4 text-slate-300 font-mono text-xs overflow-y-auto shadow-inner shrink-0">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Nhật ký thí nghiệm</span>
            </div>
            <button
              onClick={resetAll}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          {reactionLog.length === 0 ? (
            <div className="text-slate-600 italic text-[11px]">Chưa có hoạt động nào...</div>
          ) : (
            reactionLog.map((log, i) => (
              <div key={i} className="mb-0.5 flex gap-2 text-[11px]">
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

      {/* ===== BÊN PHẢI: Danh sách hóa chất ===== */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A90E2] to-[#FF9500] flex items-center justify-center text-white">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Kệ Hóa Chất</h3>
              <p className="text-[10px] text-slate-400">{chemicals.length} loại hóa chất</p>
            </div>
          </div>

          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-slate-300"
            />
          </div>

          {/* Bộ lọc danh mục */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                !activeCategory
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              Tất cả
            </button>
            {categories.map(cat => {
              const colors = categoryColors[cat] || categoryColors['Khác'];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1",
                    activeCategory === cat
                      ? `${colors.bg} ${colors.text} border ${colors.border}`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách hóa chất - có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {Object.entries(filteredGrouped).map(([category, chems]) => {
            const colors = categoryColors[category] || categoryColors['Khác'];
            return (
              <div key={category}>
                {/* Tên nhóm */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>
                    {category}
                  </span>
                  <span className="text-[10px] text-slate-300">({chems.length})</span>
                </div>

                {/* Danh sách */}
                <div className="space-y-1.5">
                  {chems.map((chem: any) => (
                    <motion.button
                      key={chem.id}
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pickChemical(chem.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group",
                        activeDropper === chem.id
                          ? "bg-primary/10 border-2 border-primary shadow-md shadow-primary/10"
                          : "bg-slate-50/80 border-2 border-transparent hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {/* Mẫu màu hóa chất */}
                      <div className="relative shrink-0">
                        <div
                          className="w-9 h-12 rounded-lg border-2 border-slate-200 relative overflow-hidden"
                          style={{ backgroundColor: '#f8fafc' }}
                        >
                          {/* Nút chai */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-slate-400 rounded-b-sm" />
                          {/* Chất lỏng */}
                          <div
                            className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                            style={{ backgroundColor: chem.color, height: '55%', opacity: 0.85 }}
                          />
                        </div>
                        {activeDropper === chem.id && (
                          <motion.div
                            layoutId="dropper-indicator"
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Pipette className="w-2.5 h-2.5" />
                          </motion.div>
                        )}
                      </div>

                      {/* Thông tin hóa chất */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">{chem.name}</span>
                          {chem.state === 'solid' && (
                            <span className="text-[8px] font-bold bg-slate-200 text-slate-600 px-1 rounded">Rắn</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono font-bold text-primary">{chem.formula}</span>
                          {chem.concentration && (
                            <span className="text-[9px] text-slate-400">{chem.concentration}</span>
                          )}
                        </div>
                        {/* Cảnh báo an toàn */}
                        {chem.safetyWarnings?.some((w: string) => !w.includes('An toàn')) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span className="text-[8px] text-amber-600 font-medium truncate">
                              {chem.safetyWarnings.filter((w: string) => !w.includes('An toàn'))[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredChemicals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs font-medium">Không tìm thấy hóa chất</span>
            </div>
          )}
        </div>

        {/* Thông tin đang cầm */}
        <AnimatePresence>
          {activeDropper && activeChem && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="border-t border-slate-100 p-3 shrink-0 bg-gradient-to-t from-primary/5 to-transparent"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pipette className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Đang cầm</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-primary/20 shadow-sm">
                <div className="font-bold text-sm text-slate-800">{activeChem.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{activeChem.properties}</div>
                <div className="text-[10px] text-primary font-mono font-bold mt-1">{activeChem.formula} {activeChem.concentration ? `• ${activeChem.concentration}` : ''}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

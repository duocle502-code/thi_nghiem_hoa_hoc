import React, { useState } from 'react';
import { 
  Beaker, 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  BarChart3, 
  Settings as SettingsIcon,
  FlaskConical,
  Zap,
  Info,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Loader2,
  FileUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LabCanvas, ReactionEffect } from './components/LabCanvas';
import { VisualLab } from './components/VisualLab';
import { ProblemUploader } from './components/ProblemUploader';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AITutor } from './components/AITutor';
import { CHEMICALS, EXPERIMENTS, SUBJECTS } from './constants';
import { cn } from './lib/utils';
import Swal from 'sweetalert2';
import { predictReaction, LabProblemResult } from './services/geminiService';
import { ApparatusType } from './types';

import { QuizView } from './components/QuizView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isApiModalOpen, setIsApiModalOpen] = useState(!localStorage.getItem('gemini_api_key'));
  const [chemicals, setChemicals] = useState(CHEMICALS);
  const [activeExperiment, setActiveExperiment] = useState<string | undefined>();
  const [selectedChemicals, setSelectedChemicals] = useState<string[]>([]);
  const [customReaction, setCustomReaction] = useState<ReactionEffect | null>(null);
  const [isReacting, setIsReacting] = useState(false);
  const [apparatusType, setApparatusType] = useState<ApparatusType>('beaker');
  const [isHeating, setIsHeating] = useState(false);
  const [labMode, setLabMode] = useState<'3d' | 'visual'>('visual');
  const [reactionLog, setReactionLog] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isProblemUploaderOpen, setIsProblemUploaderOpen] = useState(false);
  const [labProblemResult, setLabProblemResult] = useState<LabProblemResult | null>(null);

  const handleReaction = (data: any) => {
    setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] ${data.message}`, ...prev]);
    if (data.status === 'completed' && !isReacting) {
      Swal.fire({
        title: 'Thành công!',
        text: data.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const startExperiment = (id: string) => {
    setActiveExperiment(id);
    setCustomReaction(null);
    setSelectedChemicals([]);
    setReactionLog([`[${new Date().toLocaleTimeString()}] Bắt đầu thí nghiệm: ${EXPERIMENTS.find(e => e.id === id)?.title}`]);
    setActiveTab('lab');
    setIsQuizMode(false);
  };

  const handleMix = async () => {
    if (selectedChemicals.length < 2) {
      Swal.fire('Thông báo', 'Vui lòng chọn ít nhất 2 hóa chất để trộn!', 'warning');
      return;
    }

    setIsReacting(true);
    setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đang phân tích phản ứng...`, ...prev]);

    try {
      const chemNames = selectedChemicals.map(id => chemicals.find(c => c.id === id)?.name || id);
      const result = await predictReaction(chemNames);
      
      if (result) {
        setCustomReaction({
          color: result.color,
          bubbles: result.bubbles,
          precipitate: result.precipitate,
          message: result.message
        });
        setReactionLog(prev => [
          `[${new Date().toLocaleTimeString()}] Phương trình: ${result.equation}`,
          `[${new Date().toLocaleTimeString()}] Giải thích: ${result.explanation}`,
          ...prev
        ]);
      } else {
        Swal.fire('Lỗi', 'Không thể dự đoán phản ứng. Vui lòng kiểm tra API Key!', 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Đã xảy ra lỗi khi gọi AI.', 'error');
    } finally {
      setIsReacting(false);
    }
  };

  const toggleChemical = (id: string) => {
    setSelectedChemicals(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setActiveExperiment(undefined);
    setCustomReaction(null);
  };

  const resetLab = () => {
    setSelectedChemicals([]);
    setActiveExperiment(undefined);
    setCustomReaction(null);
    setIsHeating(false);
    setReactionLog([`[${new Date().toLocaleTimeString()}] Đã làm sạch phòng thí nghiệm.`]);
  };

  const addChemical = (newChem: any) => {
    setChemicals(prev => [...prev, newChem]);
    Swal.fire({
      title: 'Thành công!',
      text: `Đã thêm ${newChem.name} vào thư viện.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Xử lý kết quả phân tích đề bài
  const handleProblemResult = (result: LabProblemResult) => {
    setLabProblemResult(result);
    
    // Merge hoá chất: dùng lại nếu trùng id, thêm mới nếu chưa có
    const newChemicals = [...chemicals];
    let addedCount = 0;
    
    result.chemicals.forEach(aiChem => {
      const existingIndex = newChemicals.findIndex(
        c => c.id === aiChem.id || c.formula.toLowerCase() === aiChem.formula.toLowerCase()
      );
      
      if (existingIndex === -1) {
        // Hoá chất mới - thêm vào danh sách
        newChemicals.push({
          ...aiChem,
          id: aiChem.id || aiChem.formula.toLowerCase().replace(/[^a-z0-9]/g, ''),
          concentration: aiChem.concentration || undefined,
        });
        addedCount++;
      }
    });
    
    setChemicals(newChemicals);
    setActiveTab('lab');
    setLabMode('visual');
    setIsQuizMode(false);
    
    Swal.fire({
      title: '✨ Phân tích thành công!',
      html: `<div style="text-align:left">
        <p><strong>Đề bài:</strong> ${result.problem_summary}</p>
        <p style="margin-top:8px"><strong>Hoá chất:</strong> ${result.chemicals.length} loại${addedCount > 0 ? ` (${addedCount} mới)` : ''}</p>
        <p style="margin-top:8px"><strong>Phương trình:</strong></p>
        <ul>${result.equations.map(eq => `<li style="font-family:monospace;margin:4px 0">${eq}</li>`).join('')}</ul>
      </div>`,
      icon: 'success',
      confirmButtonText: 'Bắt đầu thí nghiệm!',
      confirmButtonColor: '#8b5cf6',
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsQuizMode(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'lab', label: 'Phòng thí nghiệm', icon: FlaskConical },
    { id: 'library', label: 'Thư viện hóa chất', icon: Library },
    { id: 'lessons', label: 'Bài giảng', icon: BookOpen },
    { id: 'progress', label: 'Tiến độ', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#1e293b] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Beaker className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold gradient-text">ChemAR</h1>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-1">
              <Zap className="w-4 h-4" />
              <span>Streak: 5 ngày</span>
            </div>
            <div className="w-full bg-orange-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-3/4" />
            </div>
          </div>

          <button 
            onClick={() => setIsApiModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            Cấu hình AI
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              {isQuizMode ? 'Kiểm tra kiến thức' : navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm hóa chất, bài học..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
              DL
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {isQuizMode ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <QuizView onComplete={(score) => console.log('Quiz completed with score:', score)} />
              </motion.div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {SUBJECTS.map((subject) => (
                        <div key={subject.id} className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-transform cursor-pointer group">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Beaker className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-gray-800 mb-1">{subject.name}</h3>
                          <p className="text-sm text-gray-500">{subject.questionsCount} bài học</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Thí nghiệm đề xuất</h3>
                          <button 
                            onClick={() => setIsQuizMode(true)}
                            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                          >
                            Làm bài kiểm tra <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {EXPERIMENTS.map((exp) => (
                            <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <div className="h-32 bg-gray-100 relative">
                                <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent flex items-end p-4">
                                  <span className="text-white text-xs font-bold bg-primary px-2 py-1 rounded">Cơ bản</span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h4 className="font-bold text-gray-800 mb-2">{exp.title}</h4>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exp.description}</p>
                                <button 
                                  onClick={() => startExperiment(exp.id)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                                >
                                  <Play className="w-4 h-4 fill-current" /> Bắt đầu ngay
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-bold">AI Tutor Trực tuyến</h3>
                        <div className="h-[500px]">
                          <AITutor />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'lab' && (
                  <motion.div 
                    key="lab"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col gap-6 h-full"
                  >
                    <div className="flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold">Phòng thí nghiệm</h2>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setLabMode('visual')}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                              labMode === 'visual' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                          >
                            Chế độ Trực quan
                          </button>
                          <button 
                            onClick={() => setLabMode('3d')}
                            className={cn(
                              "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                              labMode === '3d' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                            )}
                          >
                            Chế độ 3D AR
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setIsProblemUploaderOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <FileUp className="w-4 h-4" /> Tải đề bài
                        </button>
                        <button 
                          onClick={resetLab}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" /> Làm sạch tất cả
                        </button>
                      </div>
                    </div>

                    {labMode === 'visual' ? (
                      <div className="flex-1 min-h-0">
                        <VisualLab chemicals={chemicals} isHeating={isHeating} onHeatingToggle={() => setIsHeating(!isHeating)} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
                        <div className="lg:col-span-3 flex flex-col gap-6">
                          <div className="relative flex-1 bg-white rounded-3xl border-4 border-white shadow-xl overflow-hidden min-h-[500px]">
                            <LabCanvas 
                              activeExperiment={activeExperiment} 
                              customReaction={customReaction}
                              apparatusType={apparatusType}
                              isHeating={isHeating}
                              onReaction={handleReaction} 
                            />
                            
                            {/* AR Overlay UI */}
                            <div className="absolute top-6 left-6 flex flex-col gap-3">
                              <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                AR Mode: Active
                              </div>
                              {selectedChemicals.length > 0 && (
                                <div className="glass-card p-3 rounded-2xl space-y-2 min-w-[150px]">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase">Đã thêm:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedChemicals.map(id => (
                                      <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                        {chemicals.find(c => c.id === id)?.formula}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Apparatus Controls */}
                            <div className="absolute top-6 right-6 flex flex-col gap-3">
                              <div className="glass-card p-2 rounded-2xl flex flex-col gap-2">
                                <button 
                                  onClick={() => setApparatusType('beaker')}
                                  className={cn(
                                    "p-3 rounded-xl transition-all",
                                    apparatusType === 'beaker' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                                  )}
                                  title="Cốc thủy tinh"
                                >
                                  <Beaker className="w-6 h-6" />
                                </button>
                                <button 
                                  onClick={() => setApparatusType('test-tube')}
                                  className={cn(
                                    "p-3 rounded-xl transition-all",
                                    apparatusType === 'test-tube' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                                  )}
                                  title="Ống nghiệm"
                                >
                                  <FlaskConical className="w-6 h-6" />
                                </button>
                              </div>

                              <button 
                                onClick={() => setIsHeating(!isHeating)}
                                className={cn(
                                  "glass-card p-4 rounded-2xl transition-all flex items-center justify-center",
                                  isHeating ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-gray-500 hover:bg-white"
                                )}
                                title="Đèn cồn"
                              >
                                <Zap className={cn("w-6 h-6", isHeating && "animate-pulse")} />
                              </button>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                              <div className="flex gap-3">
                                <button 
                                  onClick={resetLab}
                                  className="glass-card p-3 rounded-2xl hover:bg-white transition-colors"
                                  title="Làm sạch"
                                >
                                  <RotateCcw className="w-6 h-6 text-gray-700" />
                                </button>
                              </div>
                              <div className="flex gap-3">
                                {selectedChemicals.length >= 2 && !activeExperiment && (
                                  <button 
                                    onClick={handleMix}
                                    disabled={isReacting}
                                    className="px-8 py-3 gradient-bg text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2"
                                  >
                                    {isReacting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    Tiến hành phản ứng
                                  </button>
                                )}
                                <button 
                                  onClick={resetLab}
                                  className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                                >
                                  Dừng thí nghiệm
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-900 rounded-2xl p-6 text-white font-mono text-sm h-48 overflow-y-auto">
                            <div className="flex items-center gap-2 text-gray-400 mb-4 border-b border-gray-800 pb-2">
                              <Info className="w-4 h-4" />
                              <span>Nhật ký phản ứng</span>
                            </div>
                            {reactionLog.length === 0 ? (
                              <div className="text-gray-600 italic">Chưa có hoạt động nào...</div>
                            ) : (
                              reactionLog.map((log, i) => (
                                <div key={i} className="mb-1 text-green-400">{log}</div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="glass-card p-6 rounded-2xl">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                              <FlaskConical className="w-5 h-5 text-primary" />
                              Dụng cụ & Hóa chất
                            </h3>
                            <div className="space-y-3">
                              {chemicals.map(chem => (
                                <div 
                                  key={chem.id} 
                                  onClick={() => toggleChemical(chem.id)}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer group",
                                    selectedChemicals.includes(chem.id) 
                                      ? "border-primary bg-primary/5" 
                                      : "bg-gray-50 border-gray-100 hover:border-primary"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: chem.color }} />
                                    <div>
                                      <div className="text-sm font-bold text-gray-800">{chem.name}</div>
                                      <div className="text-xs text-gray-500">{chem.formula}</div>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    selectedChemicals.includes(chem.id) ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:text-primary"
                                  )}>
                                    {selectedChemicals.includes(chem.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-6 rounded-2xl bg-yellow-50 border border-yellow-100">
                            <h4 className="text-yellow-800 font-bold text-sm mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Cảnh báo an toàn
                            </h4>
                            <ul className="text-xs text-yellow-700 space-y-1 list-disc pl-4">
                              <li>Luôn đeo kính bảo hộ ảo.</li>
                              <li>Không trộn lẫn các axit mạnh mà không có hướng dẫn.</li>
                              <li>Kiểm tra nhãn hóa chất trước khi sử dụng.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'library' && (
                  <motion.div 
                    key="library"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">Thư viện hóa chất</h3>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            Swal.fire({
                              title: 'Thêm hóa chất mới',
                              html: `
                                <input id="swal-name" class="swal2-input" placeholder="Tên hóa chất">
                                <input id="swal-formula" class="swal2-input" placeholder="Công thức">
                                <input id="swal-color" type="color" class="swal2-input" value="#3b82f6" style="height: 50px">
                                <select id="swal-state" class="swal2-input">
                                  <option value="liquid">Lỏng</option>
                                  <option value="solid">Rắn</option>
                                  <option value="gas">Khí</option>
                                </select>
                              `,
                              focusConfirm: false,
                              showCancelButton: true,
                              confirmButtonText: 'Thêm ngay',
                              cancelButtonText: 'Hủy',
                              preConfirm: () => {
                                const name = (document.getElementById('swal-name') as HTMLInputElement).value;
                                const formula = (document.getElementById('swal-formula') as HTMLInputElement).value;
                                const color = (document.getElementById('swal-color') as HTMLInputElement).value;
                                const state = (document.getElementById('swal-state') as HTMLSelectElement).value;
                                if (!name || !formula) {
                                  Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin!');
                                  return false;
                                }
                                return { id: Date.now().toString(), name, formula, color, state, safetyWarnings: ['Cần cẩn thận'], description: 'Hóa chất tự thêm' };
                              }
                            }).then((result) => {
                              if (result.isConfirmed) {
                                addChemical(result.value);
                              }
                            });
                          }}
                          className="flex items-center gap-2 px-6 py-2.5 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-5 h-5" /> Thêm hóa chất
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chemicals.map(chem => (
                        <div key={chem.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl shadow-inner border border-gray-100" style={{ backgroundColor: chem.color }} />
                            <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase">
                              {chem.state}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{chem.name}</h4>
                          <p className="text-primary font-mono font-bold mb-3">{chem.formula}</p>
                          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{chem.description}</p>
                          
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cảnh báo an toàn</div>
                            <div className="flex flex-wrap gap-2">
                              {chem.safetyWarnings.map((w, i) => (
                                <span key={i} className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-600 border border-red-100">
                                  {w}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'lessons' && (
                  <motion.div 
                    key="lessons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full text-gray-400 flex-col gap-4"
                  >
                    <BookOpen className="w-16 h-16 opacity-20" />
                    <p className="text-lg font-medium">Tính năng Bài giảng đang được cập nhật...</p>
                  </motion.div>
                )}

                {activeTab === 'progress' && (
                  <motion.div 
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">Điểm trung bình</div>
                        <div className="text-3xl font-bold text-primary">8.5</div>
                        <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 rotate-[-90deg]" /> +0.5 so với tuần trước
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">Thí nghiệm đã làm</div>
                        <div className="text-3xl font-bold text-gray-800">24</div>
                        <div className="text-xs text-gray-400 mt-2">Hoàn thành 80% mục tiêu</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm mb-1">Thời gian học</div>
                        <div className="text-3xl font-bold text-gray-800">12h 45m</div>
                        <div className="text-xs text-orange-600 mt-2">Đang trong chuỗi 5 ngày</div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-xl font-bold mb-6">Lịch sử hoạt động</h3>
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">Hoàn thành: Phản ứng trung hòa</div>
                                <div className="text-sm text-gray-500">Hôm qua, 14:30</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">9.0/10</div>
                              <div className="text-xs text-gray-400">Báo cáo đã nộp</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      <ProblemUploader
        isOpen={isProblemUploaderOpen}
        onClose={() => setIsProblemUploaderOpen(false)}
        onChemicalsGenerated={handleProblemResult}
      />
    </div>
  );
}

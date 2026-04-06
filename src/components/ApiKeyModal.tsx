import React, { useState } from 'react';
import { Settings, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export const ApiKeyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    Swal.fire({
      title: 'Đã lưu!',
      text: 'API Key của bạn đã được lưu an toàn.',
      icon: 'success',
      confirmButtonColor: '#4A90E2'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Cài đặt API Key</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <AlertCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Để sử dụng tính năng AI Tutor, bạn cần nhập Gemini API Key. 
            Key này được lưu trữ cục bộ trên trình duyệt của bạn.
          </p>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Key className="w-5 h-5" />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Nhập API Key của bạn..."
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Hướng dẫn lấy Key
            </h4>
            <p className="text-xs text-blue-700">
              Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a> để tạo API Key miễn phí.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 font-semibold text-white gradient-bg rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

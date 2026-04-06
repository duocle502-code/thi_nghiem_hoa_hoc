import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { callGeminiAI, SYSTEM_PROMPT } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Chào bạn! Mình là AI Tutor Hóa học. Bạn cần giải đáp thắc mắc gì về các thí nghiệm hôm nay không?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const prompt = `${SYSTEM_PROMPT}\n\nLịch sử trò chuyện:\n${messages.map(m => `${m.role === 'user' ? 'Học sinh' : 'AI'}: ${m.content}`).join('\n')}\nHọc sinh: ${userMessage}`;
      const response = await callGeminiAI(prompt);
      
      if (response) {
        setMessages(prev => [...prev, { role: 'ai', content: response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, mình không thể kết nối với bộ não AI lúc này. Bạn đã nhập API Key chưa?' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Có lỗi xảy ra khi gọi AI. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800">AI Tutor</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
          <Sparkles className="w-3 h-3" /> Trực tuyến
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-3 rounded-2xl bg-gray-100 text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi AI về hóa học..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

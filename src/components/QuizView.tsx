import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Question } from '../types';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: 'voco',
    content: 'Chất nào sau đây làm đổi màu quỳ tím sang đỏ?',
    type: 'multiple-choice',
    options: ['NaOH', 'HCl', 'NaCl', 'H2O'],
    correctAnswer: 'HCl',
    explanation: 'HCl là một axit mạnh, có khả năng làm quỳ tím chuyển sang màu đỏ.',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    subjectId: 'voco',
    content: 'Phản ứng giữa Axit và Bazơ tạo ra sản phẩm gì?',
    type: 'multiple-choice',
    options: ['Muối và Nước', 'Kim loại và Khí', 'Oxit và Nước', 'Chỉ có Muối'],
    correctAnswer: 'Muối và Nước',
    explanation: 'Đây là phản ứng trung hòa đặc trưng giữa axit và bazơ.',
    difficulty: 'easy'
  },
  {
    id: 'q3',
    subjectId: 'voco',
    content: 'Kim loại nào sau đây không tác dụng với dung dịch HCl?',
    type: 'multiple-choice',
    options: ['Fe', 'Zn', 'Cu', 'Al'],
    correctAnswer: 'Cu',
    explanation: 'Đồng (Cu) đứng sau Hidro trong dãy hoạt động hóa học nên không đẩy được Hidro ra khỏi axit HCl.',
    difficulty: 'medium'
  }
];

export const QuizView: React.FC<{ onComplete: (score: number) => void }> = ({ onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[currentIdx];

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete(score + (selectedOption === currentQuestion.correctAnswer ? 1 : 0));
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Kết quả bài kiểm tra</h2>
        <p className="text-gray-500 mb-8">Bạn đã hoàn thành xuất sắc bài kiểm tra kiến thức!</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <div className="text-2xl font-bold text-green-600">{score}/{SAMPLE_QUESTIONS.length}</div>
            <div className="text-xs text-green-700 font-medium">Câu đúng</div>
          </div>
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="text-2xl font-bold text-primary">{Math.round((score / SAMPLE_QUESTIONS.length) * 100)}%</div>
            <div className="text-xs text-primary font-medium">Tỷ lệ</div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={resetQuiz}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" /> Làm lại
          </button>
          <button 
            onClick={() => Swal.fire('Thông báo', 'Tính năng lưu kết quả đang được phát triển!', 'info')}
            className="flex items-center gap-2 px-6 py-3 gradient-bg text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Lưu báo cáo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Câu hỏi {currentIdx + 1}/{SAMPLE_QUESTIONS.length}</h3>
          <div className="h-1.5 w-48 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((currentIdx + 1) / SAMPLE_QUESTIONS.length) * 100}%` }} 
            />
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase",
          currentQuestion.difficulty === 'easy' ? "bg-green-100 text-green-600" :
          currentQuestion.difficulty === 'medium' ? "bg-yellow-100 text-yellow-600" :
          "bg-red-100 text-red-600"
        )}>
          {currentQuestion.difficulty}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 leading-tight">
          {currentQuestion.content}
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                selectedOption === option 
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                  : "border-gray-100 bg-white hover:border-gray-200",
                isAnswered && option === currentQuestion.correctAnswer && "border-green-500 bg-green-50",
                isAnswered && selectedOption === option && selectedOption !== currentQuestion.correctAnswer && "border-red-500 bg-red-50"
              )}
            >
              <span className="font-medium">{option}</span>
              {isAnswered && option === currentQuestion.correctAnswer && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {isAnswered && selectedOption === option && selectedOption !== currentQuestion.correctAnswer && <XCircle className="w-5 h-5 text-red-500" />}
            </button>
          ))}
        </div>
      </div>

      {isAnswered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border",
            selectedOption === currentQuestion.correctAnswer 
              ? "bg-green-50 border-green-100 text-green-800" 
              : "bg-red-50 border-red-100 text-red-800"
          )}
        >
          <div className="font-bold mb-1 flex items-center gap-2">
            {selectedOption === currentQuestion.correctAnswer ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {selectedOption === currentQuestion.correctAnswer ? 'Chính xác!' : 'Chưa đúng rồi!'}
          </div>
          <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
        </motion.div>
      )}

      <div className="flex justify-end pt-4">
        {!isAnswered ? (
          <button
            disabled={!selectedOption}
            onClick={handleCheck}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Kiểm tra đáp án
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 gradient-bg text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            {currentIdx < SAMPLE_QUESTIONS.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

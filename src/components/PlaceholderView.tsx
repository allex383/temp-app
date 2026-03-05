import React from 'react';
import { motion } from 'motion/react';
import { Construction, ArrowLeft } from 'lucide-react';
import { ViewId } from '../types';

interface PlaceholderViewProps {
  title: string;
  onBack: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-wider">Вернуться в меню</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-dashed border-zinc-300 rounded-3xl p-12 text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center p-6 bg-zinc-50 rounded-full text-zinc-400 mb-4">
          <Construction size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
          <p className="text-zinc-500 max-w-md mx-auto">
            Данный раздел находится в разработке. Формулы и справочные данные будут добавлены в ближайшее время.
          </p>
        </div>
        <div className="pt-8">
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
          >
            В главное меню
          </button>
        </div>
      </motion.div>
    </div>
  );
};

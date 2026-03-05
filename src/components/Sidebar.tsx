import React from 'react';
import { 
  Home, 
  Flame, 
  Wind, 
  Settings, 
  Droplets, 
  ChevronRight,
  Calculator,
  X
} from 'lucide-react';
import { ViewId } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'home', label: 'Главная', icon: <Home size={18} /> },
    { 
      label: 'Отопление', 
      icon: <Flame size={18} />,
      children: [
        { id: 'heating-volume', label: 'По наружному объему' },
        { id: 'heating-no-volume', label: 'Без геом. параметров' }
      ]
    },
    { 
      label: 'Вентиляция', 
      icon: <Wind size={18} />,
      children: [
        { id: 'vent-supply', label: 'Приточная по объему' },
        { id: 'vent-curtain', label: 'Тепловая завеса' }
      ]
    },
    { 
      label: 'Технология', 
      icon: <Settings size={18} />,
      children: [
        { id: 'tech-floor', label: 'Теплый пол' },
        { id: 'tech-pool', label: 'Бассейн' }
      ]
    },
    { id: 'gvs', label: 'ГВС', icon: <Droplets size={18} /> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-400 p-4">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-900 shadow-lg">
          <Calculator size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">HeatLoad Pro</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Инженерный портал</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <div key={idx} className="space-y-1">
            {item.id ? (
              <button
                onClick={() => { onNavigate(item.id as ViewId); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === item.id 
                    ? 'bg-white/10 text-white' 
                    : 'hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-4">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.children?.map(child => (
                  <button
                    key={child.id}
                    onClick={() => { onNavigate(child.id as ViewId); onClose(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all pl-10 ${
                      currentView === child.id 
                        ? 'bg-white/10 text-white' 
                        : 'hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    <span>{child.label}</span>
                    {currentView === child.id && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="pt-6 border-t border-zinc-800 mt-6 px-2">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          &copy; {new Date().getFullYear()} HeatLoad Pro. <br/>
          Методика бездоговорного потребления.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 border-r border-zinc-800 bg-zinc-900 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-zinc-900 z-[70] lg:hidden shadow-2xl"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

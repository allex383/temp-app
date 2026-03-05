import React from 'react';
import { motion } from 'motion/react';
import { Info, ChevronRight, Calculator, Flame, Wind, Settings, Droplets } from 'lucide-react';
import { ViewId } from '../types';

interface HomeViewProps {
  onNavigate: (view: ViewId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center p-3 bg-zinc-900 text-white rounded-2xl shadow-xl mb-4">
          <Calculator size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          HeatLoad Pro
        </h1>
        <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
          Методика установления тепловых нагрузок при выявлении бездоговорного потребления тепловой энергии, теплоносителя, самовольного присоединения и (или) пользования системами горячего водоснабжения.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard 
          title="Отопление" 
          icon={<Flame className="text-orange-500" />}
          items={[
            { id: 'heating-volume', label: 'По наружному объему здания' },
            { id: 'heating-no-volume', label: 'При отсутствии геом. параметров' }
          ]}
          onNavigate={onNavigate}
        />
        <SectionCard 
          title="Вентиляция" 
          icon={<Wind className="text-blue-500" />}
          items={[
            { id: 'vent-supply', label: 'Приточная вентиляция по объему' },
            { id: 'vent-curtain', label: 'Тепловая завеса' }
          ]}
          onNavigate={onNavigate}
        />
        <SectionCard 
          title="Технология" 
          icon={<Settings className="text-zinc-500" />}
          items={[
            { id: 'tech-floor', label: 'Теплый пол' },
            { id: 'tech-pool', label: 'Технология бассейна' }
          ]}
          onNavigate={onNavigate}
        />
        <SectionCard 
          title="ГВС" 
          icon={<Droplets className="text-cyan-500" />}
          items={[
            { id: 'gvs', label: 'Горячее водоснабжение' }
          ]}
          onNavigate={onNavigate}
        />
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <Info className="text-amber-600 shrink-0" size={24} />
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Важное примечание</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Все расчеты в данном приложении производятся на основании официальных методик расчета бездоговорного потребления. Результаты носят справочный характер и могут быть использованы для предварительной оценки тепловых нагрузок.
          </p>
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, items, onNavigate }: { 
  title: string, 
  icon: React.ReactNode, 
  items: { id: ViewId, label: string }[],
  onNavigate: (view: ViewId) => void
}) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-zinc-50 rounded-lg">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
    </div>
    <div className="space-y-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 text-left text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors group"
        >
          <span>{item.label}</span>
          <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
        </button>
      ))}
    </div>
  </motion.div>
);

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  RefreshCw, 
  Thermometer, 
  Layers,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  BookOpen,
  ArrowLeft,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VentilationVolumeInputs, CalculationResult } from '../types';
import { DEFAULT_VENTILATION_VOLUME_INPUTS } from '../constants';
import { QV_DATA } from '../qvData';
import { TO_DATA, TI_DATA } from '../q0Data';
import { InputField } from './InputField';

interface VentilationVolumeCalculatorProps {
  inputs: VentilationVolumeInputs;
  setInputs: React.Dispatch<React.SetStateAction<VentilationVolumeInputs>>;
  onBack: () => void;
}

export const VentilationVolumeCalculator: React.FC<VentilationVolumeCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isQvModalOpen, setIsQvModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const result = useMemo<CalculationResult>(() => {
    const { qv, vn, ti, to } = inputs;
    
    // Qv max = qv * Vn * (ti - to) * 10^-6, Gcal/h
    const totalGcal = qv * vn * (ti - to) * 1e-6;
    const totalMW = totalGcal / 0.859845;
    const totalWatts = totalMW * 1e6;

    return {
      totalMW: Math.round(totalMW * 1000) / 1000,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalWatts: Math.round(totalWatts),
      tempDiff: ti - to,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_VENTILATION_VOLUME_INPUTS);
    }
  };

  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ПРИТОЧНУЮ ВЕНТИЛЯЦИЮ ПО ОБЪЕМУ
========================================================
Дата: ${result.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
qv (уд. вент. характеристика): ${inputs.qv} ккал/(ч·м³·°C)
Vн (объем здания): ${inputs.vn} м³
ti (температура внутри): ${inputs.ti} °C
to (температура снаружи): ${inputs.to} °C

РАСЧЕТ:
-------
Δt = ${inputs.ti} - (${inputs.to}) = ${result.tempDiff} °C
Qv мах = ${inputs.qv} × ${inputs.vn} × ${result.tempDiff} × 10⁻⁶ = ${result.totalGcal} Гкал/час

ИТОГ:
-----
${result.totalGcal} Гкал/час
${result.totalMW} МВт
=======================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventilation_volume_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredQv = QV_DATA.filter(item => 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.volumeRange.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Вернуться в меню</span>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Сброс</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Download size={14} />
            <span>Экспорт</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl">
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
          Установление максимальной тепловой нагрузки на приточную вентиляцию на основании данных о строительном объеме здания.
        </h1>
        <div className="mt-4 h-1 w-20 rounded-full bg-zinc-900" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Layers size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Исходные данные</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <InputField 
                  label="qv - уд. вентиляционная характеристика" 
                  id="qv" 
                  value={inputs.qv} 
                  onChange={(val) => setInputs(prev => ({ ...prev, qv: val }))}
                  suffix="ккал/(ч·м³·°C)"
                  hint="Удельная вентиляционная характеристика здания."
                  action={
                    <button 
                      onClick={() => setIsQvModalOpen(true)}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      title="Справочник qv"
                    >
                      <BookOpen size={14} />
                    </button>
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <InputField 
                  label="Vн - объем здания по наружному обмеру" 
                  id="vn" 
                  value={inputs.vn} 
                  onChange={(val) => setInputs(prev => ({ ...prev, vn: val }))}
                  suffix="м³"
                  hint="Строительный объем здания по наружному обмеру."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Температурные параметры</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label="ti (Внутренняя темп.)" 
                id="ti" 
                value={inputs.ti} 
                onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
                suffix="°C"
                hint="Расчетная температура воздуха в вентилируемом здании."
                action={
                  <button 
                    onClick={() => setIsTiModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник ti"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />

              <InputField 
                label="to (Наружная темп.)" 
                id="to" 
                value={inputs.to} 
                onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
                suffix="°C"
                hint="Расчетная температура наружного воздуха для проектирования отопления."
                action={
                  <button 
                    onClick={() => setIsToModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник t0"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />
            </div>
          </section>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <motion.div 
              layout
              className="overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900 p-8 text-white shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Итоговая нагрузка</span>
                <Wind size={20} className="text-sky-400" />
              </div>
              
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-6xl font-light tracking-tighter">{result.totalGcal}</span>
                <span className="text-xl font-medium text-zinc-400">Гкал/час</span>
              </div>

              <div className="mb-8 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-300">{result.totalMW}</span>
                  <span>МВт</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>≈ {result.totalWatts.toLocaleString()} Вт</span>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Разность температур</span>
                  <span className="font-mono text-zinc-300">{result.tempDiff} °C</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Объем здания</span>
                  <span className="font-mono text-zinc-300">{inputs.vn} м³</span>
                </div>
              </div>
            </motion.div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Методика расчета</h3>
              <div className="rounded-lg bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-600">
                <p className="mb-2 font-bold text-zinc-900">Qv мах = qv · Vн · (ti – to) · 10⁻⁶</p>
                <div className="space-y-1 opacity-80">
                  <p>= {inputs.qv} × {inputs.vn} × ({inputs.ti} - ({inputs.to})) × 10⁻⁶</p>
                  <p>= {inputs.qv} × {inputs.vn} × {result.tempDiff} × 10⁻⁶</p>
                  <p className="font-bold text-zinc-900">= {result.totalGcal} Гкал/час</p>
                  <p className="mt-1 text-[9px] text-zinc-400">Перевод в МВт: {result.totalGcal} / 0.859845 = {result.totalMW} МВт</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-[10px] text-sky-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Расчет выполнен на основании строительного объема здания по наружному обмеру.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Qv Modal */}
      <AnimatePresence>
        {isQvModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQvModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <BookOpen size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник qv</h2>
                </div>
                <button 
                  onClick={() => setIsQvModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-zinc-100 px-6 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Поиск по категории или объему..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {QV_DATA.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <AlertCircle size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Данные справочника qv еще не загружены.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-zinc-100">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          <th className="px-4 py-3">Назначение здания</th>
                          <th className="px-4 py-3">Строительный объем</th>
                          <th className="px-4 py-3 text-right">qv</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {filteredQv.map((item, idx) => (
                          <tr 
                            key={idx}
                            onClick={() => { setInputs(prev => ({ ...prev, qv: item.value })); setIsQvModalOpen(false); }}
                            className="group cursor-pointer transition-colors hover:bg-zinc-50"
                          >
                            <td className="px-4 py-4 font-medium text-zinc-900">{item.category}</td>
                            <td className="px-4 py-4 text-zinc-500">{item.volumeRange}</td>
                            <td className="px-4 py-4 text-right">
                              <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                                {item.value}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ti Modal */}
      <AnimatePresence>
        {isTiModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTiModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник tᵢ</h2>
                </div>
                <button 
                  onClick={() => setIsTiModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Тип помещения</th>
                        <th className="px-4 py-3 text-right">tᵢ, °C</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {TI_DATA.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => { setInputs(prev => ({ ...prev, ti: item.value })); setIsTiModalOpen(false); }}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-zinc-900">{item.roomType}</div>
                            {item.note && <div className="text-[10px] text-zinc-400">{item.note}</div>}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* To Modal */}
      <AnimatePresence>
        {isToModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник t₀</h2>
                </div>
                <button 
                  onClick={() => setIsToModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Период постройки</th>
                        <th className="px-4 py-3 text-right">t₀, °C</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {TO_DATA.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => { setInputs(prev => ({ ...prev, to: item.value })); setIsToModalOpen(false); }}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-zinc-900">{item.period}</div>
                            {item.note && <div className="text-[10px] text-zinc-400">{item.note}</div>}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

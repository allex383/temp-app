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
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculationInputs, CalculationResult } from '../types';
import { KTP_CONSTANT, ALPHA_TABLE, DEFAULT_INPUTS } from '../constants';
import { Q0_DATA, TO_DATA, TI_DATA } from '../q0Data';
import { InputField } from './InputField';

interface HeatingVolumeCalculatorProps {
  inputs: CalculationInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculationInputs>>;
  onBack: () => void;
}

export const HeatingVolumeCalculator: React.FC<HeatingVolumeCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isQ0ModalOpen, setIsQ0ModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [isAlphaModalOpen, setIsAlphaModalOpen] = useState(false);
  const [q0SearchQuery, setQ0SearchQuery] = useState('');
  const [tiSearchQuery, setTiSearchQuery] = useState('');

  const result = useMemo<CalculationResult>(() => {
    const { alpha, q0, vn, vp, ti, to } = inputs;
    const volumeSum = vn + 0.4 * vp;
    const tempDiff = ti - to;
    const totalWatts = alpha * q0 * volumeSum * tempDiff * KTP_CONSTANT;
    const totalMW = totalWatts * 1e-6;
    const totalGcal = totalMW * 0.859845;

    return {
      totalMW: Math.round(totalMW * 1000) / 1000,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalWatts: Math.round(totalWatts),
      volumeSum,
      tempDiff,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_INPUTS);
    }
  };

  const filteredQ0Data = useMemo(() => {
    if (!q0SearchQuery) return Q0_DATA;
    const query = q0SearchQuery.toLowerCase();
    return Q0_DATA.filter(item => 
      item.category.toLowerCase().includes(query) || 
      (item.subCategory && item.subCategory.toLowerCase().includes(query)) ||
      item.volumeRange.toLowerCase().includes(query)
    );
  }, [q0SearchQuery]);

  const handleSelectQ0 = (value: number) => {
    setInputs(prev => ({ ...prev, q0: value }));
    setIsQ0ModalOpen(false);
  };

  const handleSelectTo = (value: number) => {
    setInputs(prev => ({ ...prev, to: value }));
    setIsToModalOpen(false);
  };

  const handleSelectTi = (value: number) => {
    setInputs(prev => ({ ...prev, ti: value }));
    setIsTiModalOpen(false);
  };

  const handleSelectAlpha = (value: number) => {
    setInputs(prev => ({ ...prev, alpha: value }));
    setIsAlphaModalOpen(false);
  };

  const filteredTiData = useMemo(() => {
    if (!tiSearchQuery) return TI_DATA;
    const query = tiSearchQuery.toLowerCase();
    return TI_DATA.filter(item => 
      item.roomType.toLowerCase().includes(query)
    );
  }, [tiSearchQuery]);

  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ ДЛЯ ОБЪЕКТОВ ТЕПЛОПОТРЕБЛЕНИЯ, ОСУЩЕСТВЛЯЮЩИХ БЕЗДОГОВОРНОЕ ПОТРЕБЛЕНИЕ ТЕПЛОВОЙ ЭНЕРГИИ, ТЕПЛОНОСИТЕЛЯ ПО СТРОИТЕЛЬНОМУ ОБЪЕМУ
=========================================================================================================================================================
Дата: ${result.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
α (поправочный коэффициент): ${inputs.alpha}
q0 (уд. отопительная характеристика): ${inputs.q0} Вт/(м³·°C)
Vн (объем здания): ${inputs.vn} м³
Vп (объем подвала): ${inputs.vp} м³
ti (температура внутри): ${inputs.ti} °C
to (температура снаружи): ${inputs.to} °C
kтп (коэффициент потерь): ${KTP_CONSTANT}

РАСЧЕТ:
-------
Vсум = ${inputs.vn} + 0,4 × ${inputs.vp} = ${result.volumeSum} м³
Δt = ${inputs.ti} - (${inputs.to}) = ${result.tempDiff} °C
Q = ${inputs.alpha} × ${inputs.q0} × ${result.volumeSum} × ${result.tempDiff} × ${KTP_CONSTANT} = ${result.totalWatts} Вт

ИТОГ:
-----
${result.totalMW} МВт
${result.totalGcal} Гкал/час
=======================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatload_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          Установление максимальной тепловой нагрузки на отопление жилых, общественных и производственных отдельно стоящих зданий по наружному объему.
        </h1>
        <div className="mt-4 h-1 w-20 rounded-full bg-zinc-900" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Layers size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Параметры здания</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label="α (Поправочный коэф.)" 
                id="alpha" 
                value={inputs.alpha} 
                onChange={(val) => setInputs(prev => ({ ...prev, alpha: val }))}
                step="0.001"
                suffix="Коэф."
                hint="Поправочный коэффициент на расчетную температуру наружного воздуха."
                action={
                  <button 
                    onClick={() => setIsAlphaModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник α"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />

              <InputField 
                label="q0 - уд. отопительная характеристика" 
                id="q0" 
                value={inputs.q0} 
                onChange={(val) => setInputs(prev => ({ ...prev, q0: val }))}
                suffix="Вт/(м³·°C)"
                hint="Удельная отопительная характеристика здания."
                action={
                  <button 
                    onClick={() => setIsQ0ModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник q0"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />

              <InputField 
                label="Vн (Наружный объем)" 
                id="vn" 
                value={inputs.vn} 
                onChange={(val) => setInputs(prev => ({ ...prev, vn: val }))}
                suffix="м³"
                hint="Объем здания по наружному обмеру."
              />

              <InputField 
                label="Vп (Объем подвала)" 
                id="vp" 
                value={inputs.vp} 
                onChange={(val) => setInputs(prev => ({ ...prev, vp: val }))}
                suffix="м³"
                hint="Объем подвальных помещений (если есть)."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Климатические данные</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label="ti (Внутренняя темп.)" 
                id="ti" 
                value={inputs.ti} 
                onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
                suffix="°C"
                hint="Расчетная температура воздуха внутри помещений."
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
                hint="Расчетная температура наружного воздуха."
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
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-6xl font-light tracking-tighter">{result.totalMW}</span>
                <span className="text-xl font-medium text-zinc-400">МВт</span>
              </div>

              <div className="mb-8 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="font-bold text-zinc-300">{result.totalGcal}</span>
                  <span>Гкал/час</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>≈ {result.totalWatts.toLocaleString()} Вт</span>
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-800 pt-6">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Суммарный объем</span>
                  <span className="font-mono text-zinc-300">{result.volumeSum} м³</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 uppercase font-semibold">Разность температур</span>
                  <span className="font-mono text-zinc-300">{result.tempDiff} °C</span>
                </div>
              </div>
            </motion.div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Методика расчета</h3>
              <div className="rounded-lg bg-zinc-50 p-4 font-mono text-[11px] leading-relaxed text-zinc-600">
                <p className="mb-2 font-bold text-zinc-900">Qо мах = α ∙ q0 ∙ (Vн + 0,4 ∙ Vп) ∙ (ti - to) ∙ kтп ∙ 10⁻⁶</p>
                <div className="space-y-1 opacity-80">
                  <p>= {inputs.alpha} × {inputs.q0} × ({inputs.vn} + 0,4 × {inputs.vp}) × ({inputs.ti} - ({inputs.to})) × {KTP_CONSTANT} × 10⁻⁶</p>
                  <p>= {inputs.alpha} × {inputs.q0} × {result.volumeSum} × {result.tempDiff} × {KTP_CONSTANT} × 10⁻⁶</p>
                  <p>= {result.totalWatts} × 10⁻⁶</p>
                  <p className="font-bold text-zinc-900">= {result.totalMW} МВт</p>
                  <p className="mt-1 text-[9px] text-zinc-400">Перевод в Гкал/час: {result.totalMW} × 0.859845 = {result.totalGcal} Гкал/час</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Расчет выполнен по методике бездоговорного потребления. Значения носят справочный характер.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modals (Q0, To, Ti, Alpha) */}
      <AnimatePresence>
        {isQ0ModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQ0ModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <BookOpen size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник q₀</h2>
                </div>
                <button 
                  onClick={() => setIsQ0ModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-zinc-100 px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Поиск по категории, объему или типу здания..."
                    value={q0SearchQuery}
                    onChange={(e) => setQ0SearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <th className="pb-3 pr-4">Категория</th>
                      <th className="pb-3 pr-4">Объем / Тип</th>
                      <th className="pb-3 text-right">q₀</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredQ0Data.length > 0 ? (
                      filteredQ0Data.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectQ0(item.value)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-zinc-900">{item.category}</div>
                            {item.subCategory && (
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{item.subCategory}</div>
                            )}
                          </td>
                          <td className="py-4 pr-4 text-zinc-500">
                            {item.volumeRange}
                          </td>
                          <td className="py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-zinc-400">
                          Ничего не найдено по вашему запросу
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                          onClick={() => handleSelectTo(item.value)}
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

              <div className="border-b border-zinc-100 px-6 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Поиск по типу помещения..."
                    value={tiSearchQuery}
                    onChange={(e) => setTiSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <th className="px-4 py-3">Тип помещения</th>
                      <th className="px-4 py-3 text-right">tᵢ, °C</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredTiData.length > 0 ? (
                      filteredTiData.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectTi(item.value)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="py-4 px-4">
                            <div className="font-semibold text-zinc-900">{item.roomType}</div>
                            {item.note && <div className="text-[10px] text-zinc-400">{item.note}</div>}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.value}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-12 text-center text-zinc-400">
                          Ничего не найдено по вашему запросу
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alpha Modal */}
      <AnimatePresence>
        {isAlphaModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAlphaModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-full max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Layers size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник α</h2>
                </div>
                <button 
                  onClick={() => setIsAlphaModalOpen(false)}
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
                        <th className="px-4 py-3">Температура t₀, °C</th>
                        <th className="px-4 py-3 text-right">Коэффициент α</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {ALPHA_TABLE.map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleSelectAlpha(item.alpha)}
                          className="group cursor-pointer transition-colors hover:bg-zinc-50"
                        >
                          <td className="px-4 py-4 font-medium text-zinc-900">
                            {item.temp} °C
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                              {item.alpha}
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

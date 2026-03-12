import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  X,
  Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HeatingNoVolumeInputs, CalculationResult } from '../types';
import { DEFAULT_HEATING_NO_VOLUME_INPUTS } from '../constants';
import { Q0_NO_VOLUME_DATA } from '../q0NoVolumeData';
import { TO_DATA, TI_DATA } from '../q0Data';
import { InputField } from './InputField';

interface HeatingNoVolumeCalculatorProps {
  inputs: HeatingNoVolumeInputs;
  setInputs: React.Dispatch<React.SetStateAction<HeatingNoVolumeInputs>>;
  onBack: () => void;
}

export const HeatingNoVolumeCalculator: React.FC<HeatingNoVolumeCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isQ0ModalOpen, setIsQ0ModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);

  const result = useMemo<CalculationResult>(() => {
    const { q0, area, k1, ti, to } = inputs;
    
    // If q0 is 0, we might be using the norm from the table
    // But the formula expects q0 in W/m2.
    // The table provides Norm in kJ/(m2*C*day)
    // Conversion: q0 [W/m2] = (Norm * (ti - to)) / 86.4
    
    const totalWatts = q0 * area * (1 + k1);
    const totalMW = totalWatts * 1e-6;
    const totalGcal = totalMW * 0.859845;

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
      setInputs(DEFAULT_HEATING_NO_VOLUME_INPUTS);
    }
  };

  const handleSelectNorm = (normValue: number) => {
    // Calculate q0 in W/m2 based on the norm and current temperatures
    const dt = inputs.ti - inputs.to;
    const calculatedQ0 = (normValue * dt) / 86.4;
    setInputs(prev => ({ ...prev, q0: Math.round(calculatedQ0 * 100) / 100 }));
    setIsQ0ModalOpen(false);
  };

  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ ПРИ ОТСУТСТВИИ ГЕОМЕТРИЧЕСКИХ ПАРАМЕТРОВ
================================================================
Дата: ${result.timestamp}

ИСХОДНЫЕ ДАННЫЕ:
----------------
qo (укрупненный показатель): ${inputs.q0} Вт/м²
A (общая площадь): ${inputs.area} м²
k1 (коэффициент обществ. зданий): ${inputs.k1}
to (температура снаружи): ${inputs.to} °C

РАСЧЕТ:
-------
Δt = ${inputs.ti} - (${inputs.to}) = ${result.tempDiff} °C
Qо мах = ${inputs.q0} × ${inputs.area} × (1 + ${inputs.k1}) = ${result.totalWatts} Вт

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
    link.download = `heatload_no_volume_report_${new Date().toISOString().split('T')[0]}.txt`;
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
          Установление максимальной тепловой нагрузки на отопление при отсутствии геометрических параметров (по общей площади).
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
                  label="qo - укрупненный показатель макс. расхода теплоты" 
                  id="q0" 
                  value={inputs.q0} 
                  onChange={(val) => setInputs(prev => ({ ...prev, q0: val }))}
                  suffix="Вт/м²"
                  hint="Укрупненный показатель максимального расхода теплоты на 1 м² общей площади."
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
              </div>

              <InputField 
                label="A - общая площадь здания" 
                id="area" 
                value={inputs.area} 
                onChange={(val) => setInputs(prev => ({ ...prev, area: val }))}
                suffix="м²"
                hint="Общая площадь здания на основании данных ЕГРН или техпаспорта."
              />

              <InputField 
                label="k1 - коэф. обществ. зданий" 
                id="k1" 
                value={inputs.k1} 
                onChange={(val) => setInputs(prev => ({ ...prev, k1: val }))}
                suffix="Коэф."
                hint="Коэффициент, учитывающий долю расхода теплоты на отопление общественных зданий (константа 0,25)."
                disabled
              />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Климатические данные</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-1">
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
                  <span className="text-zinc-500 uppercase font-semibold">Общая площадь</span>
                  <span className="font-mono text-zinc-300">{inputs.area} м²</span>
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
                <p className="mb-2 font-bold text-zinc-900">Qо мах = qo · А · (1 + k1) · 10⁻⁶</p>
                <div className="space-y-1 opacity-80">
                  <p>= {inputs.q0} × {inputs.area} × (1 + {inputs.k1}) × 10⁻⁶</p>
                  <p>= {result.totalWatts} × 10⁻⁶</p>
                  <p className="font-bold text-zinc-900">= {result.totalMW} МВт</p>
                  <p className="mt-1 text-[9px] text-zinc-400">Перевод в Гкал/час: {result.totalMW} × 0.859845 = {result.totalGcal} Гкал/час</p>
                  <div className="mt-2 border-t border-zinc-200 pt-2 text-[9px]">
                    <p className="font-bold">Расчет qo из справочника:</p>
                    <p>qo = (Норма × (tᵢ - t₀)) / 86.4</p>
                    <p className="text-[8px] text-zinc-400">tᵢ принята равной {inputs.ti}°C</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-800">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>Расчет выполнен на основании общей площади здания. k1 принят равным 0,25 согласно методике.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Q0 Modal */}
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
              className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Справочник норм теплопотребления</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Единицы: кДж/м²·°С·сут</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsQ0ModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-8">
                  {Q0_NO_VOLUME_DATA.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-4">
                      <h3 className="sticky top-0 z-10 bg-zinc-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 rounded-md shadow-sm">
                        {section.period}
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-zinc-100">
                        <table className="w-full border-collapse text-left text-[11px]">
                          <thead>
                            <tr className="bg-zinc-50 text-zinc-400">
                              <th className="border-b border-zinc-100 px-3 py-2 font-bold uppercase">Этажи</th>
                              {Object.keys(section.norms[0].temps).map(t => (
                                <th key={t} className="border-b border-zinc-100 px-2 py-2 text-center font-bold">{t}°C</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {section.norms.map((norm, nIdx) => (
                              <tr key={nIdx} className="hover:bg-zinc-50 transition-colors">
                                <td className="bg-zinc-50/50 px-3 py-2 font-bold text-zinc-900 border-r border-zinc-100">{norm.floors}</td>
                                {Object.entries(norm.temps).map(([t, val]) => (
                                  <td 
                                    key={t} 
                                    onClick={() => handleSelectNorm(val)}
                                    className={`cursor-pointer px-2 py-2 text-center transition-all hover:bg-zinc-900 hover:text-white font-mono ${Number(t) === inputs.to ? 'bg-zinc-900 text-white font-bold ring-2 ring-zinc-900 ring-inset' : 'text-zinc-600'}`}
                                  >
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-zinc-100 bg-zinc-50 px-6 py-4 text-[10px] text-zinc-500 italic">
                * Выберите значение в таблице. Оно будет автоматически пересчитано в Вт/м² с учетом текущих температур tᵢ и t₀.
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

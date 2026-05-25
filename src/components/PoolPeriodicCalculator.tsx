import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  ArrowLeft,
  Info,
  Waves,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolPeriodicInputs } from '../types';
import { DEFAULT_POOL_PERIODIC_INPUTS } from '../constants';
import { InputField } from './InputField';

interface PoolPeriodicCalculatorProps {
  inputs: PoolPeriodicInputs;
  setInputs: React.Dispatch<React.SetStateAction<PoolPeriodicInputs>>;
  onBack: () => void;
}

export const PoolPeriodicCalculator: React.FC<PoolPeriodicCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [copied, setCopied] = useState(false);
  // Tabs for switching display view between maximum and average hourly values
  const [activeTab, setActiveTab] = useState<'max' | 'average'>('max');

  // State to manage toggleable math steps
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  // Constants per norm
  const T_COLD_CONST = 5; // °C (t_хв)

  // Mapping purpose values to temperatures and readable labels
  const purposeMap = {
    preschool: { label: 'Для детей дошкольного возраста', temp: 32 },
    training: { label: 'Для учебных бассейнов', temp: 30 },
    contrast: { label: 'Для контрастных бассейнов (в банях и саунах)', temp: 18 },
    thermal: { label: 'Для термобассейнов с гидромассажем (в банях/саунах)', temp: 37 },
  };

  const activePurpose = purposeMap[inputs.purpose] || purposeMap.training;
  const targetTemp = activePurpose.temp;

  // Main calculations for both modes
  const calculations = useMemo(() => {
    const { vbas, tFilling, nSessions } = inputs;

    // 1. QТбмах = Vбас / T · (tв – tхв) · 10^-3, Гкал/ч
    const divisorT = tFilling || 1;
    const qTbMax = (vbas / divisorT) * (targetTemp - T_COLD_CONST) * 1e-3;

    // conversion for Max Load: Gcal/h -> kW -> MW
    const maxKW = qTbMax * 1.163 * 1000;
    const maxMW = qTbMax * 1.163;

    // 2. QТбср = (Vбас · N) / 24 · (tв – tхв) · 10^-3, Гкал/ч
    const qTbAverage = ((vbas * nSessions) / 24) * (targetTemp - T_COLD_CONST) * 1e-3;

    // conversion for Average Load: Gcal/h -> kW -> MW
    const averageKW = qTbAverage * 1.163 * 1000;
    const averageMW = qTbAverage * 1.163;

    return {
      qTbMax,
      maxKW,
      maxMW,
      qTbAverage,
      averageKW,
      averageMW,
      temperatureDiff: targetTemp - T_COLD_CONST,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs.vbas, inputs.tFilling, inputs.nSessions, targetTemp]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_POOL_PERIODIC_INPUTS);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setOpenSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

  const generateReportText = () => {
    return `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ТЕХНОЛОГИЮ БАССЕЙНА С ПЕРИОДИЧЕСКОЙ СМЕНОЙ ВОДЫ
=================================================================================
Дата расчета: ${calculations.timestamp}

1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Назначение бассейна: ${activePurpose.label}
• Конечная температура воды (tв): ${targetTemp} °C
• Объём воды в бассейне (Vбас): ${inputs.vbas} м³
• Время наполнения бассейна перед сеансом (T): ${inputs.tFilling} ч
• Количество сеансов (периодических замен) в сутки (N): ${inputs.nSessions} раз
• Начальная температура холодной воды (tхв): ${T_COLD_CONST} °C (константа)

2. МАКСИМАЛЬНАЯ ТЕПЛОВАЯ НАГРУЗКА (QТбмах):
-------------------------------------------
• Формула: QТбмах = Vбас / T · (tв – tхв) · 10⁻³
• Выражение: ${inputs.vbas} / ${inputs.tFilling} · (${targetTemp} – ${T_COLD_CONST}) · 0.001
• Результат QТбмах: ${calculations.qTbMax.toFixed(6)} Гкал/ч
• Эквивалентная мощность: ${calculations.maxKW.toFixed(2)} кВт (${calculations.maxMW.toFixed(4)} МВт)

3. СРЕДНЕЧАСОВАЯ ТЕПЛОВАЯ НАГРУЗКА (QТбср):
-------------------------------------------
• Формула: QТбср = (Vбас · N) / 24 · (tв – tхв) · 10⁻³
• Выражение: (${inputs.vbas} · ${inputs.nSessions}) / 24 · (${targetTemp} – ${T_COLD_CONST}) · 0.001
• Результат QТбср: ${calculations.qTbAverage.toFixed(6)} Гкал/ч
• Эквивалентная мощность: ${calculations.averageKW.toFixed(2)} кВт (${calculations.averageMW.toFixed(4)} МВт)

=================================================================================
    `.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([generateReportText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pool_periodic_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition-colors text-sm font-semibold self-start"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Вернуться в меню
        </button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RefreshCw size={13} />
            <span>Сброс</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-100 font-semibold text-xs active:scale-98 transition-all"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-600" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Буфер обмена</span>
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-100 font-semibold text-xs active:scale-98 transition-all"
          >
            <Download size={13} />
            <span>Скачать отчет</span>
          </button>
        </div>
      </div>

      {/* Title Banner */}
      <div className="max-w-4xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/50">
          Периодическая смена воды
        </span>
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl pt-1">
          Расчет тепловой нагрузки на периодическую смену воды бассейна
        </h1>
        <p className="text-sm text-zinc-500 max-w-3xl leading-relaxed">
          Определение максимальной (на время зацикленного наполнения) и усредненной среднечасовой тепловой составляющей системы водоподогрева для чаш с периодической сменой воды.
        </p>
        <div className="h-1 w-20 rounded-full bg-indigo-600" />
      </div>

      {/* Visual Tab Switcher / Slide Control */}
      <div className="border-b border-zinc-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('max')}
            className={`pb-4 px-1 text-sm font-bold tracking-tight relative transition-all ${
              activeTab === 'max' ? 'text-indigo-600 font-bold' : 'text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Flame size={16} />
              Максимальная нагрузка (Q<sub>Тбмах</sub>)
            </span>
            {activeTab === 'max' && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('average')}
            className={`pb-4 px-1 text-sm font-bold tracking-tight relative transition-all ${
              activeTab === 'average' ? 'text-indigo-600 font-bold' : 'text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              Среднечасовая нагрузка (Q<sub>Тбср</sub>)
            </span>
            {activeTab === 'average' && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
              />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Hand: INPUTS */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                Исходные данные ({activeTab === 'max' ? 'QТбмах' : 'QТбср'})
              </h2>
            </div>

            {/* Vbas Input (Shared) */}
            <InputField 
              label={<span>V<sub>бас</sub> — Объем воды в бассейне</span>} 
              id="vbas" 
              value={inputs.vbas} 
              onChange={(val) => setInputs(prev => ({ ...prev, vbas: Math.max(0.1, val) }))}
              suffix="м³"
              step="5"
              hint="Полная емкость заполняемой чаши бассейна."
            />

            {/* Conditional input based on active Tab */}
            <AnimatePresence mode="wait">
              {activeTab === 'max' ? (
                <motion.div
                  key="max-inputs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <InputField 
                    label="T — Время наполнения бассейна" 
                    id="tFilling" 
                    value={inputs.tFilling} 
                    onChange={(val) => setInputs(prev => ({ ...prev, tFilling: Math.max(0.1, val) }))}
                    suffix="ч"
                    step="0.5"
                    hint="Время подогрева и наполнения всего объема до начала первого сеанса."
                  />
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-indigo-700 leading-normal font-medium">
                    * Сокращение времени T увеличивает пиковую часовую производительность QТбмах в котельной.
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="average-inputs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <InputField 
                    label="N — Количество сеансов в сутки" 
                    id="nSessions" 
                    value={inputs.nSessions} 
                    onChange={(val) => setInputs(prev => ({ ...prev, nSessions: Math.max(1, val) }))}
                    suffix="раз"
                    step="1"
                    hint="Количество полных сливов и повторных наливов чаши за сутки (смену)."
                  />
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[11px] text-purple-700 leading-normal font-medium">
                    * Среднечасовой расход относится к объёму, равномерно распределенному на 24 часа.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Purposing & Temperatures */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Waves size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Назначение бассейна</h2>
            </div>

            <div className="space-y-3">
              {Object.entries(purposeMap).map(([key, details]) => {
                const isSelected = inputs.purpose === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePurposeChange(key as any)}
                    className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/10' 
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="text-xs font-bold text-zinc-900 leading-tight">{details.label}</div>
                      <div className="text-[10px] text-zinc-400">
                        t<sub>в</sub> нормируемая
                      </div>
                    </div>
                    <div className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-extrabold transition-all border shrink-0 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}>
                      {details.temp}°C
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 space-y-2.5 text-xs text-zinc-650">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Начальная темп. воды (t<sub>хв</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">+5 °C</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Hand: RESULTS & FORMULA BREAKDOWNS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main calculated values dashboard */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Displaying Q_Тбмах with animation indicator */}
            <div className={`rounded-3xl p-5 text-white shadow-xl border relative overflow-hidden flex flex-col justify-between h-44 transition-all ${
              activeTab === 'max' ? 'bg-zinc-950 border-zinc-850 ring-2 ring-indigo-500/30' : 'bg-zinc-900/90 border-zinc-800 opacity-80'
            }`}>
              {activeTab === 'max' && (
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-indigo-500/15 blur-2xl z-0" />
              )}
              
              <div className="z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
                  <Flame size={12} className="text-orange-400" />
                  Максимальная Q<sub>Тбмах</sub>
                </span>
                {activeTab === 'max' && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/30">
                    Активный расчет
                  </span>
                )}
              </div>

              <div className="z-10 mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-white font-mono leading-none">
                    {calculations.qTbMax.toFixed(6)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Гкал/ч</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1 border-t border-zinc-800">
                  Мощность: <span className="font-bold text-orange-400">{calculations.maxKW.toFixed(2)} кВт</span> ({calculations.maxMW.toFixed(4)} МВт)
                </p>
              </div>
            </div>

            {/* Displaying Q_Тбср with animation indicator */}
            <div className={`rounded-3xl p-5 text-white shadow-xl border relative overflow-hidden flex flex-col justify-between h-44 transition-all ${
              activeTab === 'average' ? 'bg-zinc-950 border-zinc-850 ring-2 ring-indigo-500/30' : 'bg-zinc-900/90 border-zinc-800 opacity-80'
            }`}>
              {activeTab === 'average' && (
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-purple-500/15 blur-2xl z-0" />
              )}
              
              <div className="z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-purple-400" />
                  Среднечасовая Q<sub>Тбср</sub>
                </span>
                {activeTab === 'average' && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/30">
                    Активный расчет
                  </span>
                )}
              </div>

              <div className="z-10 mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-white font-mono leading-none">
                    {calculations.qTbAverage.toFixed(6)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400 uppercase">Гкал/ч</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1 border-t border-zinc-800">
                  Мощность: <span className="font-bold text-purple-400">{calculations.averageKW.toFixed(2)} кВт</span> ({calculations.averageMW.toFixed(4)} МВт)
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Formula Steps */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                Текущий метод расчета и этапы
              </h3>
              <span className="text-[10px] text-zinc-400">Нажмите для сворачивания</span>
            </div>

            {/* Stage 1 details */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(1)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="periodic-step-1"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Этап 1. Разность температур подогрева</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Амплитуда температур (t<sub>в</sub> – t<sub>хв</sub>)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs text-right">
                    {calculations.temperatureDiff} °C
                  </span>
                  {openSteps[1] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {openSteps[1] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-1.5 leading-relaxed">
                      <p>Параметры определяются нормативным типом использования:</p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-zinc-500 text-[11px]">
                        <li>Конечная заданная температура (t<sub>в</sub>): <span className="font-semibold text-zinc-800">{targetTemp}°C</span></li>
                        <li>Начальная температура водозабора (t<sub>хв</sub>): <span className="font-semibold text-zinc-805">+5°C</span> (const)</li>
                      </ul>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] mt-1.5">
                        Амплитуда нагрева = {targetTemp} – {T_COLD_CONST} = <span className="font-bold text-zinc-900">{calculations.temperatureDiff}°C</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Stage 2 details (Dynamic based on active tab) */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(2)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="periodic-step-2"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">
                    {activeTab === 'max' ? 'Этап 2. Максимальный поток' : 'Этап 2. Среднечасовой поток'}
                  </span>
                  <p className="font-bold text-xs text-zinc-900">
                    {activeTab === 'max' 
                      ? 'Определение пиковой мощности при заливе (QТбмах)' 
                      : 'Определение среднесуточной часовой нагрузки (QТбср)'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-600 text-xs">
                    {activeTab === 'max' ? calculations.qTbMax.toFixed(6) : calculations.qTbAverage.toFixed(6)} Гкал/ч
                  </span>
                  {openSteps[2] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence mode="wait">
                {openSteps[2] && (
                  <motion.div 
                    key={activeTab}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2.5">
                      {activeTab === 'max' ? (
                        <>
                          <p>Тепловая пиковая нагрузка определяется временем однократного подогрева чаши:</p>
                          <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] space-y-1 leading-relaxed">
                            <div className="text-center font-bold text-indigo-600 py-1">
                              Q<sub>Тбмах</sub> = V<sub>бас</sub> / T · (t<sub>в</sub> – t<sub>хв</sub>) · 10⁻³
                            </div>
                            <div className="text-zinc-500 pt-1 border-t border-zinc-200/50">
                              - V<sub>бас</sub> = {inputs.vbas} м³ (Объем бассейна) <br/>
                              - T = {inputs.tFilling} ч (Время залива) <br/>
                              - Δt = {calculations.temperatureDiff}°C
                            </div>
                            <div className="pt-2 border-t border-zinc-200/50 text-zinc-900 font-semibold">
                              Расчет: <br/>
                              Q<sub>Тбмах</sub> = {inputs.vbas} / {inputs.tFilling} · {calculations.temperatureDiff} · 0.001 <br/>
                              Q<sub>Тбмах</sub> = <span className="text-indigo-600 font-bold">{calculations.qTbMax.toFixed(6)}</span> Гкал/ч
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>Среднечасовая составляющая распределяет общие суточные объемы на 24 часа:</p>
                          <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] space-y-1 leading-relaxed">
                            <div className="text-center font-bold text-indigo-600 py-1">
                              Q<sub>Тбср</sub> = (V<sub>бас</sub> · N) / 24 · (t<sub>в</sub> – t<sub>хв</sub>) · 10⁻³
                            </div>
                            <div className="text-zinc-500 pt-1 border-t border-zinc-200/50">
                              - V<sub>бас</sub> = {inputs.vbas} м³ (Объем бассейна) <br/>
                              - N = {inputs.nSessions} раз/сутки (Количество наполнений) <br/>
                              - Δt = {calculations.temperatureDiff}°C
                            </div>
                            <div className="pt-2 border-t border-zinc-200/50 text-zinc-900 font-semibold">
                              Расчет: <br/>
                              Q<sub>Тбср</sub> = ({inputs.vbas} · {inputs.nSessions}) / 24 · {calculations.temperatureDiff} · 0.001 <br/>
                              Q<sub>Тбср</sub> = <span className="text-indigo-600 font-bold">{calculations.qTbAverage.toFixed(6)}</span> Гкал/ч
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Quick FAQ summary info */}
          <section className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50 text-xs text-zinc-500 flex items-start gap-2.5">
            <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-zinc-700">Практические указания</span>
              <p className="leading-relaxed">
                Бассейны с периодической сменой воды сливаются и наливаются вновь через регламентированные интервалы времени. Максимальная нагрузка необходима для правильного подбора котельного оборудования (пластины теплообменников), тогда как среднечасовая нагрузка используется для расчета суточного потребления тепла и оценки коммерческого учета.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

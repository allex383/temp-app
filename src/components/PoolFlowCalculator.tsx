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
  Droplets,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PoolFlowInputs } from '../types';
import { DEFAULT_POOL_FLOW_INPUTS } from '../constants';
import { InputField } from './InputField';

interface PoolFlowCalculatorProps {
  inputs: PoolFlowInputs;
  setInputs: React.Dispatch<React.SetStateAction<PoolFlowInputs>>;
  onBack: () => void;
}

export const PoolFlowCalculator: React.FC<PoolFlowCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  // State to manage toggleable math steps
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  // Constants per norm
  const TXV_CONST = 5; // °C
  const T_GVS_CONST = 65; // °C

  // Mapping purpose values to temperatures, default exchange times, and readable labels
  const purposeMap = {
    preschool: { label: 'Для детей дошкольного возраста', temp: 32, tc: 8 },
    training: { label: 'Для учебных бассейнов', temp: 30, tc: 12 },
    wellness: { label: 'Для оздоровительных бассейнов', temp: 29, tc: 12 },
  };

  const activePurpose = purposeMap[inputs.purpose];
  const targetTemp = activePurpose.temp;
  
  // Calculate active exchange time (Tc)
  const activeTc = useMemo(() => {
    if (inputs.tcMode === 'auto') {
      return activePurpose.tc;
    }
    return inputs.tcCustom;
  }, [inputs.tcMode, inputs.tcCustom, activePurpose.tc]);

  // Main calculation
  const calculations = useMemo(() => {
    const { vbas } = inputs;

    // QТб = Vбас / Тс · (tв – tхв) · 10^-3,  Гкал/ч
    const divisor = activeTc || 1;
    const qTb = (vbas / divisor) * (targetTemp - TXV_CONST) * 1e-3;

    // Vгвс = QТб * 1000 / (tгвс - tхв) м³/ч
    const tempDiffGvs = T_GVS_CONST - TXV_CONST; // 60
    const vGvs = (qTb * 1000) / tempDiffGvs;

    // Energy conversion for reference (1 Gcal/h = 1.163 MW = 1163 kW)
    const totalWatts = qTb * 1.163 * 1e6;
    const totalKW = totalWatts / 1000;
    const totalMW = qTb * 1.163;

    return {
      qTb,
      vGvs,
      totalWatts,
      totalKW,
      totalMW,
      divisor,
      tempDiffGvs,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs.vbas, activeTc, targetTemp]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_POOL_FLOW_INPUTS);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setOpenSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

  const handlePurposeChange = (purpose: keyof typeof purposeMap) => {
    setInputs(prev => ({ ...prev, purpose }));
  };

  const handleExport = () => {
    const content = `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ТЕХНОЛОГИЮ БАССЕЙНА ПРОТОЧНОГО ТИПА
=================================================================================
Дата расчета: ${calculations.timestamp}

1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Назначение бассейна: ${activePurpose.label}
• Конечная температура воды (tв): ${targetTemp} °C
• Объём воды в ванне бассейна (Vбас): ${inputs.vbas} м³
• Режим определения времени водообмена (Tc): ${inputs.tcMode === 'auto' ? 'Автоматический (по СНиП)' : 'Ручной ввод'}
• Время полной смены воды (Tc): ${activeTc} ч
• Начальная температура воды (tхв): ${TXV_CONST} °C (константа)
• Температура горячей воды (tгвс): ${T_GVS_CONST} °C (константа)

2. ПОШАГОВЫЙ РАСЧЕТ И ФОРМУЛЫ:
-------------------------------
Шаг 1: Определение нормируемого времени водообмена (Tc)
  - Tc = ${activeTc} ч

Шаг 2: Расчет тепловой нагрузки на технологию проточного типа (QТб)
  - Формула: QТб = Vбас / Tc · (tв – tхв) · 10^-3
  - Расчет: ${inputs.vbas} / ${activeTc} · (${targetTemp} – ${TXV_CONST}) · 0.001
  - Результат QТб: ${calculations.qTb.toFixed(6)} Гкал/ч
                 (${calculations.totalKW.toFixed(2)} кВт / ${calculations.totalMW.toFixed(4)} МВт)

Шаг 3: Расчет часового расхода горячей воды на технологические нужды (Vгвс)
  - Формула: Vгвс = QТб · 1000 / (tгвс – tхв)
  - Расчет: ${calculations.qTb.toFixed(6)} · 1000 / (${T_GVS_CONST} – ${TXV_CONST})
  - Результат Vгвс: ${calculations.vGvs.toFixed(4)} м³/ч

3. СВОДНЫЕ РЕЗУЛЬТАТЫ:
----------------------
• Тепловая нагрузка (QТб): ${calculations.qTb.toFixed(6)} Гкал/ч
• Часовой расход ГВС (Vгвс): ${calculations.vGvs.toFixed(4)} м³/ч
• Эквивалентная мощность: ${calculations.totalKW.toFixed(2)} кВт (${calculations.totalMW.toFixed(4)} МВт)
=================================================================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pool_flow_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Navigation Top Bar */}
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
            <span className="hidden sm:inline">Сбросить всё</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-95"
          >
            <Download size={14} />
            <span>Сохранить расчет</span>
          </button>
        </div>
      </div>

      {/* Title Banner */}
      <div className="max-w-4xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#6366f1] bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/50">Технология бассейна</span>
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl pt-1">
          Бассейн проточного типа
        </h1>
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Тепловая нагрузка на поддержание температуры воды в чаше бассейна проточной системы и связанный часовой расход горячей воды.
        </p>
        <div className="h-1 w-20 rounded-full bg-[#6366f1]" />
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Hand: INPUTS */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Sliders size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">Параметры протока</h2>
            </div>

            {/* Vbas Input */}
            <InputField 
              label={<span>V<sub>бас</sub> — Объем воды в ванне</span>} 
              id="vbas" 
              value={inputs.vbas} 
              onChange={(val) => setInputs(prev => ({ ...prev, vbas: Math.max(0.1, val) }))}
              suffix="м³"
              step="5"
              hint="Общий объем водной массы бассейна, определяемый его геометрическими параметрами."
            />

            {/* Tc Option Toggle */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-700">Т<sub>с</sub> — Время полной смены воды</span>
                <span className="text-[10px] bg-indigo-50 text-[#6366f1] font-bold px-1.5 py-0.5 rounded border border-indigo-150 font-mono">
                  {activeTc} ч
                </span>
              </div>

              {/* Mode Segments */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, tcMode: 'auto' }))}
                  className={`py-1.5 rounded-md transition-all ${
                    inputs.tcMode === 'auto' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  По СНиП (Авто)
                </button>
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, tcMode: 'manual' }))}
                  className={`py-1.5 rounded-md transition-all ${
                    inputs.tcMode === 'manual' 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Ввести вручную
                </button>
              </div>

              {/* Conditional manual input */}
              {inputs.tcMode === 'manual' ? (
                <div className="animate-fade-in space-y-1">
                  <InputField 
                    label="Ручное значение времени водообмена (Tc)" 
                    id="tcCustom" 
                    value={inputs.tcCustom} 
                    onChange={(val) => setInputs(prev => ({ ...prev, tcCustom: Math.max(0.1, val) }))}
                    suffix="ч"
                    step="1"
                    hint="Укажите действительное время полного оборота воды в чаше бассейна."
                  />
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 italic leading-tight">
                  * По нормативам СНиП принимается равным: для детских бассейнов <span className="font-bold">8 ч</span>, для прочих <span className="font-bold">12 ч</span>.
                </p>
              )}
            </div>
          </section>

          {/* Purpose & Target Temp Section */}
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
                      <div className="text-[10px] text-zinc-400 font-medium font-mono">
                        Норма водообмена Тс: {details.tc} ч
                      </div>
                    </div>
                    <div className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-extrabold transition-all border ${
                      isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                    }`}>
                      {details.temp}°C
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show constant parameters of technology */}
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-150 space-y-2.5 text-xs text-zinc-650">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
                <span className="font-semibold text-zinc-500">Начальная темп. (t<sub>хв</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">+5 °C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Установл. темп. ГВС (t<sub>гвс</sub>):</span>
                <span className="font-mono font-bold text-zinc-800">+65 °C</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Hand: RESULTS & STEPS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main calculated values dashboard */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Card 1: Heat load QТб */}
            <div className="rounded-3xl bg-zinc-950 p-5 text-white shadow-xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-44">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-indigo-500/10 blur-2xl z-0" />
              
              <div className="z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
                  <Flame size={12} className="text-indigo-400" />
                  Нагрузка Q<sub>Тб</sub>
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20">
                  Базовая нагрузка
                </span>
              </div>

              <div className="z-10 mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-white font-mono leading-none">
                    {calculations.qTb.toFixed(6)}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase">Гкал/ч</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1 border-t border-zinc-850">
                  Мощность: <span className="font-bold text-zinc-200">{calculations.totalKW.toFixed(2)} кВт</span> / <span className="font-bold text-zinc-200">{calculations.totalMW.toFixed(4)} МВт</span>
                </p>
              </div>
            </div>

            {/* Card 2: Hot water rate Vгвс */}
            <div className="rounded-3xl bg-zinc-950 p-5 text-white shadow-xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between h-44">
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-cyan-500/10 blur-2xl z-0" />
              
              <div className="z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 flex items-center gap-1.5">
                  <Droplets size={12} className="text-cyan-400" />
                  Расход V<sub>гвс</sub>
                </span>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                  Часовой расход
                </span>
              </div>

              <div className="z-10 mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-white font-mono leading-none">
                    {calculations.vGvs.toFixed(4)}
                  </span>
                  <span className="text-xs font-bold text-zinc-500 uppercase">м³/ч</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1.5 pt-1 border-t border-zinc-850">
                  Потребление подпитки при разности температур в 60°C.
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Steps with toggle animation */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                Инженерная методика и формулы
              </h3>
              <span className="text-[10px] text-zinc-400">Нажмите для сворачивания</span>
            </div>

            {/* Step 1: Exchange Time */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(1)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="flow-step-1"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">Шаг 1. Время водообмена (T_с)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Нормируемый или заданный темп смены объема воды
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {activeTc} ч
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
                    <div className="p-4 text-xs text-zinc-650 space-y-2">
                      <p>Значение Т<sub>с</sub> определяется назначением бассейна или технологическим решением:</p>
                      <ul className="list-disc list-inside space-y-1.5 pl-1.5 text-zinc-500 text-[11px]">
                        <li>Для детских бассейнов: <span className="font-bold text-zinc-700">8 часов</span></li>
                        <li>Для всех остальных бассейнов: <span className="font-bold text-zinc-700">12 часов</span></li>
                      </ul>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] mt-1.5">
                        Применимое время водообмена Т<sub>с</sub> = <span className="font-bold text-zinc-900">{activeTc} ч</span> ({inputs.tcMode === 'auto' ? 'Рассчитано автоматически' : 'Ручной ввод'})
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Heat Load */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(2)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="flow-step-2"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-widest">Шаг 2. Расчет тепловой нагрузки (Q_Тб)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Нагрев поступающего потока воды в бассейн проточного типа
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {calculations.qTb.toFixed(6)} Гкал/ч
                  </span>
                  {openSteps[2] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {openSteps[2] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2.5">
                      <p>Расчет производится по установленной методической формуле:</p>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed space-y-1">
                        <div className="font-bold text-zinc-800 text-center py-1">
                          Q<sub>Тб</sub> = V<sub>бас</sub> / Т<sub>с</sub> · (t<sub>в</sub> – t<sub>хв</sub>) · 10⁻³,  Гкал/ч
                        </div>
                        <div className="text-zinc-500 pt-1 border-t border-zinc-200/50">
                          Где: <br/>
                          - V<sub>бас</sub> = {inputs.vbas} м³ (Объем чаши)<br/>
                          - Т<sub>с</sub> = {activeTc} ч (Время водообмена)<br/>
                          - t<sub>в</sub> = {targetTemp}°C (Температура бассейна)<br/>
                          - t<sub>хв</sub> = {TXV_CONST}°C (Холодная подпиточная вода)
                        </div>
                        <div className="pt-2 border-t border-zinc-200/50 text-indigo-600 font-bold">
                          Расчет: <br/>
                          Q<sub>Тб</sub> = {inputs.vbas} / {activeTc} · ({targetTemp} – {TXV_CONST}) · 10⁻³<br/>
                          Q<sub>Тб</sub> = {calculations.qTb.toFixed(6)} Гкал/ч
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3: GVS Hourly Consumption */}
            <div className="border border-zinc-150 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(3)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
                id="flow-step-3"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest">Шаг 3. Расход горячей воды (V_гвс)</span>
                  <p className="font-bold text-xs text-zinc-900">
                    Необходимая подпитка теплосети для компенсации технологии
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-800 text-xs">
                    {calculations.vGvs.toFixed(4)} м³/ч
                  </span>
                  {openSteps[3] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence>
                {openSteps[3] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-650 space-y-2.5">
                      <p>Расчет часового расхода горячей воды на технологические нужды:</p>
                      <div className="bg-zinc-50 p-3 rounded-lg font-mono text-[11px] leading-relaxed space-y-1">
                        <div className="font-bold text-zinc-800 text-center py-1 border-b border-zinc-200/50">
                          V<sub>гвс</sub> = Q<sub>Тб</sub> · 1000 / (t<sub>гвс</sub> – t<sub>хв</sub>),  м³/ч
                        </div>
                        <div className="text-zinc-500 pt-1">
                          Где: <br/>
                          - Q<sub>Тб</sub> = {calculations.qTb.toFixed(6)} Гкал/ч (Тепловая нагрузка) <br/>
                          - t<sub>гвс</sub> = {T_GVS_CONST}°C (Регламентная температура ГВС) <br/>
                          - t<sub>хв</sub> = {TXV_CONST}°C (Начальная холодная) <br/>
                          - Разница температур: {T_GVS_CONST} – {TXV_CONST} = {calculations.tempDiffGvs}°C
                        </div>
                        <div className="pt-2 border-t border-zinc-200/50 text-cyan-600 font-bold">
                          Расчет: <br/>
                          V<sub>гвс</sub> = {calculations.qTb.toFixed(6)} · 1000 / {calculations.tempDiffGvs} <br/>
                          V<sub>гвс</sub> = {calculations.vGvs.toFixed(4)} м³/ч
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* FAQ Informational Banner */}
          <section className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50 text-xs text-zinc-500 flex items-start gap-2.5">
            <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-zinc-700">Официальная справка</span>
              <p className="leading-relaxed">
                В проточном бассейне температурная стабильность поддерживается постоянным вводом свежей подогретой воды. Формула часового расхода ГВС связывает максимальную тепловую технологическую потребность с стандартными параметрами циркуляции горячей сантехнической засыпки.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Thermometer, 
  Layers,
  AlertCircle,
  ArrowLeft,
  Wind,
  Maximize2,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Cpu,
  Copy,
  Check,
  User,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VentilationEquipmentInputs } from '../types';
import { DEFAULT_VENTILATION_EQUIPMENT_INPUTS } from '../constants';
import { DENSITY_DATA } from '../densityData';
import { TO_DATA, TI_DATA } from '../q0Data';
import { InputField } from './InputField';

interface VentilationEquipmentCalculatorProps {
  inputs: VentilationEquipmentInputs;
  setInputs: React.Dispatch<React.SetStateAction<VentilationEquipmentInputs>>;
  onBack: () => void;
}

// Helper to interpolate density from temperature
const getAirDensity = (t: number) => {
  const temps = Object.keys(DENSITY_DATA).map(Number).sort((a, b) => a - b);
  const minT = temps[0];
  const maxT = temps[temps.length - 1];

  if (t <= minT) return DENSITY_DATA[minT];
  if (t >= maxT) return DENSITY_DATA[maxT];

  const tLower = Math.floor(t);
  const tUpper = Math.ceil(t);

  if (tLower === tUpper) return DENSITY_DATA[tLower] ?? 1.2;

  const dLower = DENSITY_DATA[tLower];
  const dUpper = DENSITY_DATA[tUpper];

  if (dLower === undefined || dUpper === undefined) {
    return 353 / (273.15 + t);
  }

  return dLower + (dUpper - dLower) * (t - tLower);
};

export const VentilationEquipmentCalculator: React.FC<VentilationEquipmentCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // State to manage multiple open steps simultaneously
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  // Metadata states for report
  const [compilerName, setCompilerName] = useState(() => {
    return localStorage.getItem('heatload_metadata_compiler_name') || '';
  });
  const [compilerPosition, setCompilerPosition] = useState(() => {
    return localStorage.getItem('heatload_metadata_compiler_position') || '';
  });
  const [objectAddress, setObjectAddress] = useState(() => {
    return localStorage.getItem('heatload_metadata_object_address') || '';
  });
  const [isSimpleConsumer, setIsSimpleConsumer] = useState(() => {
    return localStorage.getItem('heatload_metadata_is_simple_consumer') === 'true';
  });

  const handleCompilerNameChange = (val: string) => {
    setCompilerName(val);
    localStorage.setItem('heatload_metadata_compiler_name', val);
  };

  const handleCompilerPositionChange = (val: string) => {
    setCompilerPosition(val);
    localStorage.setItem('heatload_metadata_compiler_position', val);
  };

  const handleObjectAddressChange = (val: string) => {
    setObjectAddress(val);
    localStorage.setItem('heatload_metadata_object_address', val);
  };

  const handleIsSimpleConsumerChange = (val: boolean) => {
    setIsSimpleConsumer(val);
    localStorage.setItem('heatload_metadata_is_simple_consumer', String(val));
  };

  const calculation = useMemo(() => {
    const { L, ti, to } = inputs;
    const c = 0.24;
    
    // Density at outdoor temperature
    const rho = getAirDensity(to);
    
    // Qv max = c * rho * L * (ti - to) * 10^-6
    const totalGcal = c * rho * L * (ti - to) * 1e-6;
    const totalMW = totalGcal / 0.859845;

    return {
      rho,
      tempDiff: ti - to,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalMW: Math.round(totalMW * 1000) / 1000,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_VENTILATION_EQUIPMENT_INPUTS);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setOpenSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

  const generateReportText = () => {
    const { L, ti, to } = inputs;
    const c = 0.24;
    const userRoleText = isSimpleConsumer 
      ? 'Потребитель' 
      : `Сотрудник: ${compilerName || 'Не указан'}\nДолжность: ${compilerPosition || 'Не указана'}`;
    const addressText = objectAddress || 'Не указан';

    return `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ ПО ПРОИЗВОДИТЕЛЬНОСТИ ОБОРУДОВАНИЯ
===========================================================
Дата: ${calculation.timestamp}
Адрес объекта: ${addressText}
Исполнитель: ${userRoleText}

===========================================================
1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
• Производительность по воздуху (L): ${L} м³/ч
• Температура выдаваемого нагретого воздуха (ti): ${ti} °C
• Расчетная наружная температура (to): ${to} °C
• Удельная теплоемкость воздуха (c): ${c} ккал/(кг·°C)

2. ПОШАГОВЫЙ РАСЧЕТ И ФОРМУЛЫ:
-------------------------------
Шаг 1: Определение плотности наружного воздуха (ρ)
  - Плотность при температуре to = ${to}°C: ${calculation.rho.toFixed(4)} кг/м³ (из справочной таблицы СНиП)

Шаг 2: Вычисление температурного напора (Δt)
  - Формула: Δt = ti - to
  - Расчет: Δt = ${ti} - (${to}) = ${calculation.tempDiff.toFixed(1)} °C

Шаг 3: Основной расчет тепловой нагрузки (Qv мах)
  - Формула: Qv мах = c · ρ · L · (ti – to) · 10⁻⁶
  - Расчет: Qv мах = ${c} · ${calculation.rho.toFixed(4)} · ${L} · ${calculation.tempDiff.toFixed(1)} · 10⁻⁶ = ${calculation.totalGcal} Гкал/ч

3. РЕЗУЛЬТАТ:
-------------
Общая тепловая нагрузка на вентиляцию: ${calculation.totalGcal} Гкал/ч (${calculation.totalMW} МВт)
===========================================================
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
    link.download = `ventilation_equipment_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isWinterWarning = inputs.to >= inputs.ti;

  return (
    <div className="space-y-8">
      {/* Upper Navigation Row */}
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

      {/* Header and Title */}
      <div className="max-w-4xl space-y-2">
        <h1 className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl">
          Расчет по производительности вентиляционного оборудования L (паспортный метод)
        </h1>
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Тепловой расчет на вентиляцию при наличии известной производительности оборудования по воздуху (указывается на шильдиках, идентификационных табличках или в паспорте).
        </p>
        <div className="h-1 w-20 rounded-full bg-blue-500" />
      </div>

      {isWinterWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 animate-pulse">
          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Внимание! Наружная температура выше или равна приточной.</span>
            <p className="mt-1 opacity-90">В зимний период расчетная температура воздуха на улице (t<sub>o</sub>) должна быть ниже, чем температура нагретого выдаваемого воздуха (t<sub>i</sub>) для расчета нагрузки на воздухонагреватель.</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Input Fields */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          {/* Metadata Section */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <User size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Информация о расчете</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <input 
                  type="checkbox" 
                  id="isSimpleConsumer"
                  checked={isSimpleConsumer}
                  onChange={(e) => handleIsSimpleConsumerChange(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-350 text-zinc-900 focus:ring-zinc-900 focus:ring-offset-0 cursor-pointer accent-zinc-900"
                />
                <label htmlFor="isSimpleConsumer" className="flex-1 text-xs font-semibold text-zinc-700 select-none cursor-pointer">
                  Потребитель
                </label>
              </div>

              <AnimatePresence initial={false}>
                {!isSimpleConsumer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="compilerName" className="text-xs font-semibold tracking-wider text-zinc-500">
                        ФИО сотрудника
                      </label>
                      <input
                        id="compilerName"
                        type="text"
                        value={compilerName}
                        onChange={(e) => handleCompilerNameChange(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="compilerPosition" className="text-xs font-semibold tracking-wider text-zinc-500">
                        Должность
                      </label>
                      <input
                        id="compilerPosition"
                        type="text"
                        value={compilerPosition}
                        onChange={(e) => handleCompilerPositionChange(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label htmlFor="objectAddress" className="text-xs font-semibold tracking-wider text-zinc-500">
                  Адрес объекта
                </label>
                <div className="relative">
                  <input
                    id="objectAddress"
                    type="text"
                    value={objectAddress}
                    onChange={(e) => handleObjectAddressChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 pl-9 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Cpu size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Параметры оборудования</h2>
            </div>

            <InputField 
              label={<span>L — Производительность по воздуху</span>} 
              id="L" 
              value={inputs.L} 
              onChange={(val) => setInputs(prev => ({ ...prev, L: val }))}
              suffix="м³/ч"
              hint="Расход воздуха, проходящего через вентиляционную установку. Берется с информационной таблички оборудования."
            />

            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-600">Теплоемкость воздуха (c):</span>
                <span className="font-mono font-bold text-zinc-900">0.24 ккал/(кг·°C)</span>
              </div>
              <p className="text-[10px] text-zinc-400">Удельная теплоемкость сухого воздуха зафиксирована согласно методике СНиП.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 flex items-center gap-2">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Температурный режим</h2>
            </div>
            
            <InputField 
              label={<span>t<sub>i</sub> — Выдаваемый нагретый воздух</span>} 
              id="ti" 
              value={inputs.ti} 
              onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
              suffix="°C"
              hint="Расчетная регламентируемая температура выдаваемого нагретого воздуха на выходе из вентиляционной установки."
              action={
                <button 
                  onClick={() => setIsTiModalOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  title="Выбрать t_вн для справочника"
                >
                  <BookOpen size={14} />
                </button>
              }
            />

            <InputField 
              label={<span>t<sub>o</sub> — Наружный воздух</span>} 
              id="to" 
              value={inputs.to} 
              onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
              suffix="°C"
              hint="Расчетная наружная температура проектирования отопления (СНиП)."
              action={
                <button 
                  onClick={() => setIsToModalOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  title="Выбрать t0 из СНиП"
                >
                  <BookOpen size={14} />
                </button>
              }
            />
          </section>
        </div>

        {/* Right Column: Calculations & Interactive Steps */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Output Total Dashboard */}
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-blue-500/10 blur-2xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                <Wind size={14} className="text-blue-400" />
                Тепловая нагрузка вентиляции
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-450 border border-blue-500/20">
                Паспортный метод
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-light tracking-tight">{calculation.totalGcal.toFixed(4)}</span>
              <span className="text-lg font-bold text-zinc-400 uppercase">Гкал/час</span>
            </div>

            <p className="mt-1 text-xs text-zinc-400">
              Эквивалентная мощность в МВт: <span className="font-mono font-bold text-zinc-200">{calculation.totalMW.toFixed(3)} МВт</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-400">
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-wide">Плотность наружного воздуха ρ</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.rho.toFixed(4)} <span className="text-[11px] font-medium text-zinc-500">кг/м³</span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-wide">Разность температур Δt</p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.tempDiff.toFixed(1)} <span className="text-[11px] font-medium text-zinc-500">°C</span>
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Step-by-Step Explanation */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                Шаги расчета
              </h3>
              <span className="text-[11px] text-zinc-400">Нажмите для сворачивания</span>
            </div>

            {/* Step 1 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(1)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Шаг 1. Плотность наружного воздуха (ρ)</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Определение ρ при t<sub>o</sub> = {inputs.to}°C
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-900 text-sm">{calculation.rho.toFixed(4)} кг/м³</span>
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
                    <div className="p-4 text-xs text-zinc-600 space-y-2">
                      <p>Плотность воздуха берется по справочной таблице по температуре наружного воздуха t<sub>o</sub>:</p>
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        При температуре <span className="font-bold text-zinc-900">{inputs.to}°C</span> интерполированная плотность наружного воздуха составляет: <br />
                        <span className="font-bold text-zinc-900">ρ = {calculation.rho.toFixed(4)} кг/м³</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Плотность холодного воздуха выше плотности теплого, поэтому при морозе масса прокачиваемого через нагреватель воздуха возрастает.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(2)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Шаг 2. Разность температур (Δt)</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Δt = t<sub>i</sub> - t<sub>o</sub>
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-900 text-sm">{calculation.tempDiff.toFixed(1)} °C</span>
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
                    <div className="p-4 text-xs text-zinc-600 space-y-2">
                      <p>Разница температур, на которую приточную вентиляцию необходимо прогреть водяным или электрическим калорифером:</p>
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        Δt = {inputs.ti}°C - ({inputs.to}°C) = <span className="font-bold text-zinc-900">{calculation.tempDiff.toFixed(1)} °C</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(3)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">Шаг 3. Итоговая тепловая нагрузка (Q<sub>v max</sub>)</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Q<sub>v max</sub> = c · ρ · L · (t<sub>i</sub> – t<sub>o</sub>) · 10⁻⁶
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-950 text-sm">{calculation.totalGcal} Гкал/ч</span>
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
                    <div className="p-4 text-xs text-zinc-600 space-y-2">
                      <p>Подставляем все физические параметры в расчетную формулу:</p>
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        Q<sub>v max</sub> = 0.24 · {calculation.rho.toFixed(4)} · {inputs.L} · {calculation.tempDiff.toFixed(1)} · 10⁻⁶ <br /><br />
                        <span className="text-zinc-400">Промежуточное перемножение массы и теплоемкости:</span><br />
                        - Массовый расход воздуха = ρ · L = {calculation.rho.toFixed(4)} × {inputs.L} = {(calculation.rho * inputs.L).toFixed(1)} кг/ч <br />
                        - Тепловая энергия = c · кг/ч · Δt = 0.24 × {(calculation.rho * inputs.L).toFixed(1)} × {calculation.tempDiff.toFixed(1)} = {Math.round(0.24 * calculation.rho * inputs.L * calculation.tempDiff).toLocaleString()} ккал/ч <br /><br />
                        <span className="font-bold text-zinc-900">Итого: Q<sub>v max</sub> = {calculation.totalGcal} Гкал/ч</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Guidelines info card for simple users */}
          <section className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200/50 text-xs text-zinc-600 space-y-3">
            <h4 className="font-bold text-zinc-800 flex items-center gap-1">
              <HelpCircle size={14} className="text-zinc-500" />
              Для чего нужен данный калькулятор?
            </h4>
            <p className="leading-relaxed">
              Этот метод применяется инспекторами теплоснабжающих организаций при выявлении бездоговорного потребления, когда на вентиляторах, кондиционерах с притоком воздуха или воздухонагревателях имеются оригинальные шильдики завода-изготовителя, с которых можно достоверно считать объем перемещаемого воздуха <strong>L (м³/ч)</strong>.
            </p>
          </section>
        </div>
      </div>

      {/* Internal Room Temp Modal */}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Справочник норм температур tᵢ</h2>
                </div>
                <button 
                  onClick={() => setIsTiModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Тип помещения / Здания</th>
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
                            {item.note && <div className="text-[10px] text-zinc-400 mt-0.5">{item.note}</div>}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-blue-500 group-hover:text-white">
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

      {/* Outdoor Temp Modal */}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <Thermometer size={16} />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Территориальный справочник t₀ (СНиП)</h2>
                </div>
                <button 
                  onClick={() => setIsToModalOpen(false)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="overflow-hidden rounded-xl border border-zinc-100">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <th className="px-4 py-3">Нормативный период строительства</th>
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
                            {item.note && <div className="text-[10px] text-zinc-400 mt-0.5">{item.note}</div>}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-blue-500 group-hover:text-white">
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

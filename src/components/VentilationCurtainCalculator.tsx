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
  Scale,
  Copy,
  Check,
  User,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VentilationCurtainInputs } from '../types';
import { DEFAULT_VENTILATION_CURTAIN_INPUTS } from '../constants';
import { DENSITY_DATA } from '../densityData';
import { TO_DATA, TI_DATA } from '../q0Data';
import { InputField } from './InputField';

interface VentilationCurtainCalculatorProps {
  inputs: VentilationCurtainInputs;
  setInputs: React.Dispatch<React.SetStateAction<VentilationCurtainInputs>>;
  onBack: () => void;
}

// Get air density based on temperature using provided table data
const getAirDensity = (t: number) => {
  const temps = Object.keys(DENSITY_DATA).map(Number).sort((a, b) => a - b);
  const minT = temps[0];
  const maxT = temps[temps.length - 1];

  if (t <= minT) return DENSITY_DATA[minT];
  if (t >= maxT) return DENSITY_DATA[maxT];

  // Linear interpolation
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

export const VentilationCurtainCalculator: React.FC<VentilationCurtainCalculatorProps> = ({ 
  inputs, 
  setInputs,
  onBack
}) => {
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isTiModalOpen, setIsTiModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({
    1: true,
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

  const q_const = 0.6;
  const mu_const = 0.25;
  const g_const = 9.8;
  const cz_const = 0.29; // kcal/(m3 * °C)

  const calculation = useMemo(() => {
    const { height, width, ti, to, curtainType } = inputs;
    
    const tz = curtainType === 'door' ? 50 : 70;

    // 1. Area of opening
    const Fpr = height * width;

    // 2. Densities
    const rhoN = getAirDensity(to);
    const rhoV = getAirDensity(ti);
    
    // Mixture temperature is assumed to be indoor temperature
    const rhoSm = getAirDensity(ti);

    // 3. Pressure difference
    const deltaP = 0.5 * height * (rhoN - rhoV) * g_const;

    // 4. Air quantity (ensure deltaP*rhoSm is >= 0 to avoid NaN in sqrt)
    const insideSqrt = Math.max(0, deltaP * rhoSm);
    const Lz = 5112 * q_const * mu_const * Fpr * Math.sqrt(insideSqrt);

    // 5. Heat load
    const totalGcal = Lz * cz_const * (tz - to) * 1e-6;
    const totalMW = totalGcal / 0.859845;

    return {
      Fpr,
      rhoN,
      rhoV,
      rhoSm,
      deltaP,
      insideSqrt,
      Lz,
      tz,
      totalGcal: Math.round(totalGcal * 1000000) / 1000000,
      totalMW: Math.round(totalMW * 1000) / 1000,
      timestamp: new Date().toLocaleString(),
    };
  }, [inputs]);

  const handleReset = () => {
    if (confirm('Сбросить все данные до значений по умолчанию?')) {
      setInputs(DEFAULT_VENTILATION_CURTAIN_INPUTS);
    }
  };

  const generateReportText = () => {
    const { height, width, ti, to, curtainType } = inputs;
    const userRoleText = isSimpleConsumer 
      ? 'Потребитель' 
      : `Сотрудник: ${compilerName || 'Не указан'}\nДолжность: ${compilerPosition || 'Не указана'}`;
    const addressText = objectAddress || 'Не указан';

    return `
РАСЧЕТ ТЕПЛОВОЙ НАГРУЗКИ НА ТЕПЛОВУЮ ЗАВЕСУ (СНиП)
==================================================
Дата: ${calculation.timestamp}
Адрес объекта: ${addressText}
Исполнитель: ${userRoleText}

==================================================
1. ИСХОДНЫЕ ДАННЫЕ:
-------------------
Тип проема: ${curtainType === 'door' ? 'Наружная дверь (tз = 50°C)' : 'Ворота/Технологический проем (tз = 70°C)'}
Размеры проема:
  - Высота (hпр): ${height} м
  - Ширина (wпр): ${width} м
Температуры:
  - Внутренняя (ti): ${ti} °C
  - Наружная (to): ${to} °C

Постоянные коэффициенты:
  - Удельная теплоемкость воздуха (сз): ${cz_const} ккал/(м³·°C)
  - Отношение расходов (q): ${q_const}
  - Коэффициент расхода (µпр): ${mu_const}
  - Ускорение сп. падения (g): ${g_const} м/с²

2. ПОШАГОВЫЙ РАСЧЕТ И ФОРМУЛЫ:
-------------------------------
Шаг 2.1: Площадь проема (Fпр)
  Формула: Fпр = hпр · wпр
  Расчет: Fпр = ${height} · ${width} = ${calculation.Fpr.toFixed(3)} м²

Шаг 2.2: Плотность воздуха (из справочной таблицы)
  - Плотность наружного (ρн) при to = ${to}°C: ${calculation.rhoN.toFixed(4)} кг/м³
  - Плотность внутреннего (ρв) при ti = ${ti}°C: ${calculation.rhoV.toFixed(4)} кг/м³
  - Плотность смеси (ρсм) при температуре ti = ${ti}°C: ${calculation.rhoSm.toFixed(4)} кг/м³

Шаг 2.3: Разность давлений (∆p)
  Формула: ∆p = 0.5 · hпр · (ρн – ρв) · g
  Расчет: ∆p = 0.5 · ${height} · (${calculation.rhoN.toFixed(4)} - ${calculation.rhoV.toFixed(4)}) · ${g_const} = ${calculation.deltaP.toFixed(2)} Па

Шаг 2.4: Расход воздуха завесы (Lз)
  Формула: Lз = 5112 · q · µпр · Fпр · √(∆p · ρсм)
  Расчет: Lз = 5112 · ${q_const} · ${mu_const} · ${calculation.Fpr.toFixed(3)} · √(${calculation.deltaP.toFixed(2)} · ${calculation.rhoSm.toFixed(4)}) = ${calculation.Lz.toFixed(0)} кг/ч

Шаг 2.5: Максимальная тепловая нагрузка завесы (Qоз)
  Формула: Qоз = Lз · сз · (tз – to) · 10⁻⁶
  Расчет: Qоз = ${calculation.Lz.toFixed(0)} · ${cz_const} · (${calculation.tz} - (${to})) · 10⁻⁶ = ${calculation.totalGcal} Гкал/ч

3. РЕЗУЛЬТАТ:
-------------
Общая тепловая нагрузка на завесу: ${calculation.totalGcal} Гкал/ч (${calculation.totalMW} МВт)
==================================================
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
    link.download = `heat_curtain_snip_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isWinterWarning = inputs.to >= inputs.ti;

  const toggleStep = (stepIndex: number) => {
    setOpenSteps(prev => ({ ...prev, [stepIndex]: !prev[stepIndex] }));
  };

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
          Установление максимальной тепловой нагрузки на тепловую завесу
        </h1>
        <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
          Тематический расчет согласно СНиП. Физическая модель тепловой завесы рассчитывает объём подаваемого воздуха в зависимости от перепада давлений и разницы плотностей.
        </p>
        <div className="h-1 w-20 rounded-full bg-orange-500" />
      </div>

      {isWinterWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 animate-pulse">
          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Внимание! Температура снаружи выше или равна внутренней.</span>
            <p className="mt-1 opacity-90">Завеса устанавливается для защиты проемов в холодный период года (когда t<sub>o</sub> меньше t<sub>i</sub>). При нормальном расчете перепад плотностей должен вызывать приток холодного воздуха.</p>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Inputs & Visual Curtain Diagram */}
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

          {/* Opening Parameters Card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Maximize2 size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Параметры проема</h2>
            </div>
            
            <div className="grid gap-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">Тип защищаемого проема</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, curtainType: 'door' }))}
                    className={`rounded-xl border-2 py-3 text-xs font-bold transition-all ${inputs.curtainType === 'door' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                  >
                    Входная дверь (+50°C)
                  </button>
                  <button
                    onClick={() => setInputs(prev => ({ ...prev, curtainType: 'gate' }))}
                    className={`rounded-xl border-2 py-3 text-xs font-bold transition-all ${inputs.curtainType === 'gate' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200'}`}
                  >
                    Ворота предприятия (+70°C)
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField 
                  label={<span>h<sub>пр</sub> — Высота проема</span>} 
                  id="height" 
                  value={inputs.height} 
                  onChange={(val) => setInputs(prev => ({ ...prev, height: val }))}
                  suffix="м"
                  hint="Высота открываемого проема здания напольного или воротного типа."
                />

                <InputField 
                  label={<span>w<sub>пр</sub> — Ширина проема</span>} 
                  id="width" 
                  value={inputs.width} 
                  onChange={(val) => setInputs(prev => ({ ...prev, width: val }))}
                  suffix="м"
                  hint="Ширина открываемого проема."
                />
              </div>
            </div>
          </section>

          {/* Temperature Parameters Card */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
              <Thermometer size={18} className="text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Температуры среды</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <InputField 
                label={<span>t<sub>i</sub> — В помещении</span>} 
                id="ti" 
                value={inputs.ti} 
                onChange={(val) => setInputs(prev => ({ ...prev, ti: val }))}
                suffix="°C"
                hint="Регламентируемая температура во внутреннем пространстве в зимний период."
                action={
                  <button 
                    onClick={() => setIsTiModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник нормативов"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />

              <InputField 
                label={<span>t<sub>o</sub> — На улице</span>} 
                id="to" 
                value={inputs.to} 
                onChange={(val) => setInputs(prev => ({ ...prev, to: val }))}
                suffix="°C"
                hint="Температура наружного воздуха. Должна быть ниже внутренней."
                action={
                  <button 
                    onClick={() => setIsToModalOpen(true)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Справочник t₀"
                  >
                    <BookOpen size={14} />
                  </button>
                }
              />
            </div>
          </section>
        </div>

        {/* Right Column: Calculations & Results Walkthrough */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Big Output Dashboard */}
          <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl border border-zinc-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-28 w-28 bg-orange-500/10 blur-2xl" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                <Wind size={14} className="text-orange-400" />
                Тепловая нагрузка завесы
              </span>
              <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-400 border border-orange-500/20">
                СНиП 23-01-99*
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-light tracking-tight">{calculation.totalGcal.toFixed(4)}</span>
              <span className="text-lg font-bold text-zinc-400 uppercase">Гкал/час</span>
            </div>

            <p className="mt-1 text-xs text-zinc-400">
              Эквивалентная мощность в ваттах: <span className="font-mono font-bold text-zinc-200">{calculation.totalMW.toFixed(3)} МВт</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-400">
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-wide">Расход воздуха L<sub>з</sub></p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {calculation.Lz.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[11px] font-medium text-zinc-500">кг/ч</span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-500 uppercase tracking-wide">Температура смеси t<sub>см</sub></p>
                <p className="font-mono text-base font-bold text-white mt-1">
                  {inputs.ti} <span className="text-[11px] font-medium text-zinc-500">°C</span>
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Steps Breakdown */}
          <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                Детальная калькуляция: Как получились эти цифры?
              </h3>
              <span className="text-[11px] text-zinc-400">Буквы кликабельны</span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Формула СНиП разбита на пять последовательных физических шагов. Ниже представлена полная трассировка математических расчётов с подставленными числами.
            </p>

            {/* Step 1 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(1)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">Шаг 1. Геометрическая площадь</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    F<sub>пр</sub> = h<sub>пр</sub> · w<sub>пр</sub>
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-900 text-sm">{calculation.Fpr.toFixed(2)} м²</span>
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
                      <p>Подставляем площади проема:</p>
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        F<sub>пр</sub> = {inputs.height}м × {inputs.width}м = <span className="font-bold text-zinc-900">{calculation.Fpr.toFixed(3)} м²</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">Коэффициент определяет общую плоскость, защищаемую тепловым вентилятором.</p>
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
                  <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">Шаг 2. Плотность воздуха по температуре</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Определение ρ<sub>н</sub> и ρ<sub>в</sub>
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-400 text-xs">Таблица плотности</span>
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
                    <div className="p-4 text-xs text-zinc-600 space-y-3">
                      <p>Плотность воздуха нелинейно увеличивается при охлаждении. Справочные значения из СНиП получены методом линейной интерполяции:</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
                          <p className="text-[10px] uppercase font-bold text-sky-600">На улице (to = {inputs.to}°C)</p>
                          <p className="font-mono font-bold text-zinc-900 text-sm mt-1">ρ<sub>н</sub> = {calculation.rhoN.toFixed(4)} кг/м³</p>
                        </div>
                        <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                          <p className="text-[10px] uppercase font-bold text-orange-600">В помещении (ti = {inputs.ti}°C)</p>
                          <p className="font-mono font-bold text-zinc-900 text-sm mt-1">ρ<sub>в</sub> = {calculation.rhoV.toFixed(4)} кг/м³</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-zinc-50 p-3 text-[11px] space-y-1">
                        <span className="font-semibold text-zinc-800">Плотность смеси на выходе из открытого отверстия:</span>
                        <p>ρ<sub>см</sub> принимается при температуре смеси, равной внутренней температуре t<sub>i</sub> = {inputs.ti}°С. <br />
                        Следовательно, ρ<sub>см</sub> = ρ<sub>в</sub> = <span className="font-bold">{calculation.rhoSm.toFixed(4)} кг/м³</span>.</p>
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
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Шаг 3. Естественная разность давлений</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    ∆p = 0.5 · h<sub>пр</sub> · (ρ<sub>н</sub> – ρ<sub>в</sub>) · g
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-900 text-sm">{calculation.deltaP.toFixed(2)} Па</span>
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
                       <p>Формула определяет гравитационное давление, образующееся из-за разной массы теплого и холодного воздуха ворот:</p>
                      
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        ∆p = 0.5 · {inputs.height} · ({calculation.rhoN.toFixed(4)} - {calculation.rhoV.toFixed(4)}) · {g_const} <br />
                        ∆p = 0.5 · {inputs.height} · {Math.max(0, calculation.rhoN - calculation.rhoV).toFixed(4)} · {g_const} = <span className="font-bold text-zinc-900">{calculation.deltaP.toFixed(2)} Па</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 4 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(4)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Шаг 4. Количество подаваемого воздуха</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    L<sub>з</sub> = 5112 · q · µ<sub>пр</sub> · F<sub>пр</sub> · √(∆p · ρ<sub>см</sub>)
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-900 text-sm">{Math.round(calculation.Lz).toLocaleString()} кг/ч</span>
                  {openSteps[4] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence>
                {openSteps[4] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-600 space-y-2">
                      <p>Расчет массы воздуха, подаваемой вентиляторами завесы:</p>
                      
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        Коэффициенты методики:<br />
                        - q (соотношение расходов) = {q_const}<br />
                        - µ<sub>пр</sub> (коэффициент расхода) = {mu_const}<br /><br />
                        Вычисление:<br />
                        L<sub>з</sub> = 5112 · {q_const} · {mu_const} · {calculation.Fpr.toFixed(3)} · √({calculation.deltaP.toFixed(2)} · {calculation.rhoSm.toFixed(4)})<br />
                        L<sub>з</sub> = 5112 · 0.15 · {calculation.Fpr.toFixed(3)} · √{(calculation.insideSqrt).toFixed(4)}<br />
                        L<sub>з</sub> = <span className="font-bold text-zinc-900">{calculation.Lz.toFixed(1)} кг/ч</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 5 */}
            <div className="border border-zinc-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleStep(5)}
                className="w-full bg-zinc-50/50 hover:bg-zinc-50 p-4 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Шаг 5. Максимальная теплоемкость</span>
                  <h4 className="font-bold text-sm text-zinc-900">
                    Q<sub>оз</sub> = L<sub>з</sub> · c<sub>з</sub> · (t<sub>з</sub> – t<sub>o</sub>) · 10⁻⁶
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-950 text-sm">{calculation.totalGcal} Гкал/ч</span>
                  {openSteps[5] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <AnimatePresence>
                {openSteps[5] && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white border-t border-zinc-100"
                  >
                    <div className="p-4 text-xs text-zinc-600 space-y-2">
                      <p>Преобразование воздушных масс в искомую тепловую нагрузку с переводом в Гкал:</p>
                      
                      <div className="bg-zinc-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                        с<sub>з</sub> (удельная теплоемкость воздуха) = {cz_const} ккал/(м³·°C)<br />
                        t<sub>з</sub> (температура завесы) = {calculation.tz} °C на выходе ({inputs.curtainType === 'door' ? 'дверь' : 'ворота'})<br />
                        Разница температур наружного воздуха и струи: ({calculation.tz} - ({inputs.to})) = {calculation.tz - inputs.to} °C<br /><br />
                        
                        Q<sub>оз</sub> = {calculation.Lz.toFixed(1)} · {cz_const} · {calculation.tz - inputs.to} · 10⁻⁶ <br />
                        Q<sub>оз</sub> = <span className="font-bold text-zinc-900">{calculation.totalGcal} Гкал/ч</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Quick Help on Constants */}
          <section className="bg-zinc-50 rounded-2xl border border-zinc-100 p-5 text-xs text-zinc-600 space-y-3.5">
            <h4 className="font-bold text-zinc-800 flex items-center gap-1">
              <Scale size={14} className="text-zinc-500" />
              Физико-математические константы методики
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2 text-[11px]">
              <div className="bg-white rounded-lg p-2.5 border border-zinc-200/50">
                <span className="font-bold text-zinc-900">q = 0.6</span>
                <p className="text-zinc-400 mt-0.5">Отношение расхода воздуха подаваемого тепловой струей к расходу через открытое отверстие.</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-zinc-200/50">
                <span className="font-bold text-zinc-900">µ<sub>пр</sub> = 0.25</span>
                <p className="text-zinc-400 mt-0.5">Коэффициент расхода струи, характеризующий аэродинамическое сжатие потока воздуха.</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-zinc-200/50 col-span-2">
                <span className="font-bold text-zinc-900">с<sub>з</sub> = 0.29 ккал/(м³·°C)</span>
                <p className="text-zinc-400 mt-0.5">Принятая методологией удельная теплоемкость выходящего горячего воздуха завес.</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Internal Room Temperature Info Modal */}
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
                            <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono font-bold text-zinc-900 transition-colors group-hover:bg-orange-500 group-hover:text-white">
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

      {/* Outdoor Climate Temperature Info Modal */}
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
